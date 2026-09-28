import type { Session, User } from "@supabase/supabase-js";

export type AuthRole = "ADMIN" | "WAREHOUSE_STAFF";

export type AuthProfile = {
  id: string;
  fullName: string;
  role: AuthRole;
  isActive: boolean;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthErrorCode =
  | "AUTH_CONFIG_MISSING"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_INACTIVE_ACCOUNT"
  | "AUTH_PROFILE_MISSING"
  | "AUTH_UNKNOWN";

export class AuthModuleError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthModuleError";
    this.code = code;
  }
}

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  error: AuthModuleError | null;
  isConfigured: boolean;
  isAuthenticated: boolean;
  isActive: boolean;
};

export type AuthContextValue = AuthState & {
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  reload: () => Promise<void>;
};
