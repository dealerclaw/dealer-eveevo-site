import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Car, Heart, Search, User, LogOut, Settings, FileText, Menu, Shield, Store } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/105909607/wcQhzPmbNZtZHJPS.png" 
            alt="EVEEVO Logo" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/browse" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Browse Vehicles
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dealer/dashboard" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Dealers
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/finance" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Finance
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/compare" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Compare
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right side - Auth & Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/favorites">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/reservations')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>My Reservations</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin/applications')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin: Applications</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/dealers')}>
                        <Store className="mr-2 h-4 w-4" />
                        <span>Admin: Dealers</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/browse" className="text-lg font-medium hover:text-primary">
                  Browse Vehicles
                </Link>
                <Link href="/dealer/dashboard" className="text-lg font-medium hover:text-primary">
                  Dealers
                </Link>
                <Link href="/finance" className="text-lg font-medium hover:text-primary">
                  Finance
                </Link>
                <Link href="/compare" className="text-lg font-medium hover:text-primary">
                  Compare
                </Link>
                {isAuthenticated && (
                  <>
                    <hr className="my-4" />
                    <Link href="/account" className="text-lg font-medium hover:text-primary">
                      My Account
                    </Link>
                    <Link href="/reservations" className="text-lg font-medium hover:text-primary">
                      My Reservations
                    </Link>
                    <Link href="/favorites" className="text-lg font-medium hover:text-primary">
                      Favorites
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <hr className="my-4" />
                        <Link href="/admin/applications" className="text-lg font-medium hover:text-primary flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Admin: Applications
                        </Link>
                        <Link href="/admin/dealers" className="text-lg font-medium hover:text-primary flex items-center gap-2">
                          <Store className="w-5 h-5" />
                          Admin: Dealers
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
