import {
  isAuthError,
  isAuthRetryableFetchError,
  type Session,
} from "@supabase/supabase-js";
import { isNetworkError } from "@/lib/offline/isNetworkError";
import {
  readCachedProfile,
  writeCachedProfile,
} from "@/lib/offline/offlineStore";
import {
  authStorageKey,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import {
  AuthModuleError,
  type AuthErrorCode,
  type AuthProfile,
  type SignInInput,
} from "./authTypes";

type ProfileRow = {
  id: string;
  full_name: string;
  role: AuthProfile["role"];
  is_active: boolean;
};

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  AUTH_CONFIG_MISSING: "Supabase is not configured.",
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_INACTIVE_ACCOUNT: "This account is inactive.",
  AUTH_PROFILE_MISSING: "No application profile was found for this user.",
  AUTH_PROFILE_LOAD_FAILED: "The application profile could not be loaded.",
  AUTH_RATE_LIMITED: "Too many requests. Try again later.",
  AUTH_NETWORK: "The authentication server could not be reached.",
  AUTH_UNKNOWN: "Authentication failed.",
};

function authModuleError(code: AuthErrorCode) {
  return new AuthModuleError(code, AUTH_ERROR_MESSAGES[code]);
}

function requireSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw authModuleError("AUTH_CONFIG_MISSING");
  }

  return supabase;
}

function mapProfile(profileRow: ProfileRow): AuthProfile {
  return {
    id: profileRow.id,
    fullName: profileRow.full_name,
    role: profileRow.role,
    isActive: profileRow.is_active,
  };
}

/** Maps a Supabase Auth error to a module error code, by error code first. */
function mapAuthError(error: unknown) {
  if (!isAuthError(error)) {
    return authModuleError("AUTH_UNKNOWN");
  }

  if (isAuthRetryableFetchError(error)) {
    return authModuleError("AUTH_NETWORK");
  }

  switch (error.code) {
    case "invalid_credentials":
      return authModuleError("AUTH_INVALID_CREDENTIALS");
    case "user_banned":
      return authModuleError("AUTH_INACTIVE_ACCOUNT");
    case "over_request_rate_limit":
      return authModuleError("AUTH_RATE_LIMITED");
  }

  if (error.status === 429) {
    return authModuleError("AUTH_RATE_LIMITED");
  }

  // Older Auth servers send no error code, only the message.
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return authModuleError("AUTH_INVALID_CREDENTIALS");
  }

  return authModuleError("AUTH_UNKNOWN");
}

export async function getSession() {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw mapAuthError(error);
  }

  return data.session;
}

async function fetchProfileRow(userId: string) {
  const client = requireSupabaseClient();

  try {
    return await client
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", userId)
      .maybeSingle<ProfileRow>();
  } catch (fetchError) {
    return { data: null, error: fetchError };
  }
}

/**
 * Loads the profile from the database. When the server cannot be reached,
 * falls back to the copy saved on this device by the last successful load
 * (ADMIN only), so an installed app still opens offline. RLS and RPC checks
 * still apply to every request once the network is back.
 */
export async function loadProfile(userId: string) {
  const { data, error } = await fetchProfileRow(userId);

  if (error) {
    const cachedProfile = isNetworkError(error)
      ? await readCachedProfile<AuthProfile>(userId)
      : null;

    if (cachedProfile) {
      return cachedProfile;
    }

    throw authModuleError("AUTH_PROFILE_LOAD_FAILED");
  }

  if (!data) {
    throw authModuleError("AUTH_PROFILE_MISSING");
  }

  const profile = mapProfile(data);

  if (profile.role === "ADMIN" && profile.isActive) {
    void writeCachedProfile(userId, profile);
  }

  return profile;
}

/** Loads the profile and rejects inactive accounts. */
export async function loadActiveProfile(userId: string) {
  const profile = await loadProfile(userId);

  if (!profile.isActive) {
    throw authModuleError("AUTH_INACTIVE_ACCOUNT");
  }

  return profile;
}

/**
 * The session saved in localStorage, read without refreshing it. Used only
 * offline, when supabase-js reports no session because an expired access
 * token cannot be refreshed; supabase-js refreshes it once back online.
 */
export function getStoredSession(): Session | null {
  if (!authStorageKey) {
    return null;
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(authStorageKey) ?? "null",
    ) as Partial<Session> | null;

    return stored?.access_token && stored.refresh_token && stored.user?.id
      ? (stored as Session)
      : null;
  } catch {
    return null;
  }
}

export async function signInWithPassword(input: SignInInput) {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw mapAuthError(error);
  }

  if (!data.session || !data.user) {
    throw authModuleError("AUTH_UNKNOWN");
  }

  return data.session;
}

export async function signOut() {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) {
    throw mapAuthError(error);
  }
}

export async function getActiveSessionProfile(session: Session | null) {
  if (!session) {
    return { session: null, profile: null };
  }

  const profile = await loadActiveProfile(session.user.id);

  return { session, profile };
}

/**
 * Errors after which the session must not be used: the account is inactive or
 * has no profile. Other errors (network, server) keep the session for a retry.
 */
export function endsSession(error: AuthModuleError) {
  return (
    error.code === "AUTH_INACTIVE_ACCOUNT" ||
    error.code === "AUTH_PROFILE_MISSING"
  );
}

export function isAuthModuleError(error: unknown): error is AuthModuleError {
  return error instanceof AuthModuleError;
}
