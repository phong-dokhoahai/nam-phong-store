---
title: 'Split coding rules documentation'
type: 'chore'
created: '2026-09-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** `docs/CODING_RULES.md` is too long to navigate comfortably.

**Approach:** Split the existing coding rules into focused markdown files under `docs/coding-rules/`, and keep `docs/CODING_RULES.md` as a short navigation page that links to the split files.

</frozen-after-approval>

## Implementation Notes

- Split the original coding rules into `docs/coding-rules/README.md` plus eight focused rule files.
- Replaced `docs/CODING_RULES.md` with a short navigation page linking to the split files.
- Added section ranges to the navigation tables and backlinks from child files to the root navigation.
- Normalized child document outlines so each child file has one H1 and numbered rules are H2.
- Verified the split against the original git version: original top-level rule count `87`, split top-level rule count `87`, unique split top-level rule count `87`.

## Review Triage Log

- medium/patch: The instruction for AI agents to read “bộ rule này” was ambiguous after the split; clarified that agents read the navigation file plus task-relevant child files, or all files for broad cross-layer work.
- low/patch: `docs/coding-rules/README.md` had no backlink to `../CODING_RULES.md`; added one for consistent navigation.
- medium/patch: The priority section treated split documents as single files; clarified that `BUSINESS_RULES.md` and `CODING_RULES.md` include their linked split files.
- low/patch: Existing document references were plain code text; linked available docs where the targets exist and left missing `PROJECT.md` as plain text to avoid a dead link.
- medium/patch: Business logic references to business rules lacked split cross-references; added links to the relevant business-rule child files for inventory, purchasing, sales, debt, and payments.
- medium/patch: Frontend sorting rule mentioned dynamic SQL without backend cross-reference; added a link to backend validation/security rules.
- false: Spec status was still `in-progress` during implementation; finalize step sets it to `done`.
