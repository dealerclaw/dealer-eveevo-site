import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Gavel, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function LiveAuction() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per vehicle

  const { data: vehicles, isLoading, refetch } = trpc.auction.getActiveVehicles.useQuery();
  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: () => {
      toast.success("Bid placed successfully!");
      setBidAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place bid");
    },
  });

  // Auto-rotate carousel every 60 seconds
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next vehicle
          setCurrentIndex((current) => (current + 1) % vehicles.length);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [vehicles]);

  const handlePrevious = () => {
    if (!vehicles) return;
    setCurrentIndex((current) => (current - 1 + vehicles.length) % vehicles.length);
    setTimeLeft(60);
  };

  const handleNext = () => {
    if (!vehicles) return;
    setCurrentIndex((current) => (current + 1) % vehicles.length);
    setTimeLeft(60);
  };

  const handlePlaceBid = () => {
    if (!user) {
      toast.error("Please log in to place bids");
      window.location.href = getLoginUrl();
      return;
    }

    const currentVehicle = vehicles?.[currentIndex];
    if (!currentVehicle) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    placeBidMutation.mutate({
      carId: currentVehicle.id,
      bidAmount: amount,
    });
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Auction ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Gavel className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Auctions</h2>
            <p className="text-muted-foreground">
              There are currently no vehicles in auction. Check back soon for new listings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVehicle = vehicles[currentIndex];
  const nextVehicle = vehicles[(currentIndex + 1) % vehicles.length];
  const currentBid = currentVehicle.currentHighestBid 
    ? parseFloat(currentVehicle.currentHighestBid.toString())
    : parseFloat(currentVehicle.startingBid?.toString() || '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">EVEEVO Live Auction</h1>
              <p className="text-sm text-white/60">Dealer-to-Dealer Wholesale Marketplace</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            Next in {timeLeft}s
          </Badge>
        </div>
      </div>

      {/* Main Auction Display */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Vehicle Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="relative aspect-video bg-black">
                {currentVehicle.mainImage ? (
                  <img
                    src={currentVehicle.mainImage}
                    alt={`${currentVehicle.make} ${currentVehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    No image available
                  </div>
                )}
                
                {/* Auction Timer Overlay */}
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  {currentVehicle.auctionEndDate && formatTimeRemaining(currentVehicle.auctionEndDate)}
                </div>

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="border-white/20 text-white">
                      {currentVehicle.condition}
                    </Badge>
                    {currentVehicle.mileage && (
                      <span className="text-white/60">{currentVehicle.mileage.toLocaleString()} miles</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/10">
                  {currentVehicle.realRange && (
                    <div>
                      <p className="text-sm text-white/60">Real Range</p>
                      <p className="text-lg font-semibold text-white">{currentVehicle.realRange} miles</p>
                    </div>
                  )}
                  {currentVehicle.batteryCapacity && (
                    <div>
                      <p className="text-sm text-white/60">Battery</p>
                      <p className="text-lg font-semibold text-white">{currentVehicle.batteryCapacity} kWh</p>
                    </div>
                  )}
                  {currentVehicle.chargingTime && (
                    <div>
                      <p className="text-sm text-white/60">Charging</p>
                      <p className="text-lg font-semibold text-white">{currentVehicle.chargingTime}</p>
                    </div>
                  )}
                </div>

                {currentVehicle.description && (
                  <p className="text-white/80">{currentVehicle.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Next Up Preview */}
            {vehicles.length > 1 && (
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-white/60 uppercase">Next Up:</div>
                    <div className="flex-1 flex items-center gap-4">
                      {nextVehicle.mainImage && (
                        <img
                          src={nextVehicle.mainImage}
                          alt={`${nextVehicle.make} ${nextVehicle.model}`}
                          className="w-20 h-14 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          {nextVehicle.year} {nextVehicle.make} {nextVehicle.model}
                        </p>
                        <p className="text-sm text-white/60">
                          Starting bid: £{parseFloat(nextVehicle.startingBid?.toString() || '0').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bidding Panel */}
          <div className="space-y-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <div className="text-center py-4 border-b border-white/10">
                  <p className="text-sm text-white/60 mb-2">Current Highest Bid</p>
                  <p className="text-4xl font-bold text-primary">
                    £{currentBid.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bidAmount" className="text-white">Your Bid Amount</Label>
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">£</span>
                        <Input
                          id="bidAmount"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Min: £${(currentBid + 100).toLocaleString()}`}
                          className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-2">
                      Minimum bid: £{(currentBid + 100).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePlaceBid}
                    disabled={placeBidMutation.isPending || !bidAmount}
                  >
                    {placeBidMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Bid...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Place Bid
                      </>
                    )}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-white/60">
                      You must be logged in as a dealer to place bids
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Starting Bid:</span>
                    <span className="text-white font-semibold">
                      £{parseFloat(currentVehicle.startingBid?.toString() || '0').toLocaleString()}
                    </span>
                  </div>
                  {currentVehicle.reservePrice && (
                    <div className="flex justify-between text-white/60">
                      <span>Reserve Price:</span>
                      <span className="text-white font-semibold">
                        £{parseFloat(currentVehicle.reservePrice.toString()).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>Auction Ends:</span>
                    <span className="text-white font-semibold">
                      {currentVehicle.auctionEndDate && 
                        new Date(currentVehicle.auctionEndDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                  <span>Vehicle {currentIndex + 1} of {vehicles.length}</span>
                  <span>{timeLeft}s</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${((60 - timeLeft) / 60) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
