import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface AddToShortlistButtonProps {
  carId: number;
  carName: string;
}

export default function AddToShortlistButton({ carId, carName }: AddToShortlistButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToShortlist = () => {
    setIsAdding(true);
    
    // Get existing shortlist from localStorage
    const shortlistStr = localStorage.getItem("dealerShortlist");
    let shortlist: number[] = [];
    
    if (shortlistStr) {
      try {
        shortlist = JSON.parse(shortlistStr);
      } catch (e) {
        console.error("Failed to parse shortlist:", e);
      }
    }
    
    // Check if already in shortlist
    if (shortlist.includes(carId)) {
      toast.info("Vehicle already in shortlist");
      setIsAdding(false);
      return;
    }
    
    // Add to shortlist
    shortlist.push(carId);
    localStorage.setItem("dealerShortlist", JSON.stringify(shortlist));
    
    toast.success(`${carName} added to shortlist`);
    setIsAdding(false);
  };

  return (
    <Button
      className="w-full bg-green-600 hover:bg-green-700"
      size="lg"
      onClick={handleAddToShortlist}
      disabled={isAdding}
    >
      {isAdding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4 mr-2" />
          Add to Shortlist
        </>
      )}
    </Button>
  );
}
