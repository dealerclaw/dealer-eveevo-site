import { trpc } from "@/lib/trpc";
import DealerLayout from "@/components/DealerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, MessageSquare, TrendingUp, Car, Phone } from "lucide-react";

export default function DealerAnalytics() {
  const { data: analytics, isLoading } = trpc.dealer.getAnalytics.useQuery();

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  if (!analytics) {
    return (
      <DealerLayout>
        <div className="container py-8">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your performance and understand your audience
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalVehicles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.recentViews} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInquiries}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.recentInquiries} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Views to inquiries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Contacts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              WhatsApp Contacts
            </CardTitle>
            <CardDescription>
              Approximate number of WhatsApp inquiries received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{analytics.whatsappContacts}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Direct customer contacts via WhatsApp button
            </p>
          </CardContent>
        </Card>

        {/* Top Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Top Viewed Vehicles</CardTitle>
            <CardDescription>
              Your most popular listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topVehicles && analytics.topVehicles.length > 0 ? (
              <div className="space-y-4">
                {analytics.topVehicles.map((vehicle, index) => (
                  <div key={vehicle.carId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">{vehicle.views}</span>
                      <span className="text-sm">views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No vehicle data available yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
}
