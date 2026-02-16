import { Link, useLocation } from "wouter";
import Header from "./Header";
import { Users, FileText, RefreshCw, Activity, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/admin/dealers",
      label: "Dealers",
      icon: Users,
    },
    {
      href: "/admin/applications",
      label: "Applications",
      icon: FileText,
    },
    {
      href: "/admin/sync",
      label: "Sync Data",
      icon: RefreshCw,
    },
    {
      href: "/admin/inventory-health",
      label: "Inventory Health",
      icon: Activity,
    },
    {
      href: "/admin/oneauto-import",
      label: "OneAuto Import",
      icon: Upload,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold px-3">Admin Panel</h2>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
