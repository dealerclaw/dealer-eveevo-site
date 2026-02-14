import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Heart, TrendingDown, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import DealerLayout from "@/components/DealerLayout";
import { useEffect } from "react";

export default function Watchlist() {
  const { data: watchlist, isLoading, refetch } = trpc.dealer.getWatchlist.useQuery();
  const { data: priceDrops, refetch: refetchPriceDrops } = trpc.dealer.checkPriceDrops.useQuery();

  const removeFromWatchlistMutation = trpc.dealer.removeFromWatchlist.useMutation({
    onSuccess: () => {
      toast.success("Removed from watchlist");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove from watchlist");
    },
  });

  const addToCartMutation = trpc.dealer.addToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  useEffect(() => {
    // Check for price drops every 5 minutes
    const interval = setInterval(() => {
      refetchPriceDrops();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetchPriceDrops]);

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
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-8 h-8" />
          Watchlist
        </h1>

        {/* Price Drop Alerts */}
        {priceDrops && priceDrops.length > 0 && (
          <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Price Drop Alert!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    {priceDrops.length} vehicle{priceDrops.length > 1 ? 's have' : ' has'} dropped in price
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!watchlist || watchlist.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your watchlist is empty</h2>
              <p className="text-muted-foreground">
                Add vehicles from the Live Auction to track their prices
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => {
              const priceDrop = priceDrops?.find(pd => pd.carId === item.carId);
              const currentPrice = item.price ? parseFloat(item.price) : 0;
              const initialPrice = item.initialPrice ? parseFloat(item.initialPrice) : 0;
              const priceChange = initialPrice > 0 ? ((currentPrice - initialPrice) / initialPrice) * 100 : 0;

              return (
                <Card key={item.id} className={priceDrop ? "border-green-500" : ""}>
                  <CardContent className="p-4">
                    {item.mainImage && (
                      <img
                        src={item.mainImage}
                        alt={`${item.make} ${item.model}`}
                        className="w-full h-48 object-cover rounded mb-4"
                      />
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {item.year} {item.make} {item.model}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          {item.condition && (
                            <Badge variant="secondary" className="capitalize">
                              {item.condition}
                            </Badge>
                          )}
                          {item.mileage && (
                            <Badge variant="outline">
                              {item.mileage.toLocaleString()} miles
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Price</span>
                          <span className="text-xl font-bold text-primary">
                            £{currentPrice.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Initial Price</span>
                          <span>£{initialPrice.toLocaleString()}</span>
                        </div>

                        {priceChange !== 0 && (
                          <div className={`flex justify-between items-center text-sm font-semibold ${
                            priceChange < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <span>Price Change</span>
                            <span>
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {priceDrop && (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
                          <TrendingDown className="w-4 h-4 inline mr-1" />
                          Price dropped {priceDrop.priceDrop}% (£{priceDrop.savings} savings)
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (!item.price) {
                              toast.error("Price not available");
                              return;
                            }
                            addToCartMutation.mutate({
                              carId: item.carId,
                              priceAtAdd: item.price,
                            });
                          }}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromWatchlistMutation.mutate({ carId: item.carId })}
                          disabled={removeFromWatchlistMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
