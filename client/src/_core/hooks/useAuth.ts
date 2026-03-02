import { useUser, useClerk } from "@clerk/clerk-react";
import { useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/sign-in" } = options ?? {};
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  // Query backend for impersonation state (only when signed in)
  const { data: authMeData } = trpc.auth.me.useQuery(undefined, {
    enabled: isSignedIn === true,
    staleTime: 30_000,
  });

  // Map Clerk user to our user format
  const clerkMappedUser = useMemo(() => {
    if (!clerkUser || !isSignedIn) return null;
    
    const rawRole = (clerkUser.unsafeMetadata?.role as string) || 'user';
    const rawAccountType = (clerkUser.unsafeMetadata?.accountType as string) || 'individual';
    
    // Map Clerk metadata to database enum values
    const role = rawRole === 'dealer' ? 'dealer' : rawRole === 'admin' ? 'admin' : 'user';
    const accountType = rawAccountType === 'business' ? 'business' : 'individual';
    
    return {
      id: 0, // Will be set by backend
      openId: clerkUser.id,
      name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      role: role as 'user' | 'dealer' | 'admin',
      accountType: accountType as 'individual' | 'business',
      phone: clerkUser.primaryPhoneNumber?.phoneNumber || null,
      createdAt: new Date(clerkUser.createdAt ?? Date.now()),
      updatedAt: new Date(clerkUser.updatedAt ?? Date.now()),
      lastSignedIn: new Date(),
    };
  }, [clerkUser, isSignedIn]);

  // Use backend user data when available (includes DB id and impersonation state)
  const user = useMemo(() => {
    if (!isSignedIn) return null;
    // When impersonating, backend returns the impersonated user as `user`
    if (authMeData?.user) {
      return authMeData.user;
    }
    return clerkMappedUser;
  }, [isSignedIn, authMeData, clerkMappedUser]);

  // The real admin user when impersonating
  const adminUser = authMeData?.adminUser ?? null;
  const isImpersonating = adminUser !== null;

  const logout = async () => {
    await signOut();
    utils.invalidate();
  };

  const state = useMemo(() => {
    if (user) {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    }
    return {
      user,
      loading: !isLoaded,
      error: null,
      isAuthenticated: isSignedIn === true && user !== null,
      isImpersonating,
      adminUser,
    };
  }, [user, isLoaded, isSignedIn, isImpersonating, adminUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!isLoaded) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, isLoaded, state.user]);

  return {
    ...state,
    refresh: () => utils.auth.me.invalidate(),
    logout,
  };
}
