import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, FileText, Download } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { toast } from "sonner";

export default function PurchaseDetails() {
  const [, params] = useRoute("/dealer/purchases/:id");
  const [, setLocation] = useLocation();
  const purchaseId = params?.id ? parseInt(params.id) : 0;

  const { data: purchase, isLoading } = trpc.dealer.getPurchaseDetails.useQuery(
    { purchaseId },
    { enabled: !!purchaseId }
  );

  const downloadReceipt = trpc.dealer.downloadPurchaseReceipt.useMutation({
    onSuccess: (data) => {
      // Create a blob and download
      const blob = new Blob([data.content], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-receipt-${purchaseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Receipt downloaded successfully");
    },
    onError: () => {
      toast.error("Failed to download receipt");
    },
  });

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DealerLayout>
    );
  }

  if (!purchase) {
    return (
      <DealerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Purchase not found</p>
          <Button onClick={() => setLocation('/dealer/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dealer/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Purchase Details</h1>
              <p className="text-muted-foreground">Order #{purchase.id}</p>
            </div>
          </div>
          <Button
            onClick={() => downloadReceipt.mutate({ purchaseId })}
            disabled={downloadReceipt.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Vehicle Information */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchase.vehicle.mainImage && (
                  <img
                    src={purchase.vehicle.mainImage}
                    alt={`${purchase.vehicle.make} ${purchase.vehicle.model}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="text-2xl font-bold">
                    {purchase.vehicle.make} {purchase.vehicle.model}
                  </h3>
                  <p className="text-muted-foreground">{purchase.vehicle.year}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium capitalize">{purchase.vehicle.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-medium">{purchase.vehicle.mileage?.toLocaleString()} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Real Range</p>
                    <p className="font-medium">{purchase.vehicle.realRange} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Battery Capacity</p>
                    <p className="font-medium">{purchase.vehicle.batteryCapacity} kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p className="font-medium">{purchase.vehicle.transmission}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{purchase.vehicle.color}</p>
                  </div>
                </div>

                {purchase.vehicle.vin && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">VIN</p>
                      <p className="font-mono text-sm">{purchase.vehicle.vin}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
                <CardDescription>Contact the seller for delivery arrangements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{purchase.seller.name}</p>
                </div>

                <div className="space-y-3">
                  {purchase.seller.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <a
                        href={`mailto:${purchase.seller.email}`}
                        className="text-primary hover:underline"
                      >
                        {purchase.seller.email}
                      </a>
                    </div>
                  )}

                  {purchase.seller.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <a
                        href={`tel:${purchase.seller.phone}`}
                        className="text-primary hover:underline"
                      >
                        {purchase.seller.phone}
                      </a>
                    </div>
                  )}

                  {purchase.seller.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{purchase.seller.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Method</p>
                    <p className="font-medium capitalize">{purchase.purchaseMethod}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
                  <p className="text-3xl font-bold text-green-600">
                    £{parseFloat(purchase.purchasePrice).toLocaleString()}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="default" className="mt-1">
                      {purchase.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Contact the seller to arrange delivery or pickup</li>
                  <li>• Verify vehicle condition upon delivery</li>
                  <li>• Complete ownership transfer documentation</li>
                  <li>• Update vehicle registration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DealerLayout>
  );
}
