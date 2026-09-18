import { useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/sign-in" } = options ?? {};
  const utils = trpc.useUtils();

  // Session lives in an httpOnly cookie; the backend tells us who we are.
  const { data: authMeData, isLoading } = trpc.auth.me.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });

  const user = authMeData?.user ?? null;
  // The real admin user when impersonating
  const adminUser = authMeData?.adminUser ?? null;
  const isImpersonating = adminUser !== null;

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      utils.invalidate();
      window.location.href = "/";
    }
  };

  const state = useMemo(() => {
    return {
      user,
      loading: isLoading,
      error: null,
      isAuthenticated: user !== null,
      isImpersonating,
      adminUser,
    };
  }, [user, isLoading, isImpersonating, adminUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, isLoading, state.user]);

  return {
    ...state,
    refresh: () => utils.auth.me.invalidate(),
    logout,
  };
}
