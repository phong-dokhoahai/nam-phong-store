---
title: 'Implement reusable Supabase authentication'
type: 'feature'
created: '2026-09-23'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '86507fa580f4b47d423dfc054ed95c8826719316'
context:
  - '{project-root}/docs/ARCHITECTURE.md'
  - '{project-root}/docs/DATABASE.md'
  - '{project-root}/docs/CODING_RULES.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The app has Supabase configured but no real authentication flow, so protected data pages can run as `anon` and hit intentional RLS/grant failures such as `permission denied for table categories`. Auth logic also needs to be isolated enough to reuse in another React/Supabase project.

**Approach:** Add a reusable `src/auth` module that owns Supabase email/password sign-in, sign-out, session tracking, profile loading, active-account checks, and route guarding. Wire the existing TailAdmin sign-in and user dropdown UI to that module, then protect dashboard routes before live data pages render.

## Boundaries & Constraints

**Always:** Use Supabase Auth as the only password/session source; keep `src/lib/supabase/client.ts` as the single browser client; never expose `service_role` or secrets; treat frontend guards as UX only because RLS/RPC remain the real authorization layer. A signed-in user whose `profiles.is_active` is false must not reach dashboard business routes.

**Never:** Do not add a custom token system, password hashing, a backend server, new packages, database migrations, admin activation UI, or signup workflow in this story. Do not weaken RLS, grant `anon` table access, or change business permissions to make the UI pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unauthenticated dashboard visit | No Supabase session, user opens `/materials` or `/` | Redirect to `/signin` before page data loads | Preserve destination if simple to do; otherwise redirect to dashboard after login |
| Valid active login | Email/password succeeds and `profiles.is_active = true` | Auth state exposes session, user, profile, `isAuthenticated`, `isActive`; user reaches dashboard | Clear previous auth errors |
| Valid inactive login | Email/password succeeds and profile exists but `is_active = false` | Sign-in page shows an inactive/pending account message and dashboard remains blocked | Do not call protected page data loaders |
| Invalid login | Supabase returns auth error | Stay on sign-in form and show a friendly error | Do not expose stack traces |
| Missing Supabase config | URL/key absent | Auth module reports unavailable state and sign-in shows configuration error | App should not crash |
| Sign out | Authenticated user clicks sign out in header | Supabase signs out, auth state clears, route goes to `/signin` | Show existing route only after a new valid login |

</frozen-after-approval>

## Code Map

- `src/lib/supabase/client.ts` -- existing singleton Supabase browser client; reuse, do not create clients elsewhere.
- `supabase/migrations/202609180001_create_enums_and_helpers.sql` -- `profiles` schema and helper functions; new users default inactive.
- `supabase/migrations/202609180004_create_indexes_triggers_rls.sql` -- `anon` table access revoked; data policies require `public.is_active_user()`.
- `src/App.tsx` -- route tree; wrap dashboard layout group in a protected route and leave auth pages public.
- `src/main.tsx` -- provider composition; add `AuthProvider` alongside theme/language providers.
- `src/components/auth/SignInForm.tsx` -- existing presentational sign-in template; convert email/password fields to controlled form calling `useAuth().signIn`.
- `src/components/header/UserDropdown.tsx` -- replace hardcoded user/email and sign-out link with auth profile/session data and `signOut`.
- `src/locales/en/common.json` -- only locale file currently present; add auth/sign-in/protected-route strings here.
- `src/auth/*` -- new reusable module surface: service, provider/hook, protected route, types, and public barrel.
- `src/components/materials/materialsRepository.ts` -- no direct change required for auth; it should run after route guard supplies an authenticated active session.

## Tasks & Acceptance

**Execution:**
- [x] `src/auth/authTypes.ts` -- define reusable auth/profile state types, roles, sign-in input, and context value without depending on TailAdmin UI.
- [x] `src/auth/authService.ts` -- centralize Supabase calls for `getSession`, `signInWithPassword`, `signOut`, and `loadProfile` from `profiles`.
- [x] `src/auth/AuthProvider.tsx` and `src/auth/AuthContext.tsx` -- maintain session/user/profile/loading/error state, listen to `onAuthStateChange`, and expose `useAuth`.
- [x] `src/auth/ProtectedRoute.tsx` -- redirect anonymous users to `/signin`, block inactive authenticated users with a translated message, and render children/outlet only when active.
- [x] `src/auth/index.ts` -- export the reusable module API for future projects.
- [x] `src/main.tsx` -- wrap the app in `AuthProvider`.
- [x] `src/App.tsx` -- apply `ProtectedRoute` to the dashboard layout route group while keeping `/signin`, `/signup`, and fallback public.
- [x] `src/components/auth/SignInForm.tsx` -- wire controlled email/password submit, loading, disabled state, translated errors, and post-login navigation.
- [x] `src/components/header/UserDropdown.tsx` -- show `profile.fullName`/user email and call `signOut` from a button-style dropdown item.
- [x] `src/locales/en/common.json` -- add needed user-facing strings for auth states and sign-in feedback.
- [x] `scripts/auth-static-checks.test.mjs` -- add dependency-free auth flow smoke checks covering the I/O matrix.

**Acceptance Criteria:**
- Given no Supabase session, when a user opens `/materials`, then the app redirects to `/signin` and does not render the Materials page.
- Given valid credentials for an active profile, when the user submits the sign-in form, then the app loads the profile and allows dashboard routes.
- Given valid credentials for an inactive profile, when the user submits the sign-in form, then the app shows an inactive-account message and business routes remain blocked.
- Given an authenticated user, when they click sign out in the user dropdown, then Supabase signs out and protected routes redirect to `/signin`.
- Given another React/Supabase project, when it copies `src/auth` and provides a compatible Supabase client/profile table, then the core auth API can be reused without copying TailAdmin-specific form/header components.

## Implementation Notes

- Added reusable auth module files under `src/auth` with a public barrel export.
- Wired `AuthProvider`, route protection, sign-in form behavior, header sign-out, and English auth strings.
- Added `scripts/auth-static-checks.test.mjs` to cover the approved I/O matrix without adding a test dependency.

## Spec Change Log

## Review Triage Log

## Design Notes

Keep the reusable module narrow: `src/auth` owns auth state and Supabase auth/profile access; project UI owns layout and form styling. This gives the current app a working guard while leaving signup, admin activation, and role-management as separate stories.

## Verification

**Commands:**
- `node --test scripts/auth-static-checks.test.mjs` -- expected: auth flow smoke checks pass.
- `npm run build` -- expected: TypeScript and Vite build succeed.
- `npm run lint` -- expected: no new lint errors in changed auth files; existing unrelated lint failures may remain documented if still present.

**Implementation result:**
- `node --test scripts/auth-static-checks.test.mjs` -- passed.
- `npm run build` -- passed.
- `npm run lint` -- failed on existing unrelated lint errors in `src/components/calendar/CalendarEventModal.tsx`, `src/components/common/VectorMap.tsx`, `src/context/ThemeContext.tsx`, `src/layout/AppSidebar.tsx`, and `src/svg.d.ts`; no auth-change files were reported after fixing `src/auth/AuthProvider.tsx`.
- `npx eslint src/auth/AuthContext.tsx src/auth/AuthProvider.tsx src/auth/ProtectedRoute.tsx src/auth/authService.ts src/auth/authTypes.ts src/auth/index.ts src/App.tsx src/main.tsx src/components/auth/SignInForm.tsx src/components/header/UserDropdown.tsx` -- passed.

**Manual checks:**
- Open `/materials` while signed out and expect redirect to `/signin`.
- Sign in with a known active user and expect dashboard access plus real name/email in the header dropdown.
- Sign in with an inactive user and expect the inactive-account message instead of dashboard access.
- Click sign out and expect redirect to `/signin`.
