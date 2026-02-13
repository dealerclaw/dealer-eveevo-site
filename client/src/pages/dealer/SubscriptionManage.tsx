import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, AlertCircle, CheckCircle2, Gift, Copy, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DealerLayout from "@/components/DealerLayout";
import { trpc } from "@/lib/trpc";

export default function SubscriptionManage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const { data: subscription, isLoading } = trpc.dealer.getSubscriptionStatus.useQuery();
  const { data: referralCode } = trpc.dealer.getReferralCode.useQuery();
  const { data: referralStats } = trpc.dealer.getReferralStats.useQuery();
  const createPortalSession = trpc.dealer.createCustomerPortalSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.portalUrl;
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleManageBilling = () => {
    createPortalSession.mutate();
  };

  const handleCopyReferralCode = () => {
    if (referralCode?.referralCode) {
      navigator.clipboard.writeText(referralCode.referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyReferralLink = () => {
    const link = `${window.location.origin}/dealer/subscription?ref=${referralCode?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied to clipboard!");
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
                <Button 
                  onClick={handleManageBilling} 
                  className="w-full"
                  disabled={createPortalSession.isPending}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {createPortalSession.isPending ? 'Loading...' : 'Manage Billing & Subscription'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Update payment method, view invoices, or cancel subscription through Stripe's secure portal.
                </p>
              </>
            ) : (
              <Button asChild className="w-full">
                <a href="/dealer/subscription">Subscribe Now</a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Referral Program */}
        {isActive && referralCode && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <CardTitle>Referral Program</CardTitle>
              </div>
              <CardDescription>
                Earn £20 credit for each dealer you refer who subscribes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Referral Code */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold tracking-wider">{referralCode.referralCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyReferralCode}
                    className="h-auto"
                  >
                    <Copy className={`h-4 w-4 ${copiedCode ? 'text-green-500' : ''}`} />
                  </Button>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleCopyReferralLink}
                  className="mt-2 text-xs"
                >
                  Copy referral link
                </Button>
              </div>

              {/* Referral Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-background rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Successful Referrals</span>
                  </div>
                  <p className="text-2xl font-bold">{referralStats?.successfulReferrals || 0}</p>
                </div>

                <div className="bg-background rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Credits Earned</span>
                  </div>
                  <p className="text-2xl font-bold">£{referralStats?.referralCredits?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="bg-background rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Gift className="h-4 w-4" />
                    <span className="text-sm">Credit per Referral</span>
                  </div>
                  <p className="text-2xl font-bold">£20</p>
                </div>
              </div>

              {/* Referred Dealers */}
              {referralStats && referralStats.referredDealers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Referred Dealers</h3>
                  <div className="space-y-2">
                    {referralStats.referredDealers.map((dealer) => (
                      <div key={dealer.id} className="flex items-center justify-between bg-background rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{dealer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(dealer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={dealer.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {dealer.subscriptionStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Share your referral code with other dealers</li>
                  <li>• They enter your code when subscribing</li>
                  <li>• You earn £20 credit automatically</li>
                  <li>• Credits apply to your next renewal</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

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
