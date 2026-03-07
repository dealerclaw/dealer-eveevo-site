import { Link, useLocation } from "wouter";
import Header from "./Header";
import ImpersonationBanner from "./ImpersonationBanner";
import {
  LayoutDashboard, Package, Plus, Store, BarChart3, Upload,
  Calendar, Gavel, Crown, ShoppingCart, Heart, Trophy,
  Bookmark, Wrench, Activity, Menu, X, MoreHorizontal, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

interface DealerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dealer/inventory", label: "My Inventory", icon: Package },
  { href: "/dealer/add-vehicle", label: "Add Vehicle", icon: Plus },
  { href: "/dealer/marketplace", label: "Dealer Marketplace", icon: Store },
  { href: "/dealer/live-auction", label: "Live Auction", icon: Gavel },
  { href: "/dealer/my-auctions", label: "My Auctions", icon: Gavel },
  { href: "/dealer/auction-analytics", label: "Auction Analytics", icon: BarChart3 },
  { href: "/dealer/my-wins", label: "My Wins", icon: Trophy },
  { href: "/dealer/shortlist", label: "My Shortlist", icon: Bookmark },
  { href: "/dealer/cart", label: "Shopping Cart", icon: ShoppingCart },
  { href: "/dealer/watchlist", label: "Watchlist", icon: Heart },
  { href: "/dealer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dealer/ev-faults", label: "EV Faults Database", icon: Wrench },
  { href: "/dealer/inventory-health", label: "Inventory Health", icon: Activity },
  { href: "/dealer/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/dealer/test-drives", label: "Test Drives", icon: Calendar },
  { href: "/dealer/subscription", label: "Subscribe", icon: Crown },
  { href: "/dealer/inbox", label: "Enquiries Inbox", icon: MessageSquare },
];

// The 5 most important items shown in the bottom bar
const bottomNavItems = [
  { href: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dealer/inventory", label: "Inventory", icon: Package },
  { href: "/dealer/live-auction", label: "Auction", icon: Gavel },
  { href: "/dealer/my-wins", label: "Wins", icon: Trophy },
  { href: "/dealer/subscription", label: "Subscribe", icon: Crown },
];

function NavLinks({ location, onClose, unreadCount }: { location: string; onClose?: () => void; unreadCount?: number }) {
  return (
    <div className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        const showBadge = item.href === '/dealer/inbox' && unreadCount && unreadCount > 0;
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
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function DealerLayout({ children }: DealerLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: unreadData } = trpc.enquiries.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds for new enquiries
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r bg-card min-h-[calc(100vh-64px)] p-4 sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-y-auto">
          <NavLinks location={location} unreadCount={unreadCount} />
        </aside>

        {/* Main Content — extra bottom padding on mobile for the bottom nav bar */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch h-16 shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* "More" button opens the full Sheet menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">Dealer Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavLinks location={location} onClose={() => setMobileOpen(false)} unreadCount={unreadCount} />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
