import type { AuthErrorCode } from "./authTypes";

/** Translation key for each auth error, shared by sign-in and route guards. */
export const authErrorTranslationKeys: Record<AuthErrorCode, string> = {
  AUTH_CONFIG_MISSING: "auth.errors.configMissing",
  AUTH_INVALID_CREDENTIALS: "auth.errors.invalidCredentials",
  AUTH_INACTIVE_ACCOUNT: "auth.errors.inactive",
  AUTH_PROFILE_MISSING: "auth.errors.profileMissing",
  AUTH_PROFILE_LOAD_FAILED: "auth.errors.profileLoadFailed",
  AUTH_RATE_LIMITED: "auth.errors.rateLimited",
  AUTH_NETWORK: "auth.errors.network",
  AUTH_UNKNOWN: "auth.errors.unknown",
};
