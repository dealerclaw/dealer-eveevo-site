import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, TrendingDown, Clock, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

export default function DealerInventoryHealth() {
  const [healthFilter, setHealthFilter] = useState<"all" | "green" | "amber" | "blue">("all");
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [pushMode, setPushMode] = useState<"marketplace" | "auction">("marketplace");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");

  const { data: inventory, isLoading, refetch } = trpc.dealer.getInventoryHealth.useQuery({ 
    healthFilter: healthFilter === "all" ? undefined : healthFilter 
  });

  const pushToNetwork = trpc.dealer.pushToDealerNetwork.useMutation({
    onSuccess: () => {
      toast.success(`Vehicle pushed to dealer ${pushMode === "auction" ? "auction" : "marketplace"}!`);
      setPushDialogOpen(false);
      setSelectedCar(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePushClick = (car: any) => {
    setSelectedCar(car);
    setMinimumPrice((Number(car.price) * 0.8).toFixed(2));
    setReservePrice((Number(car.price) * 0.7).toFixed(2));
    setBuyNowPrice(car.price);
    setPushDialogOpen(true);
  };

  const handlePushSubmit = () => {
    if (!selectedCar) return;

    pushToNetwork.mutate({
      carId: selectedCar.id,
      mode: pushMode,
      minimumPrice: pushMode === "marketplace" ? Number(minimumPrice) : undefined,
      reservePrice: pushMode === "auction" ? Number(reservePrice) : undefined,
      buyNowPrice: pushMode === "auction" ? Number(buyNowPrice) : undefined,
    });
  };

  const getHealthBadge = (rating: string | null, daysOnMarket: number) => {
    const actualRating = rating || (daysOnMarket > 45 ? "blue" : daysOnMarket > 30 ? "amber" : "green");
    
    if (actualRating === "green") {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Healthy</Badge>;
    } else if (actualRating === "amber") {
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" />Warning</Badge>;
    } else {
      return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" />Action Needed</Badge>;
    }
  };

  const getHealthMessage = (rating: string | null, daysOnMarket: number, priceChange: string | null) => {
    const actualRating = rating || (daysOnMarket > 45 ? "blue" : daysOnMarket > 30 ? "amber" : "green");
    const priceChangeNum = Number(priceChange) || 0;

    if (actualRating === "blue") {
      return `This vehicle has been on market for ${daysOnMarket} days${priceChangeNum < -5 ? ` and price dropped ${Math.abs(priceChangeNum).toFixed(1)}%` : ""}. Consider pushing to dealer network to sell faster.`;
    } else if (actualRating === "amber") {
      return `This vehicle has been on market for ${daysOnMarket} days. Monitor closely or consider dealer network if it doesn't sell soon.`;
    }
    return `This vehicle is selling at a healthy pace.`;
  };

  const stats = {
    total: inventory?.length || 0,
    green: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "green";
    }).length || 0,
    amber: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "amber";
    }).length || 0,
    blue: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "blue";
    }).length || 0,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Health Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your inventory performance and identify vehicles that need attention
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.green}</div>
            <p className="text-xs text-muted-foreground">0-30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.amber}</div>
            <p className="text-xs text-muted-foreground">31-45 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Action Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blue}</div>
            <p className="text-xs text-muted-foreground">45+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={healthFilter} onValueChange={(value: any) => setHealthFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="green">Healthy Only</SelectItem>
            <SelectItem value="amber">Warning Only</SelectItem>
            <SelectItem value="blue">Action Needed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory List */}
      {isLoading ? (
        <div className="text-center py-12">Loading inventory...</div>
      ) : !inventory || inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No vehicles found matching your filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inventory.map((car: any) => {
            const actualRating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
            const priceChangeNum = Number(car.priceChangePercentage) || 0;

            return (
              <Card key={car.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {car.mainImage && (
                      <img
                        src={car.mainImage}
                        alt={`${car.make} ${car.model}`}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="text-2xl font-bold text-primary mt-1">
                            £{Number(car.price).toLocaleString()}
                          </p>
                        </div>
                        {getHealthBadge(car.inventoryHealthRating, car.daysOnMarket)}
                      </div>

                      <div className="flex gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {car.daysOnMarket} days on market
                        </div>
                        {priceChangeNum !== 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            Price {priceChangeNum > 0 ? "increased" : "dropped"} {Math.abs(priceChangeNum).toFixed(1)}%
                          </div>
                        )}
                        {car.marketplace === "dealer_only" && (
                          <Badge variant="outline">On Dealer Network</Badge>
                        )}
                      </div>

                      {(actualRating === "amber" || actualRating === "blue") && (
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <p className="text-sm">{getHealthMessage(car.inventoryHealthRating, car.daysOnMarket, car.priceChangePercentage)}</p>
                        </div>
                      )}

                      {(actualRating === "amber" || actualRating === "blue") && car.marketplace !== "dealer_only" && (
                        <Button onClick={() => handlePushClick(car)} className="mt-2">
                          <Send className="w-4 h-4 mr-2" />
                          Push to Dealer Network
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Push to Network Dialog */}
      <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push to Dealer Network</DialogTitle>
            <DialogDescription>
              Choose how you want to list this vehicle to other dealers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={pushMode} onValueChange={(value: any) => setPushMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="marketplace" id="marketplace" />
                <Label htmlFor="marketplace">Dealer Marketplace (Fixed Price)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auction" id="auction" />
                <Label htmlFor="auction">Dealer Auction (48 hours)</Label>
              </div>
            </RadioGroup>

            {pushMode === "marketplace" ? (
              <div>
                <Label htmlFor="minimumPrice">Minimum Price</Label>
                <Input
                  id="minimumPrice"
                  type="number"
                  value={minimumPrice}
                  onChange={(e) => setMinimumPrice(e.target.value)}
                  placeholder="Minimum acceptable price"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suggested: 80% of current price
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="reservePrice">Reserve Price</Label>
                  <Input
                    id="reservePrice"
                    type="number"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    placeholder="Minimum bid to win"
                  />
                </div>
                <div>
                  <Label htmlFor="buyNowPrice">Buy Now Price</Label>
                  <Input
                    id="buyNowPrice"
                    type="number"
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value)}
                    placeholder="Instant purchase price"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPushDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePushSubmit} disabled={pushToNetwork.isPending}>
              {pushToNetwork.isPending ? "Pushing..." : "Push to Network"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
