import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MakeOfferDialogProps {
  carId: number;
  carName: string;
  askingPrice: number;
  sellerId: number;
}

export default function MakeOfferDialog({ carId, carName, askingPrice, sellerId }: MakeOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");

  const utils = trpc.useUtils();

  const makeOfferMutation = trpc.dealer.makeOffer.useMutation({
    onSuccess: () => {
      toast.success("Offer sent successfully!");
      setOpen(false);
      setOfferAmount("");
      setMessage("");
      utils.dealer.getMyOffers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send offer");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid offer amount");
      return;
    }

    if (amount >= askingPrice) {
      toast.error("Offer must be below asking price. Use Buy Now for full price.");
      return;
    }

    makeOfferMutation.mutate({
      carId,
      toDealerId: sellerId,
      offerAmount: amount,
      message: message.trim() || undefined,
    });
  };

  const suggestedOffers = [
    { label: "5% below", amount: askingPrice * 0.95 },
    { label: "10% below", amount: askingPrice * 0.90 },
    { label: "15% below", amount: askingPrice * 0.85 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquare className="w-4 h-4 mr-2" />
          Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              {carName} - Asking £{askingPrice.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Suggested offers */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2">Quick offers</Label>
              <div className="flex gap-2">
                {suggestedOffers.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOfferAmount(suggestion.amount.toFixed(0))}
                    className="flex-1"
                  >
                    {suggestion.label}
                    <br />
                    £{suggestion.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Button>
                ))}
              </div>
            </div>

            {/* Offer amount */}
            <div className="space-y-2">
              <Label htmlFor="offerAmount">Your Offer (£) *</Label>
              <Input
                id="offerAmount"
                type="number"
                placeholder="25000"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                required
                min="1"
                max={askingPrice - 1}
              />
              {offerAmount && parseFloat(offerAmount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {((1 - parseFloat(offerAmount) / askingPrice) * 100).toFixed(1)}% below asking price
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Explain why you're making this offer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Explain your reasoning to increase acceptance chances
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={makeOfferMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={makeOfferMutation.isPending}>
              {makeOfferMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Offer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
