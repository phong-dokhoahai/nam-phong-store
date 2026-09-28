import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { AuthContext } from "./AuthContext";
import {
  getActiveSessionProfile,
  getSession,
  isAuthModuleError,
  signInWithPassword,
  signOut as signOutFromSupabase,
} from "./authService";
import {
  AuthModuleError,
  type AuthContextValue,
  type AuthProfile,
  type SignInInput,
} from "./authTypes";

type AuthProviderProps = {
  children: ReactNode;
};

type SessionState = {
  session: Session | null;
  profile: AuthProfile | null;
};

const missingConfigError = new AuthModuleError(
  "AUTH_CONFIG_MISSING",
  "Supabase is not configured.",
);

function normalizeAuthError(error: unknown) {
  if (isAuthModuleError(error)) {
    return error;
  }

  return new AuthModuleError("AUTH_UNKNOWN", "Authentication failed.");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    profile: null,
  });
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<AuthModuleError | null>(
    isSupabaseConfigured ? null : missingConfigError,
  );

  const applySession = useCallback(async (nextSession: Session | null) => {
    setIsLoading(true);

    if (!nextSession) {
      setSessionState({ session: null, profile: null });
      setIsLoading(false);
      return;
    }

    try {
      const activeSessionProfile = await getActiveSessionProfile(nextSession);
      setSessionState(activeSessionProfile);
      setError(null);
    } catch (sessionError) {
      const authError = normalizeAuthError(sessionError);
      setSessionState({ session: null, profile: null });
      setError(authError);

      if (
        authError.code === "AUTH_INACTIVE_ACCOUNT" ||
        authError.code === "AUTH_PROFILE_MISSING"
      ) {
        await signOutFromSupabase();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSessionState({ session: null, profile: null });
      setError(missingConfigError);
      setIsLoading(false);
      return;
    }

    try {
      const currentSession = await getSession();
      await applySession(currentSession);
    } catch (sessionError) {
      setSessionState({ session: null, profile: null });
      setError(normalizeAuthError(sessionError));
      setIsLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    queueMicrotask(() => {
      void reload();
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [applySession, reload]);

  const signIn = useCallback(async (input: SignInInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSession = await signInWithPassword(input);
      const activeSessionProfile = await getActiveSessionProfile(nextSession);
      setSessionState(activeSessionProfile);
    } catch (signInError) {
      const authError = normalizeAuthError(signInError);
      setSessionState({ session: null, profile: null });
      setError(authError);

      if (
        authError.code === "AUTH_INACTIVE_ACCOUNT" ||
        authError.code === "AUTH_PROFILE_MISSING"
      ) {
        await signOutFromSupabase();
      }

      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await signOutFromSupabase();
      setSessionState({ session: null, profile: null });
      setError(null);
    } catch (signOutError) {
      setError(normalizeAuthError(signOutError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = sessionState.session?.user ?? null;
    const isAuthenticated = Boolean(sessionState.session && user);
    const isActive = Boolean(sessionState.profile?.isActive);

    return {
      session: sessionState.session,
      user,
      profile: sessionState.profile,
      isLoading,
      error,
      isConfigured: isSupabaseConfigured,
      isAuthenticated,
      isActive,
      signIn,
      signOut,
      clearError,
      reload,
    };
  }, [clearError, error, isLoading, reload, sessionState, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
