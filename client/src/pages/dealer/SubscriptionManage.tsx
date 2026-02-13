import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { trpc } from "@/lib/trpc";

export default function SubscriptionManage() {
  const { data: subscription, isLoading } = trpc.dealer.getSubscriptionStatus.useQuery();

  const handleCancelSubscription = () => {
    alert("Subscription cancellation will be implemented soon. Please contact support to cancel.");
  };

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="container max-w-4xl py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DealerLayout>
    );
  }

  const isActive = subscription?.status === "active";
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;

  return (
    <DealerLayout>
      <div className="container max-w-4xl py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your dealer marketplace subscription and billing
          </p>
        </div>

        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Dealer Marketplace Access</CardDescription>
              </div>
              <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
                {isActive ? (
                  <><CheckCircle2 className="mr-1 h-3 w-3" /> Active</>
                ) : (
                  <><AlertCircle className="mr-1 h-3 w-3" /> Inactive</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? "Dealer Marketplace - £99/month" : "No active subscription"}
                  </p>
                </div>
              </div>

              {expiresAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Renewal Date</p>
                    <p className="text-sm text-muted-foreground">
                      {expiresAt.toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isActive && (
              <div className="pt-4 border-t space-y-3">
                <h3 className="font-semibold">Subscription Benefits</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Access to live dealer auctions with 60-second carousel</li>
                  <li>✓ Browse and bid on wholesale inventory</li>
                  <li>✓ List unlimited vehicles in dealer marketplace</li>
                  <li>✓ Direct WhatsApp contact with other dealers</li>
                  <li>✓ Real-time bid notifications</li>
                  <li>✓ Buy Now instant purchase option</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>Update payment method or cancel your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActive ? (
              <>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" disabled>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Update Payment Method
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your dealer marketplace subscription? 
                          You'll lose access to auctions and wholesale trading at the end of your current billing period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Update payment method functionality coming soon. Contact support if you need to update your card.
                </p>
              </>
            ) : (
              <Button asChild className="w-full">
                <a href="/dealer/subscription">Subscribe Now</a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Billing history will appear here</p>
              <p className="text-sm mt-2">Coming soon: Download invoices and view payment history</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
}
