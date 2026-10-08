# 1. Purpose

This document defines how AI agents must log project work.

The logging system has two primary goals:

1. Make AI work auditable:
   - what the AI read
   - what the AI searched
   - what the AI changed
   - what commands the AI executed
   - what failed
   - what was retried
   - what decisions were made

2. Help identify inefficient AI usage:
   - unnecessary context reads
   - repeated file reads
   - repeated searches
   - repeated command output
   - excessive debugging loops
   - unnecessarily large context sources
   - other potential token waste

The log is an execution record, not documentation of the feature itself.

---

# 2. When Logging Is Required

A log MUST be created when the AI performs any project work involving:

- reading project files
- searching the codebase
- creating files
- modifying files
- deleting files
- renaming or moving files
- running shell commands
- installing dependencies
- debugging
- running tests
- running lint
- running type checks
- running builds
- modifying configuration
- modifying database files or migrations
- modifying environment-related configuration
- implementing a feature
- fixing a bug
- refactoring code

A log is NOT required for:

- general technical explanations
- conceptual questions
- syntax questions unrelated to project files
- brainstorming without inspecting the project
- discussion that does not interact with the project

---

# 3. Log Location

Each task MUST have its own log file.

Store logs in:

```text
.ai/logs/
```

Naming format:

```text
YYYY-MM-DD_<task-slug>.md
```

If multiple tasks have the same slug on the same day, append an incrementing suffix.

Never overwrite an existing log.

One logical task MUST use one log file.

---

# 4. Core Principles

## 4.1 Log only what actually happened

Never claim that an action occurred unless it actually occurred.

Do not invent commands, tests, file reads, search operations, errors, results, token usage, or verification status.

---

## 4.2 Preserve failures

Failures are part of the execution history.

Do not remove or hide failed commands, failed tests, failed implementation attempts, incorrect assumptions, reverted changes, or retry loops.

The final successful result does not replace previous failed attempts.

---

## 4.3 Do not log internal chain-of-thought

Do not record private reasoning or hidden chain-of-thought.

Instead, record concise engineering decisions.

---

## 4.4 Never log secrets

Never write secret values into logs.

This includes passwords, API keys, access tokens, refresh tokens, Authorization headers, cookies, session tokens, private keys, database credentials, `.env` values, and webhook secrets.

Environment variable names may be logged. Their values must never be logged.

If command output contains secrets, redact them before writing the log:

```text
[REDACTED]
```
