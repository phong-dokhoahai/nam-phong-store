# 19. Final Summary

End every task with a concise summary.

The final summary should include:

- result
- activity counts
- verification statuses
- largest observed context sources
- potential waste
- exact token usage or `UNKNOWN`
- final status

---

# 20. Logging Efficiency

Logging itself must remain lightweight.

Do not:

- copy entire source files
- copy entire documentation files
- paste huge terminal output
- duplicate the same information across multiple sections
- generate verbose explanations for simple actions

Prefer:

```text
what happened
why it happened
result
```

The log should be detailed enough to audit the work without becoming a second copy of the project.

---

# 21. Source of Truth

For project changes:

```text
actual repository state > Git diff > AI log summary
```

For commands:

```text
actual executed command/result > AI summary
```

For token usage:

```text
runtime-provided token usage > estimate
```

If the log conflicts with observable project state, the observable state is authoritative.

---

# 22. Completion Rule

Before finishing any logged task, the AI MUST verify that the task log contains:

- [ ] request
- [ ] context/files read
- [ ] searches performed
- [ ] execution timeline
- [ ] commands actually executed
- [ ] command failures
- [ ] files created
- [ ] files modified
- [ ] files deleted or renamed
- [ ] errors
- [ ] retries
- [ ] meaningful decisions
- [ ] verification results
- [ ] token information or `UNKNOWN`
- [ ] potential context waste
- [ ] final summary
- [ ] final status

Do not mark the task as completed until the log has been updated.
