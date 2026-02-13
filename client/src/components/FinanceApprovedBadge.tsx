import { CheckCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FinanceApprovedBadgeProps {
  variant?: "default" | "large";
  className?: string;
}

export default function FinanceApprovedBadge({ variant = "default", className = "" }: FinanceApprovedBadgeProps) {
  if (variant === "large") {
    return (
      <div className={`inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-4 py-2 rounded-full border-2 border-green-200 dark:border-green-800 ${className}`}>
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold">Finance Pre-Approved</span>
        <CheckCircle className="w-5 h-5" />
      </div>
    );
  }

  return (
    <Badge 
      className={`bg-green-600 hover:bg-green-700 text-white gap-1 ${className}`}
    >
      <CheckCircle className="w-3 h-3" />
      Finance Approved
    </Badge>
  );
}
