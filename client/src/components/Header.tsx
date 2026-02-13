import { Link } from "wouter";
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

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">EVEEVO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                  <Link href="/browse">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Browse Vehicles
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/dealer/dashboard">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Dealers
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/finance">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Finance
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/compare">
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Compare
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right side - Auth & Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/favorites">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

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
                  <Link href="/account">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/reservations">
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>My Reservations</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/favorites">
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/account/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin/applications">
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin: Applications</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/dealers">
                        <DropdownMenuItem>
                          <Store className="mr-2 h-4 w-4" />
                          <span>Admin: Dealers</span>
                        </DropdownMenuItem>
                      </Link>
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
                <Link href="/browse">
                  <a className="text-lg font-medium hover:text-primary">Browse Vehicles</a>
                </Link>
                <Link href="/dealer/dashboard">
                  <a className="text-lg font-medium hover:text-primary">Dealers</a>
                </Link>
                <Link href="/finance">
                  <a className="text-lg font-medium hover:text-primary">Finance</a>
                </Link>
                <Link href="/compare">
                  <a className="text-lg font-medium hover:text-primary">Compare</a>
                </Link>
                {isAuthenticated && (
                  <>
                    <hr className="my-4" />
                    <Link href="/account">
                      <a className="text-lg font-medium hover:text-primary">My Account</a>
                    </Link>
                    <Link href="/reservations">
                      <a className="text-lg font-medium hover:text-primary">My Reservations</a>
                    </Link>
                    <Link href="/favorites">
                      <a className="text-lg font-medium hover:text-primary">Favorites</a>
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <hr className="my-4" />
                        <Link href="/admin/applications">
                          <a className="text-lg font-medium hover:text-primary flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Admin: Applications
                          </a>
                        </Link>
                        <Link href="/admin/dealers">
                          <a className="text-lg font-medium hover:text-primary flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            Admin: Dealers
                          </a>
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
