import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Gavel, TrendingUp, Users } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { Link } from "wouter";

export default function SubscriptionSuccess() {
  return (
    <DealerLayout>
      <div className="container max-w-3xl py-12">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Welcome to the Dealer Marketplace!</CardTitle>
            <CardDescription className="text-base">
              Your subscription is now active. Start trading wholesale vehicles today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-background rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Gavel className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Browse Live Auctions</p>
                    <p className="text-sm text-muted-foreground">
                      Check out the live auction carousel with 60-second rotation and place your first bid
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Explore Dealer Marketplace</p>
                    <p className="text-sm text-muted-foreground">
                      Browse wholesale inventory from verified dealers across the UK
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">List Your Own Vehicles</p>
                    <p className="text-sm text-muted-foreground">
                      Move part-exchange or hard-to-sell EVs to the dealer marketplace for quick sale
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button asChild size="lg" className="flex-1">
                <Link href="/dealer/live-auction">
                  <Gavel className="mr-2 h-4 w-4" />
                  Start Bidding
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1">
                <Link href="/dealer/marketplace">
                  Browse Marketplace
                </Link>
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need help getting started?{" "}
                <a href="mailto:support@eveevo.com" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
}
