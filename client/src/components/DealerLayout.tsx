import { Link, useLocation } from "wouter";
import Header from "./Header";
import ImpersonationBanner from "./ImpersonationBanner";
import { LayoutDashboard, Package, Plus, Store, BarChart3, Upload, Calendar, Gavel, Crown, ShoppingCart, Heart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealerLayoutProps {
  children: React.ReactNode;
}

export default function DealerLayout({ children }: DealerLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/dealer/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dealer/inventory",
      label: "My Inventory",
      icon: Package,
    },
    {
      href: "/dealer/add-vehicle",
      label: "Add Vehicle",
      icon: Plus,
    },
    {
      href: "/dealer/marketplace",
      label: "Dealer Marketplace",
      icon: Store,
    },
    {
      href: "/dealer/live-auction",
      label: "Live Auction",
      icon: Gavel,
    },
    {
      href: "/dealer/my-auctions",
      label: "My Auctions",
      icon: Gavel,
    },
    {
      href: "/dealer/auction-analytics",
      label: "Auction Analytics",
      icon: BarChart3,
    },
    {
      href: "/dealer/my-wins",
      label: "My Wins",
      icon: Trophy,
    },
    {
      href: "/dealer/cart",
      label: "Shopping Cart",
      icon: ShoppingCart,
    },
    {
      href: "/dealer/watchlist",
      label: "Watchlist",
      icon: Heart,
    },
    {
      href: "/dealer/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      href: "/dealer/bulk-upload",
      label: "Bulk Upload",
      icon: Upload,
    },
    {
      href: "/dealer/test-drives",
      label: "Test Drives",
      icon: Calendar,
    },
    {
      href: "/dealer/subscription",
      label: "Subscribe",
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-64px)] p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
