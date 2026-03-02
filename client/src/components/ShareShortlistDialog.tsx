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
import { Share2, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ShareShortlistDialogProps {
  shortlistIds: number[];
}

export default function ShareShortlistDialog({ shortlistIds }: ShareShortlistDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const shareShortlistMutation = trpc.auction.shareShortlist.useMutation({
    onSuccess: () => {
      toast.success("Shortlist shared successfully!");
      setOpen(false);
      setRecipientEmail("");
      setMessage("");
    },
    onError: (error: any) => {
      toast.error(`Failed to share shortlist: ${error.message}`);
    },
  });

  const handleShare = () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    if (shortlistIds.length === 0) {
      toast.error("Your shortlist is empty");
      return;
    }

    shareShortlistMutation.mutate({
      carIds: shortlistIds,
      recipientEmail,
      message: message || undefined,
    });
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/dealer/marketplace?shared=${shortlistIds.join(",")}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share Shortlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share Shortlist</DialogTitle>
          <DialogDescription>
            Share your shortlist with team members or colleagues. They'll receive an email with links to all {shortlistIds.length} vehicles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@dealership.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Share Link
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={shareShortlistMutation.isPending}
          >
            <Mail className="w-4 h-4 mr-2" />
            {shareShortlistMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
