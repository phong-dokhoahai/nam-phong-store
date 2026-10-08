# 5. Required Log Structure

Every task log MUST contain the following sections:

```text
Metadata
Request
Context Used
Execution Timeline
Commands
File Changes
Errors and Retries
Decisions
Verification
Token / Context Observations
Potential Context Waste
Final Summary
```

Sections with no data must still exist and contain `None.` or `UNKNOWN` when the information cannot be determined.

---

# 6. Metadata

Start every log with:

```md
# AI Execution Log

## Metadata

- Date:
- Task:
- Status:
- Working directory:
- Branch:
- Starting commit:
```

Allowed status values:

```text
IN_PROGRESS
COMPLETED
PARTIAL
FAILED
INTERRUPTED
```

Do not use `COMPLETED` unless the requested work has actually been completed.

If Git information is unavailable, use `UNKNOWN`.

---

# 7. Request

Record the task requested by the user.

Keep it concise but preserve the actual intent. For large prompts, summarize the task and reference the source specification instead of copying the whole prompt.

---

# 8. Context Used

Record every meaningful project context source inspected while working.

Context sources include project instructions, documentation, source code, configuration, tests, error output, search results, Git diff, and previous implementation relevant to the task.

Record files and searches with their purpose. If a specific file range is known, record it. Do not copy full file contents into the log.

---

# 9. Execution Timeline

Record actions in execution order.

Use the following action vocabulary whenever possible:

```text
READ
SEARCH
CREATE
MODIFY
DELETE
RENAME
MOVE
COMMAND
TEST
LINT
TYPECHECK
BUILD
INSTALL
ERROR
RETRY
REVERT
DECISION
VERIFY
```

The timeline should make it possible to reconstruct the sequence of work. Do not combine unrelated actions into vague entries.

---

# 10. Commands

Every command actually executed MUST be recorded.

For each command record:

- command
- working directory
- purpose
- exit code if known
- result

For failed commands, keep the failed result visible. Do not include huge stdout/stderr output unless necessary to understand the failure.

---

# 11. File Changes

Record every file created, modified, deleted, renamed, or moved.

Use separate subsections for created, modified, deleted, and renamed files. Include the reason and a concise list of changes.

Do not paste the entire file. Do not paste a full Git diff unless specifically needed.

---

# 12. Errors and Retries

Every meaningful error must remain visible in the log.

For each attempt, record the action, result, error, likely cause if known, and action taken.

Do not hide failed attempts after the issue is resolved.

---

# 13. Decisions

Record meaningful engineering decisions made during implementation.

Only record decisions that affect architecture, public APIs, data structures, dependencies, project conventions, performance, security, maintainability, or future work.

Do not record trivial decisions such as variable naming unless they materially affect the implementation.
