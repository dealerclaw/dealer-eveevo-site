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
import { Gavel, Clock, TrendingUp, Eye } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Countdown timer component
const AuctionCountdown = ({ endDate }: { endDate: Date | string }) => {
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
    <div className="flex items-center gap-1 text-sm">
      <Clock className="h-4 w-4" />
      {timeLeft}
    </div>
  );
};

export default function MyAuctions() {
  const [viewingBids, setViewingBids] = useState<any | null>(null);
  
  const { data: myAuctions, isLoading, refetch } = trpc.dealer.getMyAuctions.useQuery();
  const { data: auctionStats } = trpc.dealer.getAuctionStats.useQuery();
  const { data: bidHistory } = trpc.dealer.getAuctionBids.useQuery(
    { carId: viewingBids?.id },
    { enabled: !!viewingBids }
  );

  const cancelAuctionMutation = trpc.dealer.cancelAuction.useMutation({
    onSuccess: () => {
      toast.success("Auction cancelled successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel auction");
    },
  });

  const handleCancelAuction = (carId: number) => {
    if (confirm("Are you sure you want to cancel this auction?")) {
      cancelAuctionMutation.mutate({ carId });
    }
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
        <div>
          <h1 className="text-3xl font-bold">My Auctions</h1>
          <p className="text-muted-foreground">Manage your auction listings and track bids</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctionStats?.activeAuctions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently live
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids Received</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctionStats?.totalBids || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all auctions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Winning Bid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auctionStats?.avgWinningBid 
                  ? `£${parseFloat(auctionStats.avgWinningBid).toLocaleString()}`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                From completed auctions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Auctions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Auctions</CardTitle>
            <CardDescription>
              {myAuctions?.length || 0} vehicles currently in auction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myAuctions && myAuctions.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Reserve Price</TableHead>
                    <TableHead>Buy It Now</TableHead>
                    <TableHead>Current Bid</TableHead>
                    <TableHead>Total Bids</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAuctions.map((auction: any) => (
                    <TableRow key={auction.id}>
                      <TableCell className="font-medium">
                        {auction.make} {auction.model} ({auction.year})
                      </TableCell>
                      <TableCell>
                        £{parseFloat(auction.reservePrice || "0").toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {auction.buyNowPrice && parseFloat(auction.buyNowPrice) > 0 ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                            <span className="text-xs">BIN</span>
                            £{parseFloat(auction.buyNowPrice).toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {auction.currentHighestBid ? (
                          <span className="font-semibold text-green-600">
                            £{parseFloat(auction.currentHighestBid).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No bids yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{auction.bidCount || 0} bids</Badge>
                      </TableCell>
                      <TableCell>
                        {auction.auctionEndDate && (
                          <AuctionCountdown endDate={auction.auctionEndDate} />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {auction.currentHighestBid && 
                           parseFloat(auction.currentHighestBid) >= parseFloat(auction.reservePrice || "0") ? (
                            <Badge variant="default">Reserve Met</Badge>
                          ) : (
                            <Badge variant="secondary">Below Reserve</Badge>
                          )}
                          {auction.buyNowPrice && parseFloat(auction.buyNowPrice) > 0 && (
                            <Badge className="bg-green-600/20 text-green-700 border border-green-600/30 text-xs">Buy Now Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingBids(auction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Bids
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelAuction(auction.id)}
                            className="text-destructive"
                          >
                            Cancel
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
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No active auctions</p>
                <p className="text-sm text-muted-foreground">
                  Send vehicles to auction from your inventory to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bid History Dialog */}
      <Dialog open={viewingBids !== null} onOpenChange={() => setViewingBids(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bid History: {viewingBids?.make} {viewingBids?.model}
            </DialogTitle>
            <DialogDescription>
              All bids placed on this auction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bidHistory && bidHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidHistory.map((bid: any) => (
                    <TableRow key={bid.id}>
                      <TableCell className="font-medium">{bid.dealerName}</TableCell>
                      <TableCell className="font-semibold">
                        £{parseFloat(bid.bidAmount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(bid.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bid.status === 'winning' ? 'default' : 'secondary'}>
                          {bid.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bids placed yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DealerLayout>
  );
}
