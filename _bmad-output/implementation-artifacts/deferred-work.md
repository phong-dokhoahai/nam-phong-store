- source_spec: `_bmad-output/implementation-artifacts/spec-supabase-table-schema-foundation.md`
  summary: Add an operational first-admin bootstrap path.
  evidence: New auth users are intentionally inactive warehouse staff, while profile activation and role changes require an existing admin; docs say the first admin should be created through Supabase Auth/Dashboard or a safe admin script.
- source_spec: `_bmad-output/implementation-artifacts/spec-supabase-table-schema-foundation.md`
  summary: Add runtime Supabase database tests for migrations, auth profile creation, RLS, and direct-write protections.
  evidence: Docker/Podman is not installed or on PATH in this environment, so `supabase db reset` and role-based database assertions could not run; static migration checks cannot prove SQL execution or runtime policy behavior.
- source_spec: `_bmad-output/implementation-artifacts/spec-supabase-table-schema-foundation.md`
  summary: Reconcile document header totals from item rows in the transactional RPC implementation slice.
  evidence: This schema foundation includes constraints and direct-write guards, but official subtotal/total recalculation from child rows is explicitly deferred to confirm/cancel/payment RPCs.
