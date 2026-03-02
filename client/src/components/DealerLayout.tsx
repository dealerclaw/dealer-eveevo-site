import { Link, useLocation } from "wouter";
import Header from "./Header";
import ImpersonationBanner from "./ImpersonationBanner";
import { LayoutDashboard, Package, Plus, Store, BarChart3, Upload, Calendar, Gavel, Crown, ShoppingCart, Heart, Trophy, Bookmark, Wrench, Activity, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DealerLayoutProps {
  children: React.ReactNode;
}

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
      href: "/dealer/shortlist",
      label: "My Shortlist",
      icon: Bookmark,
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
      href: "/dealer/ev-faults",
      label: "EV Faults Database",
      icon: Wrench,
    },
    {
      href: "/dealer/inventory-health",
      label: "Inventory Health",
      icon: Activity,
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

function NavLinks({ location, onClose }: { location: string; onClose?: () => void }) {
  return (
    <div className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function DealerLayout({ children }: DealerLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r bg-card min-h-[calc(100vh-64px)] p-4 sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-y-auto">
          <NavLinks location={location} />
        </aside>

        {/* Mobile Sidebar via Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg h-12 w-12 bg-primary text-primary-foreground border-primary hover:bg-primary/90"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">Dealer Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavLinks location={location} onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
