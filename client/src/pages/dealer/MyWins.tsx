import { trpc } from "@/lib/trpc";
import DealerLayout from "@/components/DealerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Car, Calendar, DollarSign, User, Phone, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function MyWins() {
  const [, setLocation] = useLocation();
  const { data: wins, isLoading } = trpc.auction.getMyBids.useQuery();
  
  const createPaymentCheckout = trpc.auction.createWinPaymentCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create payment checkout');
    },
  });

  // Filter to only show won auctions
  const wonAuctions = wins?.filter((bid: any) => bid.status === 'won') || [];

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              My Auction Wins
            </h1>
            <p className="text-muted-foreground mt-1">
              Vehicles you've successfully won in auctions
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {wonAuctions.length} {wonAuctions.length === 1 ? 'Win' : 'Wins'}
          </Badge>
        </div>

        {wonAuctions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Auction Wins Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start bidding on vehicles in the live auction to see your wins here
              </p>
              <Button onClick={() => setLocation('/dealer/live-auction')}>
                Go to Live Auction
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {wonAuctions.map((win: any) => (
              <Card key={win.id} className="overflow-hidden">
                <div className="grid md:grid-cols-[300px_1fr] gap-6">
                  {/* Vehicle Image */}
                  <div className="relative h-64 md:h-auto bg-gradient-to-br from-slate-800 to-slate-900">
                    {win.car?.mainImage ? (
                      <img
                        src={win.car.mainImage}
                        alt={`${win.car.make} ${win.car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Car className="h-16 w-16" />
                      </div>
                    )}
                    <Badge className="absolute top-4 left-4 bg-green-600 hover:bg-green-700">
                      <Trophy className="h-3 w-3 mr-1" />
                      Won
                    </Badge>
                  </div>

                  {/* Vehicle Details */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {win.car?.make} {win.car?.model} {win.car?.year}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {win.car?.mileage?.toLocaleString()} miles
                        </Badge>
                        <Badge variant="outline">
                          {win.car?.condition}
                        </Badge>
                        {win.car?.batteryCapacity && (
                          <Badge variant="outline">
                            {win.car.batteryCapacity} kWh
                          </Badge>
                        )}
                        {win.car?.realRange && (
                          <Badge variant="outline">
                            {win.car.realRange} miles range
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Winning Bid Info */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Winning Bid</p>
                          <p className="text-xl font-bold text-green-600">
                            £{parseFloat(win.bidAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Commitment Fee</p>
                          <p className="text-xl font-bold text-blue-600">
                            £99
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Won On</p>
                          <p className="font-medium">
                            {new Date(win.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Balance Due */}
                    <div className="border-t pt-4">
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                          Balance Due After Inspection
                        </h3>
                        <p className="text-2xl font-bold text-amber-600">
                          £{(parseFloat(win.bidAmount) - 99).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Pay balance via bank transfer after satisfactory vehicle inspection
                        </p>
                      </div>
                    </div>

                    {/* Seller Contact Info */}
                    {win.car?.dealerName && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Seller Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Dealer:</span>
                            <span className="font-medium">{win.car.dealerName}</span>
                          </p>
                          {win.car.dealerEmail && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${win.car.dealerEmail}`} className="text-primary hover:underline">
                                {win.car.dealerEmail}
                              </a>
                            </p>
                          )}
                          {win.car.dealerPhone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${win.car.dealerPhone}`} className="text-primary hover:underline">
                                {win.car.dealerPhone}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Next Steps</h3>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li>1. Pay £99 commitment fee within 48 hours (secures your win)</li>
                        <li>2. Contact seller to arrange vehicle inspection</li>
                        <li>3. Inspect vehicle condition in person</li>
                        <li>4. Pay remaining balance after satisfactory inspection</li>
                        <li>5. Arrange delivery or pickup with seller</li>
                      </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => createPaymentCheckout.mutate({ bidId: win.id })}
                        className="flex-1"
                        disabled={createPaymentCheckout.isPending}
                      >
                        {createPaymentCheckout.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay £99 Commitment Fee
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setLocation(`/cars/${win.carId}`)}
                        variant="outline"
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
