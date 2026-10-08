# 14. Verification

Record checks that were actually performed.

Allowed statuses:

```text
PASS
FAIL
NOT RUN
NOT APPLICABLE
```

Never mark something as `PASS` if the command was not executed.

---

# 15. Token / Context Observations

The AI must NOT invent token numbers.

Use exact token information only if the current runtime or tool explicitly exposes it.

When exact token information is unavailable, use:

```text
UNKNOWN
```

If making a qualitative observation, label it clearly as an observation, not a measured token count.

Never estimate token counts and present them as exact.

---

# 16. Potential Context Waste

This section is mandatory.

Identify observable behavior that may have caused unnecessary context or token consumption.

Look for repeated file reads, repeated searches, full large-document reads when only one section was needed, very large terminal output, repeated failed commands, debugging loops, loading unrelated files, unnecessary broad searches, rewriting existing code instead of reusing it, and repeatedly revisiting the same decision.

If no obvious waste was observed, write:

```text
No obvious context waste observed.
```

Do not invent inefficiencies merely to fill this section.

---

# 17. Repeated Context Tracking

When practical, count repeated reads/searches during the task.

This table is based on observed access during the task, not exact model token inclusion.

A file being read does NOT prove the entire file was sent to the model.

Do not claim otherwise.

---

# 18. Context Accuracy Rules

Clearly distinguish between:

## Observed

The agent directly performed an action.

## Inferred

The information is derived from behavior but not directly measured.

## Unknown

The runtime does not expose the information.

Never present inferred or unknown data as observed fact.
