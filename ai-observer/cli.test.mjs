import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import { RunManager, createSummary, estimateTokens, hashText, main, sanitizeText } from "./cli.mjs";

function makeGitRepo() {
  const cwd = mkdtempSync(join(tmpdir(), "ai-observer-"));
  spawnSync("git", ["init"], { cwd, encoding: "utf8" });
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd, encoding: "utf8" });
  spawnSync("git", ["config", "user.name", "Test"], { cwd, encoding: "utf8" });
  writeFileSync(join(cwd, "README.md"), "hello\n");
  spawnSync("git", ["add", "README.md"], { cwd, encoding: "utf8" });
  spawnSync("git", ["commit", "-m", "init"], { cwd, encoding: "utf8" });
  return cwd;
}

test("sanitizeText redacts common secret shapes", () => {
  const text = "Authorization: Bearer abcdefghijklmnop password=hunter2 API_KEY=secret123";
  const sanitized = sanitizeText(text, { CUSTOM_TOKEN: "env-secret-value" });
  assert.equal(sanitized.includes("abcdefghijklmnop"), false);
  assert.equal(sanitized.includes("hunter2"), false);
  assert.equal(sanitized.includes("secret123"), false);
});

test("RunManager creates append-only sequenced events", () => {
  const cwd = makeGitRepo();
  const runManager = new RunManager({ cwd, task: "sequence-test" }).start();
  runManager.event("custom.one");
  runManager.event("custom.two");
  runManager.finish("completed");

  const events = readFileSync(join(runManager.runDir, "events.jsonl"), "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));

  assert.deepEqual(events.map((event) => event.seq), [1, 2, 3, 4, 5, 6]);
});

test("run command captures lifecycle and failed attempt context", async () => {
  const cwd = makeGitRepo();
  const { exitCode, summary, runDir } = await main(
    ["run", "--task", "failing-command", "--", process.execPath, "-e", "console.error('nope'); process.exit(2)"],
    cwd,
  );

  assert.equal(exitCode, 2);
  assert.equal(summary.status, "failed");
  assert.equal(summary.commands, 1);
  assert.equal(summary.failedCommands, 1);
  assert.equal(summary.failedAttemptTokens > 0, true);
  assert.match(readFileSync(join(runDir, "commands.jsonl"), "utf8"), /command.end/);
});

test("summary detects repeated context by content hash", () => {
  const cwd = makeGitRepo();
  const runManager = new RunManager({ cwd, task: "repeat-test" }).start();
  const content = "same terminal output";

  for (const source of ["cmd-001.stdout", "cmd-002.stdout"]) {
    runManager.appendContext({
      seq: runManager.nextSeq(),
      timestamp: new Date().toISOString(),
      type: "context.capture",
      runId: runManager.runId,
      contextType: "terminal_output",
      source,
      tokens: estimateTokens(content),
      tokenSource: "estimated",
      contentHash: hashText(content),
    });
  }

  runManager.finish("completed");
  const summary = createSummary(runManager.runDir);
  assert.equal(summary.repeatedContext.tokens, estimateTokens(content));
  assert.equal(summary.topRepeated[0].timesIncluded, 2);
});
