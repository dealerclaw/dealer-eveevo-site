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

  // Map Clerk user to our user format
  const user = useMemo(() => {
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
      createdAt: new Date(clerkUser.createdAt),
      updatedAt: new Date(clerkUser.updatedAt),
      lastSignedIn: new Date(),
    };
  }, [clerkUser, isSignedIn]);

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
      isAuthenticated: isSignedIn && user !== null,
    };
  }, [user, isLoaded, isSignedIn]);

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
    refresh: () => {}, // Clerk handles refresh automatically
    logout,
  };
}
