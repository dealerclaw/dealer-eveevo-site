import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ImpersonationBanner() {
  // Impersonation banner removed - impersonation now works by switching to actual dealer session
  // Admin must log out and log back in to return to admin account
  return null;
}
