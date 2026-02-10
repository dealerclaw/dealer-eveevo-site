import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Battery, Car } from "lucide-react";
import { Link } from "wouter";

export default function RecentlyViewed() {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

  // Load recently viewed IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        // Take only first 6 for display
        setRecentlyViewedIds(ids.slice(0, 6));
      } catch (e) {
        console.error("Failed to parse recently viewed:", e);
      }
    }
  }, []);

  // Fetch vehicles by IDs
  const { data: vehicles, isLoading } = trpc.cars.getByIds.useQuery(
    { ids: recentlyViewedIds },
    { enabled: recentlyViewedIds.length > 0 }
  );

  if (recentlyViewedIds.length === 0 || !vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Recently Viewed</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((car) => (
          <Link key={car.id} href={`/cars/${car.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="relative h-32 overflow-hidden rounded-t-lg">
                {car.mainImage ? (
                  <img
                    src={car.mainImage}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Car className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">
                  {car.make} {car.model}
                </CardTitle>
                <CardDescription className="text-sm">
                  {car.year && <span>{car.year}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1">
                  {car.price && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-primary">
                        £{parseFloat(car.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {car.realRange && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center">
                        <Battery className="w-3 h-3 mr-1" /> Range
                      </span>
                      <span className="font-medium">{car.realRange} mi</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
