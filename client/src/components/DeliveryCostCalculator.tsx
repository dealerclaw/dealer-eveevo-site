import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Loader2, MapPin, Calculator } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DeliveryCostCalculatorProps {
  carId: number;
  sellerPostcode: string;
}

export default function DeliveryCostCalculator({ carId, sellerPostcode }: DeliveryCostCalculatorProps) {
  const [buyerPostcode, setBuyerPostcode] = useState("");
  const [quote, setQuote] = useState<{
    distance: number;
    cost: number;
    estimatedDays: number;
  } | null>(null);

  const calculateMutation = trpc.dealer.calculateDeliveryCost.useMutation({
    onSuccess: (data) => {
      setQuote(data);
      toast.success("Delivery quote calculated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to calculate delivery cost");
    },
  });

  const bookDeliveryMutation = trpc.dealer.bookDelivery.useMutation({
    onSuccess: () => {
      toast.success("Delivery booked! You'll receive confirmation via email.");
      setQuote(null);
      setBuyerPostcode("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to book delivery");
    },
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!buyerPostcode.trim()) {
      toast.error("Please enter your postcode");
      return;
    }

    calculateMutation.mutate({
      carId,
      fromPostcode: sellerPostcode,
      toPostcode: buyerPostcode.trim().toUpperCase(),
    });
  };

  const handleBookDelivery = () => {
    if (!quote) return;

    bookDeliveryMutation.mutate({
      carId,
      fromPostcode: sellerPostcode,
      toPostcode: buyerPostcode.trim().toUpperCase(),
      cost: quote.cost,
      distance: quote.distance,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Delivery Cost Calculator
        </CardTitle>
        <CardDescription>
          Get instant transport quotes from approved hauliers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>From: <strong>{sellerPostcode}</strong></span>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerPostcode">Your Postcode *</Label>
            <div className="flex gap-2">
              <Input
                id="buyerPostcode"
                placeholder="SW1A 1AA"
                value={buyerPostcode}
                onChange={(e) => setBuyerPostcode(e.target.value.toUpperCase())}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={calculateMutation.isPending}
              >
                {calculateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {quote && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distance</span>
              <Badge variant="outline">{quote.distance} miles</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Delivery</span>
              <Badge variant="outline">{quote.estimatedDays} days</Badge>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Delivery Cost</span>
              <span className="text-2xl font-bold text-primary">
                £{quote.cost.toLocaleString()}
              </span>
            </div>
            
            <Button
              className="w-full"
              onClick={handleBookDelivery}
              disabled={bookDeliveryMutation.isPending}
            >
              {bookDeliveryMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Book Delivery
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Approved hauliers with insurance coverage up to £50,000
            </p>
          </div>
        )}

        {!quote && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Professional vehicle transport</p>
            <p>• Fully insured up to £50,000</p>
            <p>• Door-to-door service</p>
            <p>• Typical delivery: 2-5 business days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
