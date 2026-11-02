import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const readSource = (path) => readFileSync(path, "utf8");

test("protected routes redirect unauthenticated users and block inactive users", () => {
  const appSource = readSource("src/App.tsx");
  const protectedRouteSource = readSource("src/auth/ProtectedRoute.tsx");

  assert.match(appSource, /<Route element=\{<ProtectedRoute \/>\}>/);
  assert.match(appSource, /<Route element=\{<AppLayout \/>\}>/);
  assert.match(protectedRouteSource, /<Navigate to="\/signin" replace state=\{\{ from: location \}\} \/>/);
  assert.match(protectedRouteSource, /!isAuthenticated/);
  assert.match(protectedRouteSource, /!isActive/);
  assert.match(protectedRouteSource, /auth\.errors\.inactive/);
});

test("no public sign-up: accounts are created by an ADMIN", () => {
  const appSource = readSource("src/App.tsx");
  const configSource = readSource("supabase/config.toml");

  assert.doesNotMatch(appSource, /path="\/signup"/);
  assert.doesNotMatch(appSource, /SignUp/);
  assert.match(configSource, /^enable_signup = false$/m);
});

test("sign-in handles active, inactive, invalid, and missing-config states", () => {
  const signInSource = readSource("src/components/auth/SignInForm.tsx");
  const providerSource = readSource("src/auth/AuthProvider.tsx");
  const serviceSource = readSource("src/auth/authService.ts");

  assert.match(signInSource, /await signIn\(\{ email: email\.trim\(\), password \}\)/);
  // Signed-in users (after submit or when opening /signin) go back to `from`.
  assert.match(signInSource, /isAuthenticated && isActive/);
  assert.match(signInSource, /<Navigate to=\{`\$\{destinationPath\}\$\{destinationSearch\}`\} replace \/>/);
  assert.match(signInSource, /authErrorTranslationKeys\[error\.code\]/);
  assert.match(signInSource, /!isConfigured/);
  assert.match(providerSource, /getActiveSessionProfile\(nextSession\)/);
  assert.match(providerSource, /endsSession\(authError\)/);
  assert.match(providerSource, /await signOutFromSupabase\(\)/);
  assert.match(serviceSource, /signInWithPassword/);
  assert.match(serviceSource, /case "invalid_credentials"/);
  assert.match(serviceSource, /isAuthRetryableFetchError/);
  assert.match(serviceSource, /invalid login credentials/);
  assert.match(serviceSource, /\.from\("profiles"\)/);
  assert.match(serviceSource, /!profile\.isActive/);
  assert.match(serviceSource, /AUTH_INACTIVE_ACCOUNT/);
});

test("auth provider ignores stale loads, keeps the session on network errors and re-checks the profile", () => {
  const providerSource = readSource("src/auth/AuthProvider.tsx");
  const protectedRouteSource = readSource("src/auth/ProtectedRoute.tsx");

  // One load per session change, driven by onAuthStateChange (INITIAL_SESSION).
  assert.doesNotMatch(providerSource, /queueMicrotask/);
  assert.match(providerSource, /loadId === loadIdRef\.current/);
  assert.match(providerSource, /await latestLoadRef\.current/);
  assert.match(providerSource, /setSessionState\(\{ session: nextSession, profile: null \}\)/);
  assert.match(providerSource, /revalidateProfile/);
  assert.match(providerSource, /visibilitychange/);
  assert.match(protectedRouteSource, /reload\(\)/);
  assert.match(protectedRouteSource, /common\.retry/);
});

test("sign out clears the session and sends users back to sign in", () => {
  const userDropdownSource = readSource("src/components/header/UserDropdown.tsx");
  const providerSource = readSource("src/auth/AuthProvider.tsx");

  assert.match(userDropdownSource, /await signOut\(\)/);
  assert.match(userDropdownSource, /navigate\("\/signin", \{ replace: true \}\)/);
  assert.match(providerSource, /await signOutFromSupabase\(\)/);
  assert.match(providerSource, /setSessionState\(\{ session: null, profile: null \}\)/);
});

test("auth module exposes reusable project-facing APIs", () => {
  const indexSource = readSource("src/auth/index.ts");
  const typesSource = readSource("src/auth/authTypes.ts");

  for (const exportName of [
    "AuthProvider",
    "ProtectedRoute",
    "useAuth",
    "signInWithPassword",
    "signOut",
    "AuthProfile",
    "AuthContextValue",
  ]) {
    assert.match(indexSource, new RegExp(exportName));
  }

  assert.match(typesSource, /export type AuthProfile/);
  assert.match(typesSource, /export type AuthContextValue/);
  assert.match(typesSource, /signIn: \(input: SignInInput\) => Promise<void>/);
  assert.match(typesSource, /signOut: \(\) => Promise<void>/);
});

test("admin bootstrap script uses Supabase Auth and activates the admin profile", () => {
  const bootstrapSource = readSource("scripts/bootstrap-admin.mjs");
  const profileBootstrapMigrationSource = readSource(
    "supabase/migrations/202609280001_allow_service_role_profile_bootstrap.sql",
  );

  assert.match(bootstrapSource, /auth\.admin\.createUser/);
  assert.match(bootstrapSource, /auth\.admin\.updateUserById/);
  assert.match(bootstrapSource, /\.from\("profiles"\)\.upsert/);
  assert.match(bootstrapSource, /match\[1\] === "ADMIN_PASSWORD"/);
  assert.match(bootstrapSource, /role: "ADMIN"/);
  assert.match(bootstrapSource, /is_active: true/);
  assert.match(bootstrapSource, /dokhoahaiphong@gmail\.com/);
  assert.match(profileBootstrapMigrationSource, /auth\.role\(\) = 'service_role'/);
  assert.match(profileBootstrapMigrationSource, /public\.is_admin\(\)/);
});

test("admin bootstrap exits before account changes when privileged config is missing", () => {
  const result = spawnSync(process.execPath, ["scripts/bootstrap-admin.mjs"], {
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ADMIN_PASSWORD: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_URL: "",
      VITE_SUPABASE_URL: "",
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(result.stderr, /ADMIN_PASSWORD/);
});

test("admin bootstrap keeps privileged secrets out of source", () => {
  const bootstrapSource = readSource("scripts/bootstrap-admin.mjs");

  assert.doesNotMatch(bootstrapSource, /ADMIN_PASSWORD\s*=\s*['"][^'"]+/);
  assert.doesNotMatch(bootstrapSource, /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+/);
  assert.doesNotMatch(bootstrapSource, /service_role\s*[:=]\s*['"][^'"]+/i);
});
