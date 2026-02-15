import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Gavel, Clock, Target, Award } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuctionAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  const { data: analytics, isLoading } = trpc.dealer.getAuctionAnalytics.useQuery({
    timeRange,
  });

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  const stats = analytics?.stats || {
    totalAuctions: 0,
    completedAuctions: 0,
    activeAuctions: 0,
    totalRevenue: 0,
    averageBidsPerAuction: 0,
    conversionRate: 0,
    averageSalePrice: 0,
    reserveMetRate: 0,
  };

  const recentAuctions = analytics?.recentAuctions || [];

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Auction Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your auction performance and insights
            </p>
          </div>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.completedAuctions} completed auctions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedAuctions} of {stats.totalAuctions} auctions sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Bids per Auction</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageBidsPerAuction.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Average bidding activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserve Met Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reserveMetRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Auctions meeting reserve price
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Auction Performance</CardTitle>
              <CardDescription>Breakdown of your auction outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed (Sold)</span>
                </div>
                <span className="font-medium">{stats.completedAuctions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-medium">{stats.activeAuctions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Expired (No Sale)</span>
                </div>
                <span className="font-medium">
                  {stats.totalAuctions - stats.completedAuctions - stats.activeAuctions}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Insights</CardTitle>
              <CardDescription>Average sale performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Sale Price</span>
                <span className="font-medium">£{stats.averageSalePrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Auctions</span>
                <span className="font-medium">{stats.totalAuctions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">{stats.conversionRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Auctions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Auction History</CardTitle>
            <CardDescription>Your latest auction results</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAuctions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No auction history available for this time period
              </p>
            ) : (
              <div className="space-y-4">
                {recentAuctions.map((auction: any) => (
                  <div
                    key={auction.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {auction.make} {auction.model} {auction.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(auction.auctionEndDate).toLocaleDateString()} • {auction.totalBids} bids
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {auction.status === 'completed' ? (
                          <span className="text-green-600">
                            £{parseFloat(auction.finalPrice || '0').toLocaleString()}
                          </span>
                        ) : auction.status === 'expired_below_reserve' ? (
                          <span className="text-orange-600">Below Reserve</span>
                        ) : (
                          <span className="text-gray-500">No Bids</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {auction.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
}
