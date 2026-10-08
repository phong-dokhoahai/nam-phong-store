# AI Observer

Local AI execution logging for this repository.

## Run

```bash
npm run ai-observer -- run --task implement-auth -- codex
```

For any shell command:

```bash
npm run ai-observer -- run --task smoke -- npm run build
```

View the latest summary:

```bash
npm run ai-observer -- summary latest
```

Run tests:

```bash
npm run ai-observer:test
```

## Output

Each run writes:

```text
.ai/runs/<run-id>/
  metadata.json
  events.jsonl
  commands.jsonl
  files.jsonl
  tokens.jsonl
  context.jsonl
  git-before.json
  git-after.json
  changes.patch
  summary.json
  terminal/
```

## Support Matrix

Supported:

- Run lifecycle, status, duration, working directory, git HEAD.
- Command start/end, exit code, duration, cwd, stdout/stderr byte counts.
- Terminal stdout/stderr logs saved outside `events.jsonl`.
- Git before/after status and diff.
- File create/modify/delete/rename inferred from Git after the run.
- Secret sanitization for common token/password/cookie/private-key patterns.
- Summary, top context consumers from captured terminal output, repeated context by normalized content hash.

Partially supported:

- Context tracking. The wrapper records terminal output context it can see. It cannot prove what Codex placed into a model prompt.
- Token attribution. Terminal/context token counts are estimated with a simple character heuristic.
- Debug/retry analysis. Failed attempt tokens are estimated from failed command terminal output.

Not observable with current runtime:

- Exact Codex model request count and payloads.
- Exact input, cached input, output, and total model tokens.
- Internal Codex file-read/search tool calls.
- Exact model context inclusion/repetition.

For exact model/context tracing, Codex must expose an execution/tool-layer event stream or a proxy/hook around model requests.
