import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface AddToCartButtonProps {
  carId: number;
  carName: string;
}

export default function AddToCartButton({ carId, carName }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    
    // Get existing cart from localStorage
    const cartStr = localStorage.getItem("dealerCart");
    let cart: number[] = [];
    
    if (cartStr) {
      try {
        cart = JSON.parse(cartStr);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    
    // Check if already in cart
    if (cart.includes(carId)) {
      toast.info("Vehicle already in cart");
      setIsAdding(false);
      return;
    }
    
    // Add to cart
    cart.push(carId);
    localStorage.setItem("dealerCart", JSON.stringify(cart));
    
    toast.success(`${carName} added to cart`);
    setIsAdding(false);
  };

  return (
    <Button
      className="w-full bg-green-600 hover:bg-green-700"
      size="lg"
      onClick={handleAddToCart}
      disabled={isAdding}
    >
      {isAdding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
