---
title: 'Split business rules documentation'
type: 'chore'
created: '2026-09-22'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** `docs/BUSINESS_RULES.md` is too long to navigate comfortably.

**Approach:** Split the existing business rules into focused markdown files under `docs/business-rules/`, and keep `docs/BUSINESS_RULES.md` as a short navigation page that links to the split files.

</frozen-after-approval>

## Implementation Notes

- Split the original rules into `docs/business-rules/README.md` plus eight domain files.
- Replaced `docs/BUSINESS_RULES.md` with a short navigation page linking to the split files.
- Added section ranges to the navigation tables, backlinks from child files, and cross-references between related sales, inventory, purchasing, debt, and payment rules.
- Normalized child document outlines so each child file has one H1 and numbered rules are H2.
- Verified the split against the original git version: original top-level rule count `102`, split top-level rule count `102`, unique split top-level rule count `102`.

## Review Triage Log

- medium/patch: Navigation tables did not show original rule ranges; added a `Mục` column in both indexes.
- medium/patch: `01-foundations.md` still referred to `BUSINESS_RULES.md` as the only rules file; changed it to point to the split rules set via `../BUSINESS_RULES.md`.
- low/patch: Section numbering jumps from 87 to 89 because the source document had no section 88; added a note in `01-foundations.md`.
- medium/patch: Supplier debt rules in purchasing could be missed from the debt/payment file; added cross-references between `04-purchasing.md` and `06-debt-and-payments.md`.
- medium/patch: Sales rules did not point to inventory export confirmation rules; added a cross-reference from `05-sales.md` to `03-inventory.md`.
- low/patch: Child files had duplicate H1-level outlines after the split; normalized imported numbered rules to H2.
- low/patch: Child files had no backlink to the root navigation; added backlinks after each file title.
- false: Spec status was still `in-progress` during implementation; finalize step sets it to `done`.
- low/patch: Verification note said only “section count”; clarified it as top-level rule count.
