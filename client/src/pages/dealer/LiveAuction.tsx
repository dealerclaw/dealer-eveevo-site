import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Gavel, Clock, TrendingUp, Home, ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { BidHistoryTimeline } from "@/components/BidHistoryTimeline";

export default function LiveAuction() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per vehicle

  const { data: vehicles, isLoading, refetch } = trpc.auction.getActiveVehicles.useQuery();
  const { data: subscriptionStatus } = trpc.dealer.getSubscriptionStatus.useQuery(undefined, {
    enabled: !!user,
  });
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

  const buyNowMutation = trpc.auction.buyNow.useMutation({
    onSuccess: () => {
      toast.success("Vehicle purchased successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to purchase vehicle");
    },
  });

  const addToCartMutation = trpc.dealer.addToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const addToWatchlistMutation = trpc.dealer.addToWatchlist.useMutation({
    onSuccess: () => {
      toast.success("Added to watchlist!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to watchlist");
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
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [vehicles]);

  const handlePrevious = () => {
    if (!vehicles) return;
    setCurrentIndex((current) => (current - 1 + vehicles.length) % vehicles.length);
    setTimeLeft(30);
  };

  const handleNext = () => {
    if (!vehicles) return;
    setCurrentIndex((current) => (current + 1) % vehicles.length);
    setTimeLeft(30);
  };

  const handlePlaceBid = () => {
    if (!user) {
      toast.error("Please log in to place bids");
      window.location.href = getLoginUrl();
      return;
    }

    // Check if dealer has active subscription
    if (!subscriptionStatus || subscriptionStatus.status !== 'active') {
      toast.error("Active subscription required to place bids");
      setLocation("/dealer/subscription");
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

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please log in to purchase");
      window.location.href = getLoginUrl();
      return;
    }

    const currentVehicle = vehicles?.[currentIndex];
    if (!currentVehicle) return;

    if (!currentVehicle.buyNowPrice) {
      toast.error("Buy Now is not available for this vehicle");
      return;
    }

    const buyNowPrice = parseFloat(currentVehicle.buyNowPrice.toString());
    if (window.confirm(`Purchase this vehicle now for £${buyNowPrice.toLocaleString()}?`)) {
      buyNowMutation.mutate({ carId: currentVehicle.id });
    }
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dealer/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="h-8 w-px bg-white/20" />
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
              <div className="relative h-96 bg-gradient-to-br from-slate-800 to-slate-900">
                {currentVehicle.mainImage ? (
                  <img
                    src={currentVehicle.mainImage}
                    alt={`${currentVehicle.make} ${currentVehicle.model}`}
                    className="w-full h-full object-contain"
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

                {/* Profit Calculator */}
                <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Profit Calculator
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-white/60">Retail Price</p>
                        <p className="text-xl font-bold text-white">£{currentVehicle.price ? parseFloat(currentVehicle.price).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Dealer Price</p>
                        <p className="text-xl font-bold text-green-400">£{currentVehicle.dealerBidPrice ? parseFloat(currentVehicle.dealerBidPrice).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-white/60">Gross Profit</p>
                        <p className="text-lg font-bold text-green-400">
                          £{currentVehicle.price && currentVehicle.dealerBidPrice 
                            ? (parseFloat(currentVehicle.price) - parseFloat(currentVehicle.dealerBidPrice)).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-white/60">Profit Margin</p>
                        <p className="text-lg font-bold text-green-400">
                          {currentVehicle.price && currentVehicle.dealerBidPrice
                            ? `${(((parseFloat(currentVehicle.price) - parseFloat(currentVehicle.dealerBidPrice)) / parseFloat(currentVehicle.price)) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <label className="text-sm text-white/60 block mb-2">Est. Reconditioning Costs</label>
                      <input
                        type="number"
                        placeholder="Enter costs..."
                        className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white placeholder:text-white/40"
                        onChange={(e) => {
                          const costs = parseFloat(e.target.value) || 0;
                          const gross = currentVehicle.price && currentVehicle.dealerBidPrice
                            ? parseFloat(currentVehicle.price) - parseFloat(currentVehicle.dealerBidPrice)
                            : 0;
                          const net = gross - costs;
                          const netElement = document.getElementById('net-profit');
                          const roiElement = document.getElementById('roi-percentage');
                          if (netElement) netElement.textContent = `£${net.toLocaleString()}`;
                          if (roiElement && currentVehicle.dealerBidPrice) {
                            const roi = (net / parseFloat(currentVehicle.dealerBidPrice)) * 100;
                            roiElement.textContent = `${roi.toFixed(1)}%`;
                          }
                        }}
                      />
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-white/60">Net Profit</p>
                        <p id="net-profit" className="text-xl font-bold text-green-400">
                          £{currentVehicle.price && currentVehicle.dealerBidPrice 
                            ? (parseFloat(currentVehicle.price) - parseFloat(currentVehicle.dealerBidPrice)).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-white/60">ROI</p>
                        <p id="roi-percentage" className="text-xl font-bold text-green-400">
                          {currentVehicle.price && currentVehicle.dealerBidPrice
                            ? `${(((parseFloat(currentVehicle.price) - parseFloat(currentVehicle.dealerBidPrice)) / parseFloat(currentVehicle.dealerBidPrice)) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
                    
                    {/* Quick Bid Increment Buttons */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={() => setBidAmount((currentBid + 500).toString())}
                      >
                        +£500
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={() => setBidAmount((currentBid + 1000).toString())}
                      >
                        +£1,000
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={() => setBidAmount((currentBid + 2000).toString())}
                      >
                        +£2,000
                      </Button>
                    </div>
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

                  {currentVehicle.dealerBidPrice && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/40 px-2 text-white/60">or</span>
                      </div>
                    </div>
                  )}

                  {currentVehicle.dealerBidPrice && (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full bg-green-600 hover:bg-green-700 text-white border-0"
                      onClick={handleBuyNow}
                      disabled={buyNowMutation.isPending}
                    >
                      {buyNowMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Gavel className="w-4 h-4 mr-2" />
                          Buy Now - £{parseFloat(currentVehicle.dealerBidPrice).toLocaleString()}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Cart and Watchlist buttons */}
                  {user && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          if (!currentVehicle.dealerBidPrice) {
                            toast.error("Price not available");
                            return;
                          }
                          addToCartMutation.mutate({
                            carId: currentVehicle.id,
                            priceAtAdd: currentVehicle.dealerBidPrice,
                          });
                        }}
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          if (!currentVehicle.dealerBidPrice) {
                            toast.error("Price not available");
                            return;
                          }
                          addToWatchlistMutation.mutate({
                            carId: currentVehicle.id,
                            initialPrice: currentVehicle.dealerBidPrice,
                          });
                        }}
                        disabled={addToWatchlistMutation.isPending}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Watchlist
                      </Button>
                    </div>
                  )}

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
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/60">
                        <span>Reserve Price:</span>
                        <span className="text-white font-semibold">
                          £{parseFloat(currentVehicle.reservePrice.toString()).toLocaleString()}
                        </span>
                      </div>
                      {(() => {
                        const reservePrice = parseFloat(currentVehicle.reservePrice.toString());
                        const reserveMet = currentBid >= reservePrice;
                        return (
                          <div className={`text-xs px-2 py-1 rounded ${reserveMet ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {reserveMet ? '✓ Reserve Met' : '⚠ Reserve Not Met'}
                          </div>
                        );
                      })()}
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

            {/* Bid History Timeline */}
            <BidHistoryTimeline carId={currentVehicle.id} />

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
                    style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
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
