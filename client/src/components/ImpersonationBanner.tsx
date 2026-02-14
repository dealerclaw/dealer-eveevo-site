import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ImpersonationBanner() {
  const { data: user } = trpc.auth.me.useQuery();
  const isImpersonating = (user as any)?.isImpersonating;

  const exitMutation = trpc.admin.exitImpersonation.useMutation({
    onSuccess: () => {
      toast.success("Returned to admin account");
      window.location.href = "/admin/dealers";
    },
    onError: (error) => {
      toast.error(error.message || "Failed to exit impersonation");
    },
  });

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">
          You are viewing as: {user?.name} (Dealer)
        </span>
        <span className="text-sm opacity-90">
          Original admin: {(user as any)?.originalAdminName}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exitMutation.mutate()}
        disabled={exitMutation.isPending}
        className="bg-white text-amber-700 hover:bg-gray-100"
      >
        <LogOut className="w-4 h-4 mr-1" />
        {exitMutation.isPending ? "Exiting..." : "Exit Impersonation"}
      </Button>
    </div>
  );
}
