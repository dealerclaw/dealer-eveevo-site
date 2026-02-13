import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Gavel, Trophy, PoundSterling, Calendar } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { trpc } from "@/lib/trpc";

export default function SubscriptionAnalytics() {
  const { data: analytics, isLoading } = trpc.dealer.getSubscriptionAnalytics.useQuery();

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="container max-w-6xl py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DealerLayout>
    );
  }

  const stats = analytics || {
    vehiclesViewed: 0,
    bidsPlaced: 0,
    auctionsWon: 0,
    totalSpent: 0,
    estimatedRetailValue: 0,
    savingsAmount: 0,
    savingsPercentage: 0,
    subscriptionDays: 0,
  };

  const roiPercentage = stats.savingsAmount > 0 
    ? ((stats.savingsAmount / (stats.totalSpent + 99)) * 100).toFixed(1)
    : '0';

  return (
    <DealerLayout>
      <div className="container max-w-6xl py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your marketplace activity and ROI
          </p>
        </div>

        {/* ROI Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Return on Investment
            </CardTitle>
            <CardDescription>Your marketplace savings vs subscription cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-3xl font-bold text-green-600">
                  £{stats.savingsAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs estimated retail prices
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ROI Percentage</p>
                <p className="text-3xl font-bold text-primary">
                  {roiPercentage}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  savings on investment
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Days</p>
                <p className="text-3xl font-bold">
                  {stats.subscriptionDays}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  days active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vehicles Viewed
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vehiclesViewed}</div>
              <p className="text-xs text-muted-foreground">
                dealer marketplace listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bids Placed
              </CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bidsPlaced}</div>
              <p className="text-xs text-muted-foreground">
                auction bids submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Auctions Won
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.auctionsWon}</div>
              <p className="text-xs text-muted-foreground">
                successful purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Spent
              </CardTitle>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                on marketplace purchases
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
            <CardDescription>Detailed view of your marketplace transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Estimated Retail Value</span>
                <span className="text-lg font-bold">£{stats.estimatedRetailValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Total Purchase Price</span>
                <span className="text-lg font-bold">£{stats.totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-sm font-medium">Subscription Cost (£99/month)</span>
                <span className="text-lg font-bold">£{Math.ceil(stats.subscriptionDays / 30) * 99}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold">Net Savings</span>
                <span className="text-2xl font-bold text-green-600">
                  £{(stats.savingsAmount - (Math.ceil(stats.subscriptionDays / 30) * 99)).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Maximize Your ROI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Browse the live auction daily to discover the best wholesale deals</p>
            <p>• Set competitive bids early to secure vehicles before auction ends</p>
            <p>• Use Buy Now for immediate purchases on high-demand vehicles</p>
            <p>• Track retail prices to calculate your potential profit margins</p>
            <p>• Share your referral code to earn £20 credits per new dealer</p>
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
}
