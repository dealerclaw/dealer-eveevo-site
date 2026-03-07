import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowRightLeft, Info, Gavel, AlertTriangle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DealerLayout from "@/components/DealerLayout";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Days on Market badge component
function DaysOnMarketBadge({ createdAt }: { createdAt: Date | string }) {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days > 45) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <AlertTriangle className="h-3 w-3" />
          {days}d
        </Badge>
        <span className="text-[10px] text-purple-600 font-medium leading-tight">Slow mover</span>
      </div>
    );
  }
  if (days > 30) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
        <Clock className="h-3 w-3" />
        {days}d
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
      <Clock className="h-3 w-3" />
      {days}d
    </Badge>
  );
}

// Auction Badge Component with countdown timer
const AuctionBadge = ({ endDate }: { endDate: Date | string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <Badge variant="destructive" className="text-xs">
      <Gavel className="h-3 w-3 mr-1" />
      Auction: {timeLeft}
    </Badge>
  );
};

export default function MyInventory() {
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewingCar, setViewingCar] = useState<any | null>(null);
  const [auctionCarId, setAuctionCarId] = useState<number | null>(null);
  const [reservePrice, setReservePrice] = useState<string>("");
  const [startingBid, setStartingBid] = useState<string>("");
  const [marketplaceCarId, setMarketplaceCarId] = useState<number | null>(null);
  const [marketplacePrice, setMarketplacePrice] = useState<string>("");
  const [cancelAuctionId, setCancelAuctionId] = useState<number | null>(null);
  
  const { data: inventory, isLoading, refetch } = trpc.dealer.getMyInventory.useQuery();
  
  const deleteMutation = trpc.dealer.deleteVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  const updateMutation = trpc.dealer.updateVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });

  const moveToMarketplaceMutation = trpc.dealer.moveToMarketplace.useMutation({
    onSuccess: () => {
      toast.success("Vehicle moved successfully");
      refetch();
      setMarketplaceCarId(null);
      setMarketplacePrice("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move vehicle");
    },
  });

  const sendToAuctionMutation = trpc.dealer.sendToAuction.useMutation({
    onSuccess: () => {
      toast.success("Vehicle sent to auction successfully");
      refetch();
      setAuctionCarId(null);
      setReservePrice("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send to auction");
    },
  });

  const cancelAuctionMutation = trpc.dealer.cancelAuction.useMutation({
    onSuccess: () => {
      toast.success("Auction cancelled successfully. All bidders have been notified and refunded.");
      refetch();
      setCancelAuctionId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel auction");
    },
  });

  const handleMoveToMarketplace = (carId: number, currentMarketplace: string) => {
    const newMarketplace = currentMarketplace === 'consumer' ? 'dealer_only' : 'consumer';
    // If moving to dealer marketplace, ask for minimum price
    if (newMarketplace === 'dealer_only') {
      setMarketplaceCarId(carId);
      return;
    }
    // Moving back to consumer, no price needed
    moveToMarketplaceMutation.mutate({
      carId,
      marketplace: newMarketplace,
    });
  };

  const handleSendToAuction = (carId: number) => {
    setAuctionCarId(carId);
  };

  const confirmSendToAuction = () => {
    if (!startingBid || parseFloat(startingBid) <= 0) {
      toast.error("Please enter a valid starting bid");
      return;
    }
    if (!reservePrice || parseFloat(reservePrice) <= 0) {
      toast.error("Please enter a valid reserve price");
      return;
    }
    if (parseFloat(startingBid) > parseFloat(reservePrice)) {
      toast.error("Starting bid cannot be higher than reserve price");
      return;
    }
    sendToAuctionMutation.mutate({
      carId: auctionCarId!,
      reservePrice: parseFloat(reservePrice),
      startingBid: parseFloat(startingBid),
    });
  };

  const confirmMoveToMarketplace = () => {
    if (!marketplacePrice || parseFloat(marketplacePrice) <= 0) {
      toast.error("Please enter a valid minimum price");
      return;
    }
    moveToMarketplaceMutation.mutate({
      carId: marketplaceCarId!,
      marketplace: 'dealer_only',
      minimumPrice: parseFloat(marketplacePrice),
    });
  };

  const handleToggleAvailability = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isAvailable: !currentStatus,
    });
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Inventory</h1>
            <p className="text-muted-foreground">Manage your vehicle listings</p>
          </div>
          <Link href="/dealer/add-vehicle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Listings</CardTitle>
            <CardDescription>
              {inventory?.length || 0} total vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inventory && inventory.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16"></TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Days Listed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((vehicle: any) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="w-16 pr-0">
                        {vehicle.mainImage ? (
                          <img
                            src={vehicle.mainImage}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-14 h-10 object-cover rounded-md border bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-md border bg-muted flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>{vehicle.year || "N/A"}</TableCell>
                      <TableCell>
                        {vehicle.price
                          ? `£${parseFloat(vehicle.price).toLocaleString()}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {vehicle.mileage
                          ? `${vehicle.mileage.toLocaleString()} mi`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {vehicle.realRange ? `${vehicle.realRange} mi` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {vehicle.createdAt ? (
                          <DaysOnMarketBadge createdAt={vehicle.createdAt} />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isAvailable ? "default" : "secondary"}>
                          {vehicle.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={vehicle.marketplace === 'consumer' ? "outline" : "default"}>
                            {vehicle.marketplace === 'consumer' ? "Consumer" : "Dealer Only"}
                          </Badge>
                          {vehicle.isAuction && vehicle.auctionEndDate && (
                            <AuctionBadge endDate={vehicle.auctionEndDate} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingCar(vehicle)}
                            title="View Details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {!vehicle.isAuction ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendToAuction(vehicle.id)}
                              title="Send to Auction"
                            >
                              <Gavel className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCancelAuctionId(vehicle.id)}
                              title="Cancel Auction"
                              className="text-destructive"
                            >
                              <Gavel className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveToMarketplace(vehicle.id, vehicle.marketplace || 'consumer')}
                            title={vehicle.marketplace === 'consumer' ? "Move to Dealer Marketplace" : "Move to Consumer Marketplace"}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAvailability(vehicle.id, vehicle.isAvailable)}
                            title={vehicle.isAvailable ? "Mark as unavailable" : "Mark as available"}
                          >
                            {vehicle.isAvailable ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/dealer/edit-vehicle/${vehicle.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No vehicles in your inventory yet</p>
                <Link href="/dealer/add-vehicle">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Vehicle
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <AlertDialog open={viewingCar !== null} onOpenChange={() => setViewingCar(null)}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {viewingCar?.make} {viewingCar?.model} ({viewingCar?.year})
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vehicle Details
            </AlertDialogDescription>
          </AlertDialogHeader>
          {viewingCar && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Make:</span> {viewingCar.make}</div>
                  <div><span className="font-medium">Model:</span> {viewingCar.model}</div>
                  <div><span className="font-medium">Year:</span> {viewingCar.year || 'N/A'}</div>
                  <div><span className="font-medium">Condition:</span> {viewingCar.condition || 'N/A'}</div>
                  <div><span className="font-medium">Color:</span> {viewingCar.color || 'N/A'}</div>
                  <div><span className="font-medium">VIN:</span> {viewingCar.vin || 'N/A'}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Pricing & Availability</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Price:</span> {viewingCar.price ? `£${parseFloat(viewingCar.price).toLocaleString()}` : 'N/A'}</div>
                  <div><span className="font-medium">Status:</span> <Badge variant={viewingCar.isAvailable ? "default" : "secondary"}>{viewingCar.isAvailable ? "Available" : "Unavailable"}</Badge></div>
                  <div><span className="font-medium">Marketplace:</span> <Badge variant={viewingCar.marketplace === 'consumer' ? "outline" : "default"}>{viewingCar.marketplace === 'consumer' ? "Consumer" : "Dealer Only"}</Badge></div>
                  <div><span className="font-medium">Featured:</span> {viewingCar.isFeatured ? 'Yes' : 'No'}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Performance & Specs</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Mileage:</span> {viewingCar.mileage ? `${viewingCar.mileage.toLocaleString()} mi` : 'N/A'}</div>
                  <div><span className="font-medium">Battery:</span> {viewingCar.batteryCapacity ? `${viewingCar.batteryCapacity} kWh` : 'N/A'}</div>
                  <div><span className="font-medium">Real Range:</span> {viewingCar.realRange ? `${viewingCar.realRange} mi` : 'N/A'}</div>
                  <div><span className="font-medium">WLTP Range:</span> {viewingCar.wltpRange ? `${viewingCar.wltpRange} mi` : 'N/A'}</div>
                  <div><span className="font-medium">Charge Speed:</span> {viewingCar.chargeSpeed || 'N/A'}</div>
                  <div><span className="font-medium">Acceleration:</span> {viewingCar.acceleration ? `${viewingCar.acceleration}s (0-60mph)` : 'N/A'}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Seats:</span> {viewingCar.seats || 'N/A'}</div>
                  <div><span className="font-medium">Doors:</span> {viewingCar.doors || 'N/A'}</div>
                  <div><span className="font-medium">Body Type:</span> {viewingCar.bodyType || 'N/A'}</div>
                  <div><span className="font-medium">Transmission:</span> {viewingCar.transmission || 'N/A'}</div>
                  <div><span className="font-medium">Drive:</span> {viewingCar.drive || 'N/A'}</div>
                </div>
              </div>
              {viewingCar.description && (
                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{viewingCar.description}</p>
                </div>
              )}
              {viewingCar.images && viewingCar.images.length > 0 && (
                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">Images</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {viewingCar.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={`${viewingCar.make} ${viewingCar.model}`} className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setViewingCar(null);
              navigate(`/dealer/edit-vehicle/${viewingCar?.id}`);
            }}>
              Edit Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to Auction Dialog */}
      <Dialog open={auctionCarId !== null} onOpenChange={() => {
        setAuctionCarId(null);
        setReservePrice("");
        setStartingBid("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Auction</DialogTitle>
            <DialogDescription>
              Set a reserve price (minimum acceptable price) for this 48-hour auction.
              The vehicle will be listed in the dealer-only marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="startingBid">Starting Bid (£)</Label>
              <Input
                id="startingBid"
                type="number"
                placeholder="Enter starting bid amount"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                min="0"
                step="100"
              />
              <p className="text-sm text-muted-foreground">
                The minimum first bid amount. Dealers must bid at or above this amount.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price (£)</Label>
              <Input
                id="reservePrice"
                type="number"
                placeholder="Enter minimum acceptable price"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                min="0"
                step="100"
              />
              <p className="text-sm text-muted-foreground">
                Auction will run for 48 hours. The car will only sell if the winning bid meets or exceeds your reserve price.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAuctionCarId(null);
              setReservePrice("");
              setStartingBid("");
            }}>
              Cancel
            </Button>
            <Button onClick={confirmSendToAuction}>
              Send to Auction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Dealer Marketplace Dialog */}
      <Dialog open={marketplaceCarId !== null} onOpenChange={() => {
        setMarketplaceCarId(null);
        setMarketplacePrice("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Dealer Marketplace</DialogTitle>
            <DialogDescription>
              Set a minimum price for this vehicle in the dealer-only marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marketplacePrice">Minimum Price (£)</Label>
              <Input
                id="marketplacePrice"
                type="number"
                placeholder="Enter minimum price"
                value={marketplacePrice}
                onChange={(e) => setMarketplacePrice(e.target.value)}
                min="0"
                step="100"
              />
              <p className="text-sm text-muted-foreground">
                This is the minimum price other dealers must pay to purchase this vehicle.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMarketplaceCarId(null);
              setMarketplacePrice("");
            }}>
              Cancel
            </Button>
            <Button onClick={confirmMoveToMarketplace}>
              Move to Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Auction Confirmation Dialog */}
      <AlertDialog open={cancelAuctionId !== null} onOpenChange={() => setCancelAuctionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Auction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end the auction for this vehicle. All bidders will be notified and their £99 commitment fees will be automatically refunded. This action cannot be undone.
              <br /><br />
              <strong>Consequences:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All active bids will be cancelled</li>
                <li>Bidders will receive email notifications</li>
                <li>Commitment fees will be refunded within 5-7 business days</li>
                <li>Vehicle will return to your regular inventory</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Auction Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAuctionId && cancelAuctionMutation.mutate({ carId: cancelAuctionId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Auction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealerLayout>
  );
}
