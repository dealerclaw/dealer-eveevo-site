import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Car, DollarSign, Loader2, MapPin } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function MyReservations() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const { data: reservations, isLoading } = trpc.reservations.myReservations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Reservations</h1>
            <p className="text-muted-foreground">
              View and manage your vehicle reservations
            </p>
          </div>

          {!reservations || reservations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reservations Yet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  You haven't reserved any vehicles yet. Browse our inventory to find your perfect EV!
                </p>
                <Button onClick={() => navigate('/browse')}>
                  Browse Vehicles
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => reservation.car && (
                <Card key={reservation.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Vehicle Image */}
                      {reservation.car.mainImage && (
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={reservation.car.mainImage}
                            alt={`${reservation.car.make} ${reservation.car.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Reservation Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {reservation.car.year} {reservation.car.make} {reservation.car.model}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </Badge>
                            {reservation.car.condition && (
                              <Badge variant="outline">{reservation.car.condition}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              Price: £{reservation.car.price ? parseFloat(reservation.car.price.toString()).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Reserved: {new Date(reservation.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reservation.car && navigate(`/cars/${reservation.car.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
