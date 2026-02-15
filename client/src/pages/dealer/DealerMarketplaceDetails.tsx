import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ShoppingCart, CreditCard, MapPin, AlertTriangle, CheckCircle2, FileText, Phone, Mail, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import DealerLayout from "@/components/DealerLayout";
import MakeOfferDialog from "@/components/MakeOfferDialog";
import DeliveryCostCalculator from "@/components/DeliveryCostCalculator";

export default function DealerMarketplaceDetails() {
  const params = useParams();
  const carId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: car, isLoading } = trpc.dealer.getMarketplaceVehicleDetails.useQuery({ carId });

  const addToCartMutation = trpc.dealer.addToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const buyNowMutation = trpc.auction.buyNow.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process purchase");
    },
  });

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  if (!car) {
    return (
      <DealerLayout>
        <div className="container max-w-4xl py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2">Vehicle not found</h3>
              <p className="text-muted-foreground mb-4">This vehicle may have been sold or removed.</p>
              <Button onClick={() => navigate('/dealer/marketplace')}>
                Back to Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="container max-w-6xl py-8">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/dealer/marketplace')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle images */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video relative bg-muted">
                  {car.mainImage ? (
                    <img
                      src={car.mainImage}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">No image available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">
                      {car.year} {car.make} {car.model}
                    </CardTitle>

                  </div>
                  <Badge variant={car.condition === 'new' ? 'default' : 'secondary'} className="text-sm">
                    {car.condition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="text-lg font-semibold">{car.mileage?.toLocaleString() || 'N/A'} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Real Range</p>
                    <p className="text-lg font-semibold">{car.realRange || 'N/A'} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Battery</p>
                    <p className="text-lg font-semibold">{car.batteryCapacity || 'N/A'} kWh</p>
                  </div>

                </div>

                <Separator />

                {/* Technical specs */}
                <div>
                  <h3 className="font-semibold mb-3">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Type</span>
                      <span className="font-medium">{car.bodyType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transmission</span>
                      <span className="font-medium">{car.transmission || 'Automatic'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color</span>
                      <span className="font-medium">{car.color || 'N/A'}</span>
                    </div>

                  </div>
                </div>

                {car.description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">{car.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Trade details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Trade Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service history */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Service History</h4>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Full service history available</span>
                  </div>
                </div>

                <Separator />

                {/* Faults & condition notes */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Condition Notes
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No major faults reported</li>
                    <li>• Minor wear consistent with age and mileage</li>
                    <li>• All safety systems operational</li>
                    <li>• Battery health: 95%+</li>
                  </ul>
                </div>

                <Separator />

                {/* VAT status */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">VAT Status</span>
                  <Badge variant="outline">VAT Qualifying</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Location & logistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location & Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle Location</p>
                  <p className="font-medium">{car.dealerCity || 'Glasgow'}, Scotland</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Collection Options</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Collection available (Free)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Delivery available (POA)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Pricing & actions */}
          <div className="space-y-6">
            {/* Price card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Trade Price</CardTitle>
                <div className="text-3xl font-bold">
                  £{car.price ? parseFloat(car.price.toString()).toLocaleString() : 'N/A'}
                </div>
                <CardDescription className="text-xs">
                  + VAT if applicable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => buyNowMutation.mutate({ carId: car.id })}
                  disabled={buyNowMutation.isPending}
                >
                  {buyNowMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Now (£99 deposit)
                    </>
                  )}
                </Button>

                <MakeOfferDialog
                  carId={car.id}
                  carName={`${car.make} ${car.model}`}
                  askingPrice={parseFloat(car.price || '0')}
                  sellerId={car.dealerId || 0}
                />

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => addToCartMutation.mutate({ carId: car.id, priceAtAdd: car.price?.toString() || '0' })}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Add to Shortlist
                    </>
                  )}
                </Button>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• £99 non-refundable deposit secures vehicle</p>
                  <p>• 48-hour inspection window</p>
                  <p>• Balance due after inspection</p>
                </div>
              </CardContent>
            </Card>

            {/* Seller info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{car.dealerName || 'Arnold Clark'}</p>
                  <p className="text-sm text-muted-foreground">{car.dealerCity || 'Glasgow'}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Seller
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Seller
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>

            {/* Delivery Calculator */}
            {car.dealer?.postcode && (
              <DeliveryCostCalculator
                carId={car.id}
                sellerPostcode={car.dealer.postcode}
              />
            )}
          </div>
        </div>
      </DealerLayout>
  );
}
