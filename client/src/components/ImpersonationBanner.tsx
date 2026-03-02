import { Button } from "@/components/ui/button";
import { UserCog, LogOut, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ImpersonationBanner() {
  const { isImpersonating, adminUser, user } = useAuth();
  const utils = trpc.useUtils();

  const exitImpersonation = trpc.admin.exitImpersonation.useMutation({
    onSuccess: () => {
      toast.success("Exited impersonation mode");
      utils.invalidate();
      // Redirect back to admin panel
      window.location.href = "/admin/dealers";
    },
    onError: (error) => {
      toast.error(error.message || "Failed to exit impersonation");
    },
  });

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <UserCog className="w-4 h-4" />
        <span>
          Admin Mode: Viewing as <strong>{user?.name || user?.email || "dealer"}</strong>
          {adminUser && (
            <span className="opacity-75 ml-1">(logged in as {adminUser.name || adminUser.email})</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs bg-amber-400 border-amber-600 hover:bg-amber-300 text-amber-950"
          onClick={() => window.location.href = "/admin/dealers"}
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Admin
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs bg-amber-400 border-amber-600 hover:bg-amber-300 text-amber-950"
          onClick={() => exitImpersonation.mutate()}
          disabled={exitImpersonation.isPending}
        >
          <LogOut className="w-3 h-3 mr-1" />
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
