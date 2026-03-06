import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Heart, ArrowLeft, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

export default function Favorites() {
  const { isAuthenticated, loading } = useAuth();
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 max-w-5xl mx-auto px-4">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/browse">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              My Favourites
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {favorites?.length ?? 0} saved vehicle{favorites?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Loading state */}
        {(loading || isLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Not logged in */}
        {!loading && !isAuthenticated && (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to see your favourites</h2>
            <p className="text-muted-foreground mb-6">Save vehicles you love and come back to them anytime.</p>
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !isLoading && isAuthenticated && favorites?.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favourites yet</h2>
            <p className="text-muted-foreground mb-6">
              Browse vehicles and click the heart icon to save ones you like.
            </p>
            <Button asChild>
              <Link href="/browse">Browse EVs</Link>
            </Button>
          </div>
        )}

        {/* Favourites grid */}
        {!isLoading && favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((item: any) => {
              const car = item.car;
              return (
                <Card key={item.favorite?.id ?? car?.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative">
                    {car.imageUrl ? (
                      <img
                        src={car.imageUrl}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-44 bg-muted flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFavorite.mutate({ carId: item.favorite?.carId ?? car?.id })}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white shadow transition-colors"
                      title="Remove from favourites"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-base leading-tight">
                          {car.make} {car.model}
                        </h3>
                        {car.year && (
                          <p className="text-sm text-muted-foreground">{car.year}</p>
                        )}
                      </div>
                      {car.condition && (
                        <Badge variant={car.condition === "new" ? "default" : "secondary"} className="shrink-0 text-xs">
                          {car.condition === "new" ? "New" : "Used"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-primary">
                        {car.price ? `£${Number(car.price).toLocaleString()}` : "POA"}
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/cars/${car.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
