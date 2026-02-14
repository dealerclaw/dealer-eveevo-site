import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import DealerLayout from "@/components/DealerLayout";

export default function Cart() {
  const { data: cart, isLoading, refetch } = trpc.dealer.getCart.useQuery();

  const removeFromCartMutation = trpc.dealer.removeFromCart.useMutation({
    onSuccess: () => {
      toast.success("Removed from cart");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove from cart");
    },
  });

  const clearCartMutation = trpc.dealer.clearCart.useMutation({
    onSuccess: () => {
      toast.success("Cart cleared");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clear cart");
    },
  });

  if (isLoading) {
    return (
      <DealerLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Shopping Cart
          </h1>
          {cart && cart.items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
            >
              Clear Cart
            </Button>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground">
                Add vehicles from the Live Auction to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.mainImage && (
                        <img
                          src={item.mainImage}
                          alt={`${item.make} ${item.model}`}
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">
                          {item.year} {item.make} {item.model}
                        </h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          {item.condition && (
                            <span className="capitalize">{item.condition}</span>
                          )}
                          {item.mileage && <span>{item.mileage.toLocaleString()} miles</span>}
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Dealer Price</p>
                            <p className="text-2xl font-bold text-primary">
                              £{item.priceAtAdd ? parseFloat(item.priceAtAdd).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCartMutation.mutate({ carId: item.carId })}
                            disabled={removeFromCartMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items ({cart.items.length})</span>
                      <span className="font-semibold">
                        £{cart.totalPrice.toLocaleString()}
                      </span>
                    </div>
                    
                    {cart.items.length >= 2 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Bulk Discount ({cart.discountPercent.toFixed(0)}%)</span>
                          <span>-£{cart.savings.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">
                              £{cart.discountedPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cart.items.length >= 2 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        🎉 Bulk Discount Applied!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {cart.items.length >= 5
                          ? "You're saving 10% on 5+ vehicles"
                          : "You're saving 13% on 2-4 vehicles"}
                      </p>
                    </div>
                  )}

                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment processing via Stripe
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
