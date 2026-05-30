import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { useRef, useState } from "react";
import App from "./App";

import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const queryClient = new QueryClient();

// Pages that are intentionally public — never redirect from these even if a protected
// sub-query (e.g. favorites.list) fails with UNAUTHED.
const PUBLIC_PATHS = [
  /^\/cars\//, // car detail pages — publicly shareable
  /^\/browse/,
  /^\/$/, // home
  /^\/lifestyle-search/,
  /^\/compare/,
  /^\/become-a-dealer/,
  /^\/finance/,
  /^\/ev-specs\//,
  /^\/sign-in/,
  /^\/sign-up/,
];

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some(re => re.test(pathname));

const redirectToLoginIfUnauthorized = (error: unknown, isBackgroundRefetch = false) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  // Never redirect on background refetches (e.g. the 30-second unreadCount poll).
  if (isBackgroundRefetch) {
    console.warn('[Auth] Background poll returned UNAUTHED — ignoring (will retry next interval)');
    return;
  }

  // Never redirect from public pages — they show optional auth-gated UI
  // (e.g. favourites button on car detail) but the page itself is public.
  if (isPublicPath(window.location.pathname)) {
    console.warn('[Auth] Protected sub-query failed on public page — ignoring, not redirecting');
    return;
  }

  window.location.href = "/sign-in";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // fetchStatus 'idle' after an error means the query failed during a background refetch
    // (refetchInterval), not a user-initiated fetch. Don't redirect in that case.
    const isBackground = event.query.state.fetchStatus === 'idle' && event.query.state.dataUpdatedAt > 0;
    redirectToLoginIfUnauthorized(error, isBackground);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error, false);
    console.error("[API Mutation Error]", error);
  }
});

// Inner component that has access to Clerk's useAuth hook
// Uses a ref so the tRPC client always calls the latest getToken
function AppWithTRPC() {
  const { getToken } = useAuth();
  // Keep a ref to the latest getToken so the stable tRPC client can use it
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          headers: async () => {
            try {
              const token = await getTokenRef.current();
              if (token) {
                return {
                  authorization: `Bearer ${token}`,
                };
              }
            } catch (e) {
              console.warn('[tRPC] Failed to get Clerk token:', e);
            }
            return {};
          },
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <AppWithTRPC />
  </ClerkProvider>
);
