#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const RUNS_DIR = join(".ai", "runs");
const LIMITATION =
  "Codex model requests, exact token usage, and internal file-read/search tool calls are not observable from this repository-level wrapper.";

export function sanitizeText(input, env = process.env) {
  let output = String(input);
  const secretValues = Object.entries(env)
    .filter(([key, value]) => /(key|token|secret|password|cookie|credential)/i.test(key) && String(value).length >= 6)
    .map(([, value]) => String(value));

  for (const secretValue of secretValues) {
    output = output.split(secretValue).join("[REDACTED]");
  }

  return output
    .replace(/-----BEGIN [\s\S]*?PRIVATE KEY-----[\s\S]*?-----END [\s\S]*?PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Authorization: Bearer [REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [REDACTED]")
    .replace(/\b(api[_-]?key|password|passwd|secret|token|cookie)\s*[:=]\s*['\"]?[^'\"\s,;]+/gi, "$1=[REDACTED]");
}

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}

export function hashText(text) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}

function runGit(args, cwd) {
  const git = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    exitCode: git.status ?? 1,
    stdout: sanitizeText(git.stdout ?? ""),
    stderr: sanitizeText(git.stderr ?? ""),
  };
}

function getGitSnapshot(cwd) {
  return {
    head: runGit(["rev-parse", "HEAD"], cwd).stdout.trim() || null,
    statusShort: runGit(["status", "--short"], cwd).stdout,
    diff: runGit(["diff"], cwd).stdout,
    diffNameStatus: runGit(["diff", "--name-status", "HEAD"], cwd).stdout,
    capturedAt: new Date().toISOString(),
  };
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function appendJsonl(filePath, data) {
  appendFileSync(filePath, `${JSON.stringify(data)}\n`);
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function createRunId(task) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = (task || "ai-run")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${timestamp}_${slug || "ai-run"}`;
}

export class RunManager {
  constructor({ cwd = process.cwd(), task = "ai-run", prompt = "" } = {}) {
    this.cwd = resolve(cwd);
    this.task = task;
    this.prompt = prompt;
    this.runId = createRunId(task);
    this.runDir = join(this.cwd, RUNS_DIR, this.runId);
    this.seq = 0;
    this.startedAt = new Date().toISOString();
    this.metadata = {
      runId: this.runId,
      task,
      prompt: prompt ? sanitizeText(prompt) : "",
      cwd: this.cwd,
      status: "running",
      startedAt: this.startedAt,
      endedAt: null,
      gitHead: null,
      limitation: LIMITATION,
    };
  }

  start() {
    mkdirSync(join(this.runDir, "terminal"), { recursive: true });
    for (const fileName of ["events.jsonl", "commands.jsonl", "files.jsonl", "tokens.jsonl", "context.jsonl"]) {
      writeFileSync(join(this.runDir, fileName), "");
    }

    const gitBefore = getGitSnapshot(this.cwd);
    this.metadata.gitHead = gitBefore.head;
    writeJson(join(this.runDir, "metadata.json"), this.metadata);
    writeJson(join(this.runDir, "git-before.json"), gitBefore);
    this.event("run.start", { task: this.task });
    this.event("observability.limitation", { message: LIMITATION });
    const tokenEvent = {
      seq: this.nextSeq(),
      timestamp: new Date().toISOString(),
      type: "model.usage",
      runId: this.runId,
      requestId: null,
      usageSource: "unavailable",
      limitation: LIMITATION,
    };
    appendJsonl(join(this.runDir, "tokens.jsonl"), tokenEvent);
    appendJsonl(join(this.runDir, "events.jsonl"), tokenEvent);
    return this;
  }

  nextSeq() {
    this.seq += 1;
    return this.seq;
  }

  event(type, fields = {}) {
    const event = {
      seq: this.nextSeq(),
      timestamp: new Date().toISOString(),
      type,
      runId: this.runId,
      ...fields,
    };
    appendJsonl(join(this.runDir, "events.jsonl"), event);
    return event;
  }

  appendCommand(commandEvent) {
    appendJsonl(join(this.runDir, "commands.jsonl"), commandEvent);
  }

  appendContext(contextEvent) {
    appendJsonl(join(this.runDir, "context.jsonl"), contextEvent);
    appendJsonl(join(this.runDir, "events.jsonl"), contextEvent);
  }

  finish(status) {
    const endedAt = new Date().toISOString();
    const gitAfter = getGitSnapshot(this.cwd);
    writeJson(join(this.runDir, "git-after.json"), gitAfter);
    writeFileSync(join(this.runDir, "changes.patch"), gitAfter.diff);
    this.writeFileEvents(gitAfter.diffNameStatus);
    this.event("run.end", { status });
    this.metadata = { ...this.metadata, status, endedAt };
    writeJson(join(this.runDir, "metadata.json"), this.metadata);
    const summary = createSummary(this.runDir);
    writeJson(join(this.runDir, "summary.json"), summary);
    return summary;
  }

  writeFileEvents(diffNameStatus) {
    for (const line of diffNameStatus.split(/\r?\n/).filter(Boolean)) {
      const [statusCode, firstPath, secondPath] = line.split(/\t/);
      const eventType =
        statusCode === "A" ? "file.create" :
        statusCode === "D" ? "file.delete" :
        statusCode?.startsWith("R") ? "file.rename" :
        "file.modify";
      const fileEvent = this.event(eventType, {
        path: secondPath || firstPath,
        oldPath: secondPath ? firstPath : undefined,
        source: "git-diff",
      });
      appendJsonl(join(this.runDir, "files.jsonl"), fileEvent);
    }
  }
}

export function createSummary(runDir) {
  const metadata = JSON.parse(readFileSync(join(runDir, "metadata.json"), "utf8"));
  const commands = readJsonl(join(runDir, "commands.jsonl")).filter((event) => event.type === "command.end");
  const files = readJsonl(join(runDir, "files.jsonl"));
  const contexts = readJsonl(join(runDir, "context.jsonl"));
  const tokens = readJsonl(join(runDir, "tokens.jsonl"));
  const started = Date.parse(metadata.startedAt);
  const ended = metadata.endedAt ? Date.parse(metadata.endedAt) : Date.now();
  const contextByType = {};
  const contextBySource = new Map();

  for (const context of contexts) {
    const tokensEstimated = context.tokens ?? 0;
    contextByType[context.contextType] = (contextByType[context.contextType] ?? 0) + tokensEstimated;
    const key = context.contentHash || `${context.contextType}:${context.source}`;
    const current = contextBySource.get(key) ?? {
      source: context.source,
      tokens: 0,
      timesIncluded: 0,
      tokensPerInclude: tokensEstimated,
    };
    current.tokens += tokensEstimated;
    current.timesIncluded += 1;
    current.tokensPerInclude = Math.max(current.tokensPerInclude, tokensEstimated);
    contextBySource.set(key, current);
  }

  const repeatedEntries = [...contextBySource.values()]
    .filter((entry) => entry.timesIncluded > 1)
    .map((entry) => ({
      ...entry,
      estimatedRepeatedTokens: entry.tokensPerInclude * (entry.timesIncluded - 1),
    }))
    .sort((left, right) => right.estimatedRepeatedTokens - left.estimatedRepeatedTokens);

  const inputTokens = sum(tokens, "inputTokens");
  const cachedInputTokens = sum(tokens, "cachedInputTokens");
  const outputTokens = sum(tokens, "outputTokens");
  const totalTokens = sum(tokens, "totalTokens");
  const failedCommands = commands.filter((command) => command.exitCode !== 0);
  const failedCommandIds = new Set(failedCommands.map((command) => command.id));
  const failedAttemptTokens = contexts
    .filter((context) => failedCommandIds.has(context.commandId))
    .reduce((total, context) => total + (context.tokens ?? 0), 0);

  return {
    runId: metadata.runId,
    task: metadata.task,
    status: metadata.status,
    durationMs: Math.max(0, ended - started),
    modelCalls: tokens.filter((token) => token.requestId).length,
    commands: commands.length,
    failedCommands: failedCommands.length,
    files: {
      read: files.filter((file) => file.type === "file.read").length,
      created: files.filter((file) => file.type === "file.create").length,
      modified: files.filter((file) => file.type === "file.modify").length,
      deleted: files.filter((file) => file.type === "file.delete").length,
      renamed: files.filter((file) => file.type === "file.rename").length,
    },
    tokens: {
      input: inputTokens,
      cachedInput: cachedInputTokens,
      output: outputTokens,
      total: totalTokens,
      usageSource: totalTokens > 0 ? "measured-or-estimated-from-events" : "unavailable",
    },
    contextByType,
    repeatedContext: {
      tokens: sum(repeatedEntries, "estimatedRepeatedTokens"),
      ratio: inputTokens > 0 ? sum(repeatedEntries, "estimatedRepeatedTokens") / inputTokens : 0,
    },
    failedAttemptTokens,
    topContextSources: [...contextBySource.values()]
      .sort((left, right) => right.tokens - left.tokens)
      .slice(0, 10),
    topRepeated: repeatedEntries.slice(0, 10),
    limitations: {
      modelRequests: "Not observable with current runtime from this wrapper.",
      exactTokens: "Not observable unless Codex exposes usage events.",
      fileReads: "Only Git-inferred file changes are captured automatically.",
    },
  };
}

function sum(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

async function runCommand(runManager, commandArgs) {
  if (commandArgs.length === 0) return 0;

  const commandId = `cmd-${String(readJsonl(join(runManager.runDir, "commands.jsonl")).length + 1).padStart(3, "0")}`;
  const command = commandArgs.join(" ");
  const startedAt = Date.now();
  const startEvent = runManager.event("command.start", {
    id: commandId,
    cwd: runManager.cwd,
    command: sanitizeText(command),
  });
  runManager.appendCommand(startEvent);

  const stdoutPath = join(runManager.runDir, "terminal", `${commandId}.stdout.log`);
  const stderrPath = join(runManager.runDir, "terminal", `${commandId}.stderr.log`);
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let stdoutText = "";
  let stderrText = "";

  const child = spawn(commandArgs[0], commandArgs.slice(1), {
    cwd: runManager.cwd,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    const text = sanitizeText(chunk.toString());
    stdoutBytes += Buffer.byteLength(text);
    stdoutText += text;
    appendFileSync(stdoutPath, text);
    process.stdout.write(text);
  });

  child.stderr.on("data", (chunk) => {
    const text = sanitizeText(chunk.toString());
    stderrBytes += Buffer.byteLength(text);
    stderrText += text;
    appendFileSync(stderrPath, text);
    process.stderr.write(text);
  });

  const exitCode = await new Promise((resolveExitCode) => {
    child.on("error", () => resolveExitCode(1));
    child.on("close", (code) => resolveExitCode(code ?? 1));
  });

  for (const [stream, text] of [["stdout", stdoutText], ["stderr", stderrText]]) {
    if (!text) continue;
    runManager.appendContext({
      seq: runManager.nextSeq(),
      timestamp: new Date().toISOString(),
      type: "context.capture",
      runId: runManager.runId,
      requestId: null,
      contextType: "terminal_output",
      source: `${commandId}.${stream}`,
      commandId,
      tokens: estimateTokens(text),
      tokenSource: "estimated",
      contentHash: hashText(text),
    });
  }

  const endEvent = runManager.event("command.end", {
    id: commandId,
    cwd: runManager.cwd,
    command: sanitizeText(command),
    exitCode,
    durationMs: Date.now() - startedAt,
    stdoutBytes,
    stderrBytes,
  });
  runManager.appendCommand(endEvent);
  return exitCode;
}

function parseRunArgs(args) {
  const separatorIndex = args.indexOf("--");
  const optionArgs = separatorIndex === -1 ? args : args.slice(0, separatorIndex);
  const commandArgs = separatorIndex === -1 ? [] : args.slice(separatorIndex + 1);
  let task = commandArgs.length ? basename(commandArgs[0]) : "ai-run";
  let prompt = "";

  for (let index = 0; index < optionArgs.length; index += 1) {
    if (optionArgs[index] === "--task") {
      task = optionArgs[index + 1] || task;
      index += 1;
    } else if (optionArgs[index] === "--prompt") {
      prompt = optionArgs[index + 1] || "";
      index += 1;
    }
  }

  return { task, prompt, commandArgs };
}

function latestRunId(cwd) {
  const dir = join(cwd, RUNS_DIR);
  if (!existsSync(dir)) return null;
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .at(-1) ?? null;
}

function printSummary(summary) {
  const repeatedRatio = `${(summary.repeatedContext.ratio * 100).toFixed(1)}%`;
  console.log(`AI RUN: ${summary.task}`);
  console.log("");
  console.log(`Duration        ${Math.round(summary.durationMs / 1000)}s`);
  console.log(`Model calls     ${summary.modelCalls}`);
  console.log(`Commands        ${summary.commands}`);
  console.log(`Failed          ${summary.failedCommands}`);
  console.log(`Files changed   ${summary.files.created + summary.files.modified + summary.files.deleted + summary.files.renamed}`);
  console.log("");
  console.log("TOKENS");
  console.log(`Input           ${summary.tokens.input.toLocaleString()}`);
  console.log(`Cached          ${summary.tokens.cachedInput.toLocaleString()}`);
  console.log(`Output          ${summary.tokens.output.toLocaleString()}`);
  console.log(`Total           ${summary.tokens.total.toLocaleString()} (${summary.tokens.usageSource})`);
  console.log("");
  console.log("TOKEN WASTE");
  console.log(`Repeated        ${summary.repeatedContext.tokens.toLocaleString()} (${repeatedRatio})`);
  console.log(`Failed attempts ${summary.failedAttemptTokens.toLocaleString()}`);
  if (summary.topContextSources.length > 0) {
    console.log("");
    console.log("TOP CONTEXT");
    for (const source of summary.topContextSources.slice(0, 5)) {
      console.log(`${source.source.padEnd(24)} ${source.tokens.toLocaleString()}`);
    }
  }
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const [command, ...args] = argv;

  if (command === "run") {
    const { task, prompt, commandArgs } = parseRunArgs(args);
    const runManager = new RunManager({ cwd, task, prompt }).start();
    let exitCode = 0;
    try {
      exitCode = await runCommand(runManager, commandArgs);
      const summary = runManager.finish(exitCode === 0 ? "completed" : "failed");
      console.log(`\nAI observer run: ${relative(cwd, runManager.runDir)}`);
      return { exitCode, summary, runDir: runManager.runDir };
    } catch (error) {
      runManager.event("run.error", { message: sanitizeText(error instanceof Error ? error.message : String(error)) });
      runManager.finish("interrupted");
      throw error;
    }
  }

  if (command === "summary") {
    const requestedRunId = args[0] === "latest" || !args[0] ? latestRunId(cwd) : args[0];
    if (!requestedRunId) throw new Error("No AI observer runs found.");
    const summaryPath = join(cwd, RUNS_DIR, requestedRunId, "summary.json");
    const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
    printSummary(summary);
    return { exitCode: 0, summary, runDir: join(cwd, RUNS_DIR, requestedRunId) };
  }

  console.log("Usage:");
  console.log("  ai-observer run --task <name> -- <command>");
  console.log("  ai-observer summary <run-id|latest>");
  return { exitCode: 1 };
}

if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error(sanitizeText(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    });
}
