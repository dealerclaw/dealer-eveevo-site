/**
 * ContactDealerDialog
 * A modal dialog that allows a buying dealer to send an enquiry about a
 * marketplace listing. Supports an optional offer price field.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Loader2, PoundSterling } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactDealerDialogProps {
  carId: number;
  carName: string;
  askingPrice?: number;
  sellerName?: string;
  /** If provided, renders as a child trigger instead of the default button */
  trigger?: React.ReactNode;
}

export default function ContactDealerDialog({
  carId,
  carName,
  askingPrice,
  sellerName,
  trigger,
}: ContactDealerDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  const sendMutation = trpc.enquiries.send.useMutation({
    onSuccess: () => {
      toast.success("Enquiry sent! The seller will be notified.");
      setOpen(false);
      setMessage("");
      setOfferPrice("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send enquiry. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Please write a message of at least 10 characters.");
      return;
    }
    sendMutation.mutate({
      carId,
      message: message.trim(),
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full" size="lg">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Dealer
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Dealer</DialogTitle>
          <DialogDescription>
            Send an enquiry about the{" "}
            <span className="font-medium text-foreground">{carName}</span>
            {sellerName && (
              <>
                {" "}
                listed by{" "}
                <span className="font-medium text-foreground">{sellerName}</span>
              </>
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="enquiry-message">Your Message *</Label>
            <Textarea
              id="enquiry-message"
              placeholder="Hi, I'm interested in this vehicle. Could you provide more details about its condition, service history, and availability for a viewing?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters (minimum 10)
            </p>
          </div>

          {/* Optional offer price */}
          <div className="space-y-2">
            <Label htmlFor="offer-price">
              Offer Price{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="offer-price"
                type="number"
                placeholder={
                  askingPrice
                    ? `Asking price: £${askingPrice.toLocaleString()}`
                    : "Enter your offer"
                }
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                min={0}
                step={100}
                className="pl-9"
              />
            </div>
            {askingPrice && offerPrice && parseFloat(offerPrice) < askingPrice && (
              <p className="text-xs text-amber-600">
                Your offer is below the asking price of £{askingPrice.toLocaleString()}.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Enquiry
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
