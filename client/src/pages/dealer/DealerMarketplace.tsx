import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Lock, CreditCard, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import DealerLayout from "@/components/DealerLayout";

export default function DealerMarketplace() {
  const { data: authData } = trpc.auth.me.useQuery();
  const user = authData?.user;
  const [, navigate] = useLocation();

  // Get subscription status
  const { data: subscription, isLoading: loadingSubscription } = trpc.dealer.getSubscriptionStatus.useQuery();

  // Get paywall feature flag
  const { data: paywallData } = trpc.siteSettings.getPaywallStatus.useQuery();
  const paywallEnabled = paywallData?.paywallEnabled ?? true; // default to enabled until loaded

  // Get dealer marketplace listings (accessible if paywall off OR subscription active)
  const canAccessMarketplace = !paywallEnabled || subscription?.status === 'active';
  const { data: cars, isLoading: loadingCars, refetch } = trpc.dealer.getDealerMarketplace.useQuery(
    { limit: 100 },
    { enabled: canAccessMarketplace }
  );

  // Create subscription mutation
  const createSubscription = trpc.dealer.createSubscription.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to secure payment...");
        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create subscription");
    },
  });

  const handleSubscribe = () => {
    createSubscription.mutate();
  };

  if (!user) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>Please log in to access the dealer marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DealerLayout>
    );
  }

  if (user.role !== 'dealer') {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Dealer Access Required</CardTitle>
              <CardDescription>This page is only accessible to verified dealers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you're a dealer, please apply for dealer access.
              </p>
              <Button className="w-full" onClick={() => navigate('/become-a-dealer')}>
                Become a Dealer
              </Button>
            </CardContent>
          </Card>
        </div>
      </DealerLayout>
    );
  }

  if (loadingSubscription) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  // Show subscription prompt only if paywall is enabled and not subscribed
  if (paywallEnabled && subscription?.status !== 'active') {
    return (
      <DealerLayout>
        <div className="container max-w-4xl py-12">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Dealer-to-Dealer Marketplace</CardTitle>
              <CardDescription className="text-lg mt-2">
                Access exclusive wholesale opportunities with other verified dealers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">What you get:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>Buy and sell vehicles exclusively with other dealers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>Move your inventory between consumer and dealer marketplaces</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>Access wholesale pricing and dealer-only listings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>Unlimited buying and selling - no transaction fees</span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-2xl font-bold">£99/month</p>
                    <p className="text-sm text-muted-foreground">Cancel anytime</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    7-day free trial
                  </Badge>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={createSubscription.isPending}
                >
                  {createSubscription.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure payment processed by Stripe. Cancel anytime from your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DealerLayout>
    );
  }

  // Show marketplace listings
  return (
    <DealerLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dealer Marketplace</h1>
            <p className="text-muted-foreground mt-2">
              Browse and purchase vehicles from other verified dealers
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Active Subscription
          </Badge>
        </div>

        {loadingCars ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !cars || cars.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No vehicles available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There are currently no vehicles listed on the dealer marketplace. Check back soon for new listings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-muted">
                  {car.mainImage ? (
                    <img
                      src={car.mainImage}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {car.year} {car.make} {car.model}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{car.condition}</Badge>
                    {car.mileage && <span>{car.mileage.toLocaleString()} miles</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="text-xl font-bold">
                        £{car.price ? parseFloat(car.price.toString()).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {car.realRange && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Real Range</span>
                        <span>{car.realRange} miles</span>
                      </div>
                    )}
                    {car.batteryCapacity && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Battery</span>
                        <span>{car.batteryCapacity} kWh</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      const message = `Hi, I'm interested in your ${car.year} ${car.make} ${car.model} listed on EVEEVO Dealer Marketplace for £${car.price ? parseFloat(car.price.toString()).toLocaleString() : 'N/A'}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button className="flex-1" onClick={() => navigate(`/dealer/marketplace/${car.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
