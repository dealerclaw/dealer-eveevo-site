import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Store, Car, Phone, Mail, Globe, MessageSquare, CheckCircle, XCircle, UserCog, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDealers() {
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [showCarsDialog, setShowCarsDialog] = useState(false);
  const [impersonatingDealerId, setImpersonatingDealerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Paywall feature flag
  const { data: paywallData, refetch: refetchPaywall } = trpc.admin.getPaywallStatus.useQuery();
  const paywallEnabled = paywallData?.paywallEnabled ?? false;
  const setPaywallMutation = trpc.admin.setPaywallStatus.useMutation({
    onSuccess: (data: { success: boolean; paywallEnabled: boolean }) => {
      toast.success(data.paywallEnabled ? 'Paywall enabled — dealers must subscribe to access premium features' : 'Paywall disabled — all dealers can access all features for free');
      refetchPaywall();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Failed to update paywall setting'),
  });
  
  const impersonateMutation = trpc.admin.impersonate.useMutation({
    onMutate: (variables) => {
      console.log('[Impersonate Client] Starting impersonation for dealer:', variables.dealerId);
    },
    onSuccess: (data) => {
      console.log('[Impersonate Client] Success, dealer name:', data.dealerName);
      toast.success(`Switched to dealer: ${data.dealerName}`);
      // Wait a moment for cookie to be set, then redirect
      setTimeout(() => {
        console.log('[Impersonate Client] Redirecting to dealer dashboard');
        window.location.href = "/dealer/dashboard";
      }, 1000);
    },
    onError: (error) => {
      console.log('[Impersonate Client] Error:', error.message);
      toast.error(error.message || "Failed to impersonate dealer");
      setImpersonatingDealerId(null);
    },
  });
  
  const { data: dealers, isLoading } = trpc.admin.getAllDealers.useQuery();
  const { data: dealerCars, isLoading: loadingCars } = trpc.admin.getDealerCars.useQuery(
    { dealerId: selectedDealerId! },
    { enabled: !!selectedDealerId && showCarsDialog }
  );

  const handleViewCars = (dealerId: number) => {
    setSelectedDealerId(dealerId);
    setShowCarsDialog(true);
  };

  const selectedDealer = dealers?.find(d => d.id === selectedDealerId);

  // Filter dealers based on search query
  const filteredDealers = dealers?.filter(dealer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dealer.name?.toLowerCase().includes(query) ||
      dealer.email?.toLowerCase().includes(query) ||
      dealer.city?.toLowerCase().includes(query) ||
      dealer.postcode?.toLowerCase().includes(query) ||
      dealer.phone?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dealer Management</h1>
          <p className="text-muted-foreground">
            View and manage all dealers on the platform
          </p>
        </div>

        {/* Paywall Feature Toggle */}
        <Card className="mb-6 border-2 border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>💳</span> Dealer Subscription Paywall
                </CardTitle>
                <CardDescription className="mt-1">
                  {paywallEnabled
                    ? 'Paywall is ON — dealers must have an active subscription to access the marketplace, auctions, EV faults database, and dealer network.'
                    : 'Paywall is OFF — all dealers can access all features for free. Enable this when you are ready to monetise.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className={`text-sm font-medium ${paywallEnabled ? 'text-destructive' : 'text-green-600'}`}>
                  {paywallEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  role="switch"
                  aria-checked={paywallEnabled}
                  onClick={() => setPaywallMutation.mutate({ enabled: !paywallEnabled })}
                  disabled={setPaywallMutation.isPending}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    paywallEnabled ? 'bg-destructive' : 'bg-green-500'
                  } ${setPaywallMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      paywallEnabled ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Dealers ({filteredDealers?.length || 0}{searchQuery && ` of ${dealers?.length || 0}`})</CardTitle>
            <CardDescription>
              Complete list of registered dealers with their information and listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cars</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers && filteredDealers.length > 0 ? (
                    filteredDealers.map((dealer) => (
                      <TableRow key={dealer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{dealer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {dealer.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {dealer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {dealer.email}
                              </div>
                            )}
                            {dealer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {dealer.phone}
                              </div>
                            )}
                            {dealer.whatsappNumber && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {dealer.whatsappNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {dealer.city && <div>{dealer.city}</div>}
                            {dealer.postcode && (
                              <div className="text-muted-foreground">{dealer.postcode}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{dealer.carCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dealer.subscriptionStatus === 'active' ? (
                            <Badge className="bg-green-500">
                              Active (£99/mo)
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free Tier</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {dealer.isVerified ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCars(dealer.id)}
                            >
                              View Cars
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                if (impersonatingDealerId === null) {
                                  setImpersonatingDealerId(dealer.id);
                                  impersonateMutation.mutate({ dealerId: dealer.id });
                                }
                              }}
                              disabled={impersonatingDealerId === dealer.id}
                            >
                              {impersonatingDealerId === dealer.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Switching...
                                </>
                              ) : (
                                <>
                                  <UserCog className="w-4 h-4 mr-1" />
                                  Impersonate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No dealers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dealer Cars Dialog */}
        <Dialog open={showCarsDialog} onOpenChange={setShowCarsDialog}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDealer?.name} - Car Listings
              </DialogTitle>
              <DialogDescription>
                {dealerCars?.length || 0} vehicles listed by this dealer
              </DialogDescription>
            </DialogHeader>

            {loadingCars ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : dealerCars && dealerCars.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Marketplace</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealerCars.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {car.make} {car.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {car.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{car.year}</TableCell>
                        <TableCell>
                          {car.price ? `£${parseFloat(car.price.toString()).toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {car.mileage ? `${car.mileage.toLocaleString()} mi` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {car.realRange ? `${car.realRange} mi` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={car.condition === 'new' ? 'default' : 'secondary'}>
                            {car.condition || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {car.isAvailable ? (
                            <Badge className="bg-green-500">Available</Badge>
                          ) : (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={car.marketplace === 'dealer_only' ? 'outline' : 'default'}>
                            {car.marketplace === 'dealer_only' ? 'Dealer Only' : 'Consumer'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No cars found for this dealer
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
