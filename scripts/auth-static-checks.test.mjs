import { readFileSync } from "node:fs";
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

test("sign-in handles active, inactive, invalid, and missing-config states", () => {
  const signInSource = readSource("src/components/auth/SignInForm.tsx");
  const providerSource = readSource("src/auth/AuthProvider.tsx");
  const serviceSource = readSource("src/auth/authService.ts");

  assert.match(signInSource, /await signIn\(\{ email: email\.trim\(\), password \}\)/);
  assert.match(signInSource, /navigate\(`\$\{destinationPath\}\$\{destinationSearch\}`/);
  assert.match(signInSource, /authErrorTranslationKeys\[error\.code\]/);
  assert.match(signInSource, /!isConfigured/);
  assert.match(providerSource, /getActiveSessionProfile\(nextSession\)/);
  assert.match(providerSource, /AUTH_INACTIVE_ACCOUNT/);
  assert.match(providerSource, /await signOutFromSupabase\(\)/);
  assert.match(serviceSource, /signInWithPassword/);
  assert.match(serviceSource, /invalid login credentials/);
  assert.match(serviceSource, /\.from\("profiles"\)/);
  assert.match(serviceSource, /!profile\.isActive/);
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
