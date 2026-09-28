import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  AuthModuleError,
  type AuthProfile,
  type SignInInput,
} from "./authTypes";

type ProfileRow = {
  id: string;
  full_name: string;
  role: AuthProfile["role"];
  is_active: boolean;
};

const AUTH_ERROR_MESSAGES = {
  AUTH_CONFIG_MISSING: "Supabase is not configured.",
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_INACTIVE_ACCOUNT: "This account is inactive.",
  AUTH_PROFILE_MISSING: "No application profile was found for this user.",
  AUTH_UNKNOWN: "Authentication failed.",
} as const;

function requireSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new AuthModuleError(
      "AUTH_CONFIG_MISSING",
      AUTH_ERROR_MESSAGES.AUTH_CONFIG_MISSING,
    );
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

function mapAuthError(message?: string) {
  const normalizedMessage = message?.toLowerCase() || "";

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return new AuthModuleError(
      "AUTH_INVALID_CREDENTIALS",
      AUTH_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS,
    );
  }

  return new AuthModuleError("AUTH_UNKNOWN", AUTH_ERROR_MESSAGES.AUTH_UNKNOWN);
}

export async function getSession() {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw mapAuthError(error.message);
  }

  return data.session;
}

export async function loadProfile(userId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new AuthModuleError("AUTH_UNKNOWN", AUTH_ERROR_MESSAGES.AUTH_UNKNOWN);
  }

  if (!data) {
    throw new AuthModuleError(
      "AUTH_PROFILE_MISSING",
      AUTH_ERROR_MESSAGES.AUTH_PROFILE_MISSING,
    );
  }

  return mapProfile(data);
}

export async function signInWithPassword(input: SignInInput) {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw mapAuthError(error.message);
  }

  if (!data.session || !data.user) {
    throw new AuthModuleError("AUTH_UNKNOWN", AUTH_ERROR_MESSAGES.AUTH_UNKNOWN);
  }

  return data.session;
}

export async function signOut() {
  const client = requireSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) {
    throw mapAuthError(error.message);
  }
}

export async function getActiveSessionProfile(session: Session | null) {
  if (!session) {
    return { session: null, profile: null };
  }

  const profile = await loadProfile(session.user.id);

  if (!profile.isActive) {
    throw new AuthModuleError(
      "AUTH_INACTIVE_ACCOUNT",
      AUTH_ERROR_MESSAGES.AUTH_INACTIVE_ACCOUNT,
    );
  }

  return { session, profile };
}

export function isAuthModuleError(error: unknown): error is AuthModuleError {
  return error instanceof AuthModuleError;
}
