import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ImpersonateDealer() {
  const params = useParams<{ id: string }>();
  const dealerId = parseInt(params.id || '0');
  const [, navigate] = useLocation();

  const impersonateMutation = trpc.admin.impersonate.useMutation({
    onSuccess: () => {
      toast.success("Now viewing as dealer");
      // Redirect to dealer dashboard
      window.location.href = "/dealer/dashboard";
    },
    onError: (error) => {
      toast.error(error.message || "Failed to impersonate dealer");
      navigate("/admin/dealers");
    },
  });

  useEffect(() => {
    if (dealerId) {
      impersonateMutation.mutate({ dealerId });
    }
  }, [dealerId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Switching to dealer account...</p>
      </div>
    </div>
  );
}
