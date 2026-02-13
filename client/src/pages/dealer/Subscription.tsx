import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Crown, TrendingUp, Users, Shield, Gift } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import DealerLayout from "@/components/DealerLayout";

export default function Subscription() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralValidation, setReferralValidation] = useState<{ valid: boolean; dealerName?: string } | null>(null);

  const { data: subscriptionStatus } = trpc.dealer.getSubscriptionStatus.useQuery(undefined, {
    enabled: !!user,
  });

  const validateReferralQuery = trpc.dealer.validateReferralCode.useQuery(
    { code: referralCode },
    { 
      enabled: false,
    }
  );

  // Handle validation result
  useEffect(() => {
    if (validateReferralQuery.data) {
      setReferralValidation(validateReferralQuery.data);
      if (validateReferralQuery.data.valid) {
        toast.success(`Referral code valid! Referred by ${validateReferralQuery.data.dealerName}`);
      } else {
        toast.error("Invalid referral code");
      }
    }
  }, [validateReferralQuery.data]);

  const createCheckoutMutation = trpc.dealer.createSubscription.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setIsLoading(false);
    },
  });

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Please log in to subscribe");
      window.location.href = getLoginUrl();
      return;
    }

    setIsLoading(true);
    createCheckoutMutation.mutate({
      referralCode: referralValidation?.valid ? referralCode : undefined,
    });
  };

  const features = [
    { icon: Crown, text: "Access to exclusive dealer-only marketplace" },
    { icon: TrendingUp, text: "Bid on wholesale vehicles from other dealers" },
    { icon: Users, text: "Connect directly with verified dealers via WhatsApp" },
    { icon: Shield, text: "Secure auction system with buyer protection" },
    { icon: Check, text: "Live auction carousel with 60-second rotation" },
    { icon: Check, text: "Buy Now option for instant purchases" },
    { icon: Check, text: "7-day auction listings" },
    { icon: Check, text: "Real-time bid notifications" },
  ];

  return (
    <DealerLayout>
      <div className="container max-w-4xl py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Dealer Marketplace
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Unlock Wholesale Trading
          </h1>
          <p className="text-xl text-muted-foreground">
            Join the exclusive dealer-to-dealer marketplace and access wholesale EV inventory
          </p>
        </div>

        {subscriptionStatus?.status === 'active' ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Active Subscription
              </CardTitle>
              <CardDescription>
                Your subscription is active until {subscriptionStatus.expiresAt ? new Date(subscriptionStatus.expiresAt).toLocaleDateString() : 'renewal'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You have full access to the dealer marketplace. Start bidding on wholesale vehicles now!
              </p>
              <Button asChild>
                <a href="/dealer/live-auction">Go to Live Auction</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <Badge className="mb-4" variant="default">
                7-Day Free Trial
              </Badge>
              <CardTitle className="text-3xl">£99/month</CardTitle>
              <CardDescription>
                Try free for 7 days • Cancel anytime • No long-term commitment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t">
                <div className="bg-primary/10 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-center">
                    🎉 Start your 7-day free trial today
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    No charge for 7 days. Cancel anytime during trial period.
                  </p>
                </div>

                {/* Referral Code Input */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="referralCode" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Have a referral code? (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        setReferralValidation(null);
                      }}
                      className={referralValidation?.valid ? "border-green-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => validateReferralQuery.refetch()}
                      disabled={!referralCode || validateReferralQuery.isFetching}
                    >
                      {validateReferralQuery.isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  {referralValidation?.valid && (
                    <p className="text-xs text-green-600">
                      ✓ Valid code from {referralValidation.dealerName}
                    </p>
                  )}
                  {referralValidation && !referralValidation.valid && (
                    <p className="text-xs text-red-600">
                      Invalid referral code
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure payment powered by Stripe • Instant activation
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 space-y-4">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Refer a Dealer, Earn £20
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Already subscribed? Share your unique referral code with other dealers.
                When they subscribe, you'll receive £20 credit towards your next renewal!
              </p>
              <Button asChild variant="outline" className="mt-4">
                <a href="/dealer/subscription/manage">View My Referral Code</a>
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Questions? Contact us at{" "}
              <a href="mailto:support@eveevo.com" className="text-primary hover:underline">
                support@eveevo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </DealerLayout>
  );
}
