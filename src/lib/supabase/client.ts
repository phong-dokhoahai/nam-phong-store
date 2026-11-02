import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * localStorage key of the auth session. Same value as supabase-js' default
 * (so existing sessions survive), made explicit so `authService` can read the
 * stored session when it cannot be refreshed offline.
 */
export const authStorageKey = isSupabaseConfigured
  ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
  : "";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storageKey: authStorageKey },
    })
  : null;
