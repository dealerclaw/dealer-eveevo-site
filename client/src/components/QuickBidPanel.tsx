import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface QuickBidPanelProps {
  carId: number;
  currentBid: number;
}

export default function QuickBidPanel({ carId, currentBid }: QuickBidPanelProps) {
  const [bidAmount, setBidAmount] = useState("");
  const utils = trpc.useUtils();

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
      // Invalidate queries to refresh data
      utils.dealer.getMarketplaceVehicleDetails.invalidate({ carId });
      utils.auction.getActiveVehicles.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place bid");
    },
  });

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= currentBid) {
      toast.error(`Bid must be higher than £${currentBid.toLocaleString()}`);
      return;
    }

    placeBidMutation.mutate({
      carId,
      bidAmount: amount,
    });
  };

  const minBid = currentBid + 100;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
      <div className="text-center">
        <p className="text-xs text-red-700 mb-1">Current Bid</p>
        <p className="text-2xl font-bold text-red-900">£{currentBid.toLocaleString()}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quickBid" className="text-sm text-red-900">Your Bid Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
          <Input
            id="quickBid"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Min: £${minBid.toLocaleString()}`}
            className="pl-7"
            onKeyDown={(e) => e.key === 'Enter' && handlePlaceBid()}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum bid: £{minBid.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBidAmount((currentBid + 500).toString())}
          className="text-xs"
        >
          +£500
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBidAmount((currentBid + 1000).toString())}
          className="text-xs"
        >
          +£1K
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBidAmount((currentBid + 2000).toString())}
          className="text-xs"
        >
          +£2K
        </Button>
      </div>

      <Button
        className="w-full bg-red-600 hover:bg-red-700"
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
    </div>
  );
}
