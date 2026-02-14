import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface DealerAuthGuardProps {
  children: React.ReactNode;
}

export default function DealerAuthGuard({ children }: DealerAuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    // Redirect to become-a-dealer page if not a dealer
    if (user && user.role !== "dealer" && user.role !== "admin") {
      setLocation("/become-a-dealer");
    }
  }, [isAuthenticated, user, setLocation, loading]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if not authenticated or not a dealer
  if (!isAuthenticated || (user && user.role !== "dealer" && user.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}
