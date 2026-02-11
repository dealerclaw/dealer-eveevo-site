import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Car, Eye, MessageSquare, TrendingUp } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";

export default function DealerDashboard() {
  const { data: stats, isLoading } = trpc.dealer.getStats.useQuery();

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dealer Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory and track performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalListings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.availableListings || 0} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalInquiries || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.newInquiries || 0} new
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Views/Listing</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalListings && stats?.totalViews
                  ? Math.round(stats.totalViews / stats.totalListings)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per vehicle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
              <CardDescription>Latest customer inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentInquiries && stats.recentInquiries.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentInquiries.map((inquiry: any) => (
                    <div key={inquiry.id} className="flex items-start space-x-4">
                      <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{inquiry.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {inquiry.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent inquiries</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Listings</CardTitle>
              <CardDescription>Most viewed vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topListings && stats.topListings.length > 0 ? (
                <div className="space-y-4">
                  {stats.topListings.map((listing: any) => (
                    <div key={listing.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {listing.make} {listing.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {listing.year}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{listing.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No listing data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DealerLayout>
  );
}
