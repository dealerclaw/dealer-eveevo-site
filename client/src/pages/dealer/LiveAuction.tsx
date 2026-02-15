import { useState, useEffect, useMemo } from "react";
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
  // Temp filter state (not applied until Apply clicked)
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [tempSelectedMake, setTempSelectedMake] = useState("");
  const [tempSelectedCondition, setTempSelectedCondition] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [tempMaxMileage, setTempMaxMileage] = useState("");
  
  // Applied filters (actually used for filtering)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Apply filters function
  const applyFilters = () => {
    setSearchQuery(tempSearchQuery);
    setSelectedMake(tempSelectedMake);
    setSelectedCondition(tempSelectedCondition);
    setMaxPrice(tempMaxPrice);
    setMaxMileage(tempMaxMileage);
    setCurrentIndex(0); // Reset to first vehicle
    toast.success("Filters applied!");
  };
  
  // Clear filters function
  const clearFilters = () => {
    setTempSearchQuery("");
    setTempSelectedMake("");
    setTempSelectedCondition("");
    setTempMaxPrice("");
    setTempMaxMileage("");
    setSearchQuery("");
    setSelectedMake("");
    setSelectedCondition("");
    setMaxPrice("");
    setMaxMileage("");
    setCurrentIndex(0);
    toast.success("Filters cleared!");
  };

  const { data: vehicles, isLoading, refetch } = trpc.auction.getActiveVehicles.useQuery();
  const { data: subscriptionStatus } = trpc.dealer.getSubscriptionStatus.useQuery(undefined, {
    enabled: !!user,
  });
  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: (data) => {
      if (data.extended) {
        toast.success("Bid placed successfully! ⏰ Auction extended by 5 minutes", {
          duration: 5000,
        });
      } else {
        toast.success("Bid placed successfully!");
      }
      setBidAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place bid");
    },
  });

  const buyNowMutation = trpc.auction.buyNow.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
        window.open(data.checkoutUrl, '_blank');
        refetch();
      } else {
        toast.success("Vehicle purchased successfully!");
        refetch();
      }
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

  // Filter vehicles based on search and filter criteria
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter(vehicle => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          vehicle.make?.toLowerCase().includes(query) ||
          vehicle.model?.toLowerCase().includes(query) ||
          vehicle.year?.toString().includes(query) ||
          vehicle.dealerName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Make filter
      if (selectedMake && vehicle.make !== selectedMake) return false;
      
      // Condition filter
      if (selectedCondition && vehicle.condition !== selectedCondition) return false;
      
      // Price filter
      if (maxPrice) {
        const currentBid = vehicle.currentHighestBid 
          ? parseFloat(vehicle.currentHighestBid.toString())
          : parseFloat(vehicle.startingBid?.toString() || '0');
        if (currentBid > parseFloat(maxPrice)) return false;
      }
      
      // Mileage filter
      if (maxMileage && vehicle.mileage && vehicle.mileage > parseInt(maxMileage)) return false;
      
      return true;
    });
  }, [vehicles, searchQuery, selectedMake, selectedCondition, maxPrice, maxMileage]);

  // Get unique makes for filter dropdown
  const uniqueMakes = useMemo(() => {
    if (!vehicles) return [];
    const makes = vehicles.map(v => v.make).filter(Boolean);
    return Array.from(new Set(makes)).sort();
  }, [vehicles]);

  // Auto-rotate carousel every 30 seconds
  useEffect(() => {
    if (!filteredVehicles || filteredVehicles.length === 0 || !autoRotate) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next vehicle
          setCurrentIndex((current) => (current + 1) % filteredVehicles.length);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [filteredVehicles, autoRotate]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setTimeLeft(30);
  }, [searchQuery, selectedMake, selectedCondition, maxPrice, maxMileage]);

  const handlePrevious = () => {
    if (!filteredVehicles || filteredVehicles.length === 0) return;
    setCurrentIndex((current) => (current - 1 + filteredVehicles.length) % filteredVehicles.length);
    setTimeLeft(30);
  };

  const handleNext = () => {
    if (!filteredVehicles || filteredVehicles.length === 0) return;
    setCurrentIndex((current) => (current + 1) % filteredVehicles.length);
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

    const currentVehicle = filteredVehicles?.[currentIndex];
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

    const currentVehicle = filteredVehicles?.[currentIndex];
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRotate(!autoRotate)}
              className="text-white border-white/20 hover:bg-white/10"
            >
              {autoRotate ? 'Pause' : 'Play'} Auto-Rotate
            </Button>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {autoRotate ? `Next in ${timeLeft}s` : 'Paused'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="container py-4 space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search by make, model, year, or dealer..."
              value={tempSearchQuery}
              onChange={(e) => setTempSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-white border-white/20 hover:bg-white/10"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Button
              onClick={applyFilters}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Apply Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-white/80 text-sm">Make</Label>
                <select
                  value={tempSelectedMake}
                  onChange={(e) => setTempSelectedMake(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                >
                  <option value="">All Makes</option>
                  {uniqueMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-white/80 text-sm">Condition</Label>
                <select
                  value={tempSelectedCondition}
                  onChange={(e) => setTempSelectedCondition(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                >
                  <option value="">All Conditions</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Certified Pre-Owned">Certified Pre-Owned</option>
                </select>
              </div>
              <div>
                <Label className="text-white/80 text-sm">Max Price (£)</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Max Mileage</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={tempMaxMileage}
                  onChange={(e) => setTempMaxMileage(e.target.value)}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Showing {currentIndex + 1} of {filteredVehicles.length} vehicles</span>
            {(searchQuery || selectedMake || selectedCondition || maxPrice || maxMileage) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Clear all filters
              </Button>
            )}
          </div>
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
                  <div className="flex items-center justify-between">
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
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setLocation(`/dealer/marketplace/${currentVehicle.id}`)}
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      View Full Details
                    </Button>
                  </div>

                  {/* Dealer Information */}
                  {currentVehicle.dealerName && (
                    <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/50 mb-1">Sold by</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-white">{currentVehicle.dealerName}</p>
                            {currentVehicle.dealerVerified && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {currentVehicle.dealerCity && (
                            <p className="text-sm text-white/60 mt-1">{currentVehicle.dealerCity}</p>
                          )}
                        </div>
                        {currentVehicle.dealerId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/dealers/${currentVehicle.dealerId}`)}
                            className="text-white border-white/20 hover:bg-white/10"
                          >
                            View Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
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

                {/* Trade Details & Condition Notes */}
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">Trade Details</h3>
                  
                  {/* Condition Notes */}
                  {currentVehicle.conditionNotes && (
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-2">Condition Notes</p>
                      <p className="text-sm text-white/70 whitespace-pre-wrap bg-black/20 p-3 rounded border border-white/10">
                        {currentVehicle.conditionNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Service History */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-1">Service History</p>
                      <p className="text-sm text-green-400">✓ Full service history available</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-1">VAT Status</p>
                      <p className="text-sm text-white/70">VAT Qualifying</p>
                    </div>
                  </div>
                  
                  {/* Inspection Reports */}
                  {currentVehicle.inspectionReports && currentVehicle.inspectionReports.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-2">Inspection Reports</p>
                      <div className="space-y-2">
                        {currentVehicle.inspectionReports.map((report: any, index: number) => (
                          <a
                            key={index}
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 underline"
                          >
                            📄 {report.name || `Report ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
                        <p className="text-sm text-white/60">Current Bid</p>
                        <p className="text-xl font-bold text-green-400">£{currentVehicle.currentHighestBid ? parseFloat(currentVehicle.currentHighestBid.toString()).toLocaleString() : (currentVehicle.startingBid ? parseFloat(currentVehicle.startingBid.toString()).toLocaleString() : 'N/A')}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                           <div>
                        <p className="text-sm text-white/60">Reserve Price</p>
                        <p className="text-lg font-bold text-yellow-400">
                          £{currentVehicle.reservePrice 
                            ? parseFloat(currentVehicle.reservePrice.toString()).toLocaleString()
                            : 'Not Set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Time Remaining</p>
                        <p className="text-lg font-bold text-blue-400">
                          {currentVehicle.auctionEndDate
                            ? `${Math.max(0, Math.floor((new Date(currentVehicle.auctionEndDate).getTime() - Date.now()) / (1000 * 60 * 60)))}h`
                            : 'N/A'}
                        </p>
                      </div>       </div>
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

                  {/* Proxy Bidding Option */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black/40 px-2 text-white/60">or</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      const maxBid = prompt(`Set your maximum bid amount. The system will automatically bid for you up to this amount.\n\nCurrent bid: £${currentBid.toLocaleString()}`);
                      if (maxBid) {
                        const amount = parseFloat(maxBid);
                        if (!isNaN(amount) && amount > currentBid) {
                          trpc.auction.setProxyBid.useMutation({
                            onSuccess: () => {
                              toast.success(`Proxy bid set! System will auto-bid up to £${amount.toLocaleString()}`);
                              refetch();
                            },
                            onError: (error: any) => {
                              toast.error(error.message || 'Failed to set proxy bid');
                            },
                          }).mutate({
                            carId: currentVehicle.id,
                            maxBidAmount: amount,
                          });
                        } else {
                          toast.error('Maximum bid must be higher than current bid');
                        }
                      }
                    }}
                  >
                    🤖 Set Proxy Bid (Auto-Bid)
                  </Button>

                  {currentVehicle.buyNowPrice && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/40 px-2 text-white/60">or</span>
                      </div>
                    </div>
                  )}

                  {currentVehicle.buyNowPrice && (
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
                          Buy Now - £{parseFloat(currentVehicle.buyNowPrice.toString()).toLocaleString()}
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
                          const price = currentVehicle.currentHighestBid || currentVehicle.startingBid || currentVehicle.price;
                          if (!price) {
                            toast.error("Price not available");
                            return;
                          }
                          addToCartMutation.mutate({
                            carId: currentVehicle.id,
                            priceAtAdd: price,
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
                          const price = currentVehicle.currentHighestBid || currentVehicle.startingBid || currentVehicle.price;
                          if (!price) {
                            toast.error("Price not available");
                            return;
                          }
                          addToWatchlistMutation.mutate({
                            carId: currentVehicle.id,
                            initialPrice: price,
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
