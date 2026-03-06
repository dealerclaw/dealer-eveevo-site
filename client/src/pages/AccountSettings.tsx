import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Shield, Bell, ExternalLink, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AccountSettings() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out successfully");
      window.location.href = "/";
    },
    onError: () => {
      toast.error("Failed to sign out");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const roleLabel = user.role === "admin" ? "Administrator" : user.role === "dealer" ? "Dealer" : "Consumer";
  const roleBadgeVariant = user.role === "admin" ? "destructive" : user.role === "dealer" ? "default" : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, security, and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                <div>
                  <p className="text-lg font-semibold">{user.name || "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant={roleBadgeVariant} className="mt-1">{roleLabel}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full name</p>
                  <p className="font-medium">{user.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email address</p>
                  <p className="font-medium">{user.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account role</p>
                  <p className="font-medium">{roleLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account ID</p>
                  <p className="font-medium font-mono text-xs text-muted-foreground">{user.id}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Profile details (name, profile photo, email, password) are managed through your Clerk account portal.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://accounts.eveevo.co.uk/user", "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Edit Profile in Account Portal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and connected accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Password changes, two-factor authentication, and connected social accounts (Google, etc.) are managed through the Clerk account portal.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://accounts.eveevo.co.uk/user/security", "_blank")}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manage Security Settings
              </Button>
            </CardContent>
          </Card>

          {/* Notifications placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Email and in-app notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification preferences will be available here in a future update. You will be able to control alerts for new listings matching your saved searches, price drops, and reservation updates.
              </p>
            </CardContent>
          </Card>

          {/* Role-specific links */}
          {user.role === "dealer" && (
            <Card>
              <CardHeader>
                <CardTitle>Dealer Account</CardTitle>
                <CardDescription>Manage your dealership profile and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dealer/settings")}
                  className="gap-2"
                >
                  Go to Dealer Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {user.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>Access dealer management and platform settings</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/dealers")}>
                  Dealer Management
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/applications")}>
                  Applications
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/inventory-health")}>
                  Inventory Health
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sign Out */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Sign Out
              </CardTitle>
              <CardDescription>Sign out of your EVEEVO account on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="gap-2"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
