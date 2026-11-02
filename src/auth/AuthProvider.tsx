import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  clearOfflineData,
  setOfflineScope,
} from "@/lib/offline/offlineStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { AuthContext } from "./AuthContext";
import {
  endsSession,
  getActiveSessionProfile,
  getSession,
  getStoredSession,
  isAuthModuleError,
  loadActiveProfile,
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

/** Re-check role / activation at most this often when the tab regains focus. */
const PROFILE_FOCUS_CHECK_MS = 60_000;
/** Re-check role / activation this often while the tab is visible. */
const PROFILE_POLL_MS = 5 * 60_000;

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

async function signOutQuietly() {
  // Offline copies belong to the signed-in user; never leave them behind.
  await clearOfflineData();

  try {
    await signOutFromSupabase();
  } catch {
    // auth-js removes the local session even when the revoke request fails
    // (e.g. offline) and emits SIGNED_OUT, so there is nothing left to undo.
  }
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

  // Every session load gets a number and only the latest one may change state,
  // so a slow profile response cannot overwrite a newer session (or sign-out).
  const loadIdRef = useRef(0);
  const latestLoadRef = useRef<Promise<AuthModuleError | null>>(
    Promise.resolve(null),
  );
  // The user whose profile is loaded or loading; null when signed out.
  const userIdRef = useRef<string | null>(null);
  const lastProfileCheckRef = useRef(0);

  /** Loads the profile for a session. Resolves with the error, if any. */
  const loadSession = useCallback((nextSession: Session | null) => {
    const loadId = ++loadIdRef.current;
    userIdRef.current = nextSession?.user.id ?? null;

    const run = async (): Promise<AuthModuleError | null> => {
      if (!nextSession) {
        setSessionState({ session: null, profile: null });
        setIsLoading(false);
        return null;
      }

      setIsLoading(true);

      try {
        const activeSessionProfile = await getActiveSessionProfile(nextSession);

        if (loadId === loadIdRef.current) {
          lastProfileCheckRef.current = Date.now();
          setSessionState(activeSessionProfile);
          setError(null);
        }

        return null;
      } catch (sessionError) {
        const authError = normalizeAuthError(sessionError);

        if (loadId !== loadIdRef.current) {
          return authError;
        }

        setError(authError);

        if (endsSession(authError)) {
          setSessionState({ session: null, profile: null });
          await signOutQuietly();
        } else {
          // Network or server error: keep the session so the user can retry
          // without signing in again (ProtectedRoute shows a retry panel).
          setSessionState({ session: nextSession, profile: null });
        }

        return authError;
      } finally {
        if (loadId === loadIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    const promise = run();
    latestLoadRef.current = promise;
    return promise;
  }, []);

  /**
   * Silently re-reads the profile so a role change or deactivation by an
   * ADMIN reaches an open session. Network errors keep the current profile.
   */
  const revalidateProfile = useCallback(async () => {
    const userId = userIdRef.current;
    const loadId = loadIdRef.current;

    if (!userId) {
      return;
    }

    lastProfileCheckRef.current = Date.now();

    try {
      const profile = await loadActiveProfile(userId);

      if (loadId === loadIdRef.current) {
        setSessionState((current) =>
          current.session ? { ...current, profile } : current,
        );
        setError(null);
      }
    } catch (profileError) {
      const authError = normalizeAuthError(profileError);

      if (loadId !== loadIdRef.current || !endsSession(authError)) {
        return;
      }

      loadIdRef.current += 1;
      userIdRef.current = null;
      setError(authError);
      setSessionState({ session: null, profile: null });
      await signOutQuietly();
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
      await loadSession(await getSession());
    } catch (sessionError) {
      setError(normalizeAuthError(sessionError));
      setIsLoading(false);
    }
  }, [loadSession]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    // INITIAL_SESSION delivers the stored session right after subscribing, so
    // there is no separate initial load.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        // Covers sign-out from another tab and a refresh token that the
        // server rejected.
        void clearOfflineData();
      }

      if (event === "INITIAL_SESSION" && !nextSession && !navigator.onLine) {
        // Offline with an expired access token: supabase-js cannot refresh
        // it and reports no session, but keeps it stored. Open the app with
        // the stored session; supabase-js refreshes it once back online.
        const storedSession = getStoredSession();

        if (storedSession) {
          void loadSession(storedSession);
          return;
        }
      }

      if (nextSession && nextSession.user.id === userIdRef.current) {
        // Same user (TOKEN_REFRESHED, USER_UPDATED, SIGNED_IN from another
        // tab): only the tokens changed.
        setSessionState((current) =>
          current.session ? { ...current, session: nextSession } : current,
        );
        return;
      }

      void loadSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    const checkWhenVisible = (minAgeMs: number) => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastProfileCheckRef.current >= minAgeMs
      ) {
        void revalidateProfile();
      }
    };
    const onFocus = () => checkWhenVisible(PROFILE_FOCUS_CHECK_MS);
    const timer = window.setInterval(
      () => checkWhenVisible(PROFILE_POLL_MS),
      PROFILE_POLL_MS,
    );

    // Back online: confirm role / activation (this also refreshes a token
    // that expired while offline).
    const onOnline = () => checkWhenVisible(0);

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [revalidateProfile]);

  // Offline copies of screen data are kept for active ADMIN sessions only.
  // A layout effect runs before the pages' data-loading effects.
  const offlineScopeUserId =
    sessionState.profile?.role === "ADMIN" && sessionState.profile.isActive
      ? sessionState.profile.id
      : null;
  useLayoutEffect(() => {
    setOfflineScope(offlineScopeUserId);
  }, [offlineScopeUserId]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      setError(null);
      setIsLoading(true);
      const loadIdBefore = loadIdRef.current;
      let nextSession: Session;

      try {
        nextSession = await signInWithPassword(input);
      } catch (signInError) {
        const authError = normalizeAuthError(signInError);
        setError(authError);
        setIsLoading(false);
        throw authError;
      }

      // signInWithPassword has already emitted SIGNED_IN, so the listener is
      // loading this user's profile: wait for that load instead of a second one.
      const loadError =
        loadIdRef.current !== loadIdBefore &&
        userIdRef.current === nextSession.user.id
          ? await latestLoadRef.current
          : await loadSession(nextSession);

      if (loadError) {
        throw loadError;
      }
    },
    [loadSession],
  );

  const signOut = useCallback(async () => {
    // Clear the UI first; it must not wait on the network.
    loadIdRef.current += 1;
    userIdRef.current = null;
    setSessionState({ session: null, profile: null });
    setError(null);
    setIsLoading(false);
    await signOutQuietly();
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
