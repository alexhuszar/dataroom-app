"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { User } from "@/lib/db/indexeddb";
import { useIndexedDBSync } from "@/lib/hooks/useIndexedDBSync";

type AuthResult = { accountId: string; error?: string } | null;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useIndexedDBSync();

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;

    const { id, email, name, provider } = session.user;

    return {
      id,
      email: email!,
      name: name!,
      accountId: email!,
      provider: provider as "credentials" | "google",
    };
  }, [session]);

  const authenticate = useCallback(
    async (
      mode: "signin" | "signup",
      params: Record<string, string>
    ): Promise<AuthResult> => {
      try {
        const result = await nextAuthSignIn("credentials", {
          ...params,
          mode,
          redirect: false,
        });

        if (result?.error) {
          return { accountId: "", error: result.error };
        }

        return result?.ok
          ? { accountId: params.email }
          : null;
      } catch (error) {
        console.error(`${mode} failed:`, error);
        return { accountId: "", error: `${mode} failed` };
      }
    },
    []
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      authenticate("signup", { name, email, password }),
    [authenticate]
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      authenticate("signin", { email, password }),
    [authenticate]
  );

  const signOut = useCallback(async () => {
    try {
      await nextAuthSignOut({
        redirect: true,
        callbackUrl: "/sign-in",
      });
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading: status === "loading",
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    getCurrentUser: () => user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
