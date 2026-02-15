import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Battery,
  Calendar,
  Car,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Settings,
  Zap,
  Clock,
  DollarSign,
  Loader2,
  MessageCircle,
  Store,
  Phone,
  Mail,
} from "lucide-react";
import RebeccaChat from "@/components/RebeccaChat";
import TestDriveBookingDialog from "@/components/TestDriveBookingDialog";
import FinanceCalculator from "@/components/FinanceCalculator";
import CarImageGallery from "@/components/CarImageGallery";
import AddToShortlistButton from "@/components/AddToShortlistButton";
import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function CarDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();


  // Fetch car details
  const { data: car, isLoading } = trpc.cars.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );
  
  // Track recently viewed vehicles
  useEffect(() => {
    if (car && id) {
      const carId = parseInt(id);
      const stored = localStorage.getItem("recentlyViewed");
      let recentlyViewed: number[] = [];
      
      if (stored) {
        try {
          recentlyViewed = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse recently viewed:", e);
        }
      }
      
      // Remove if already exists (to move to front)
      recentlyViewed = recentlyViewed.filter(id => id !== carId);
      
      // Add to front
      recentlyViewed.unshift(carId);
      
      // Keep only last 10
      recentlyViewed = recentlyViewed.slice(0, 10);
      
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    }
  }, [car, id]);

  // Stripe checkout mutation
  const createCheckout = trpc.reservations.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecting to secure payment...");
        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleReserve = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to reserve a vehicle");
      return;
    }

    if (!car) return;

    createCheckout.mutate({
      carId: car.id,
    });
  };

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

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Car not found</h2>
            <p className="text-muted-foreground mb-4">The vehicle you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/browse')}>
              Browse Vehicles
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const images = car.images && car.images.length > 0 ? car.images : (car.mainImage ? [car.mainImage] : []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <RebeccaChat carId={id} />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Back button */}
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/browse')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Images and main info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <CarImageGallery images={images} make={car.make} model={car.model} />
              
              {!car.isAvailable && (
                <Badge variant="destructive" className="text-lg px-4 py-2 w-full justify-center">
                  Not Available
                </Badge>
              )}

              {/* Vehicle title and badges */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {car.year} {car.make} {car.model}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{car.condition}</Badge>
                      {car.bodyType && <Badge variant="outline">{car.bodyType}</Badge>}
                      {car.isFeatured && <Badge className="bg-primary">Featured</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-3xl font-bold text-primary mb-4">
                  £{car.price ? parseInt(car.price).toLocaleString() : "N/A"}
                </p>
              </div>

              {/* Key specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Battery className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Real Range</p>
                        <p className="font-semibold">{car.realRange || "N/A"} miles</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Battery</p>
                        <p className="font-semibold">{car.batteryCapacity || "N/A"} kWh</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">0-60 mph</p>
                        <p className="font-semibold">{car.acceleration || "N/A"}s</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transmission</p>
                        <p className="font-semibold">{car.transmission || "Automatic"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mileage</p>
                        <p className="font-semibold">{car.mileage?.toLocaleString() || "N/A"} miles</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fast Charge (10-80%)</p>
                        <p className="font-semibold">{car.chargingTime ? `${car.chargingTime} min` : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {car.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{car.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {car.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column - Reservation card and Finance Calculator */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Reserve This Vehicle</CardTitle>
                  <CardDescription>
                    Secure your test drive and get priority access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-lg">
                        £{car.price ? parseInt(car.price).toLocaleString() : "N/A"}
                      </span>
                    </div>

                    {car.color && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Color</span>
                        <span className="font-medium">{car.color}</span>
                      </div>
                    )}

                    {car.vin && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">VIN</span>
                        <span className="font-mono text-xs">{car.vin}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleReserve}
                    disabled={!car.isAvailable || createCheckout.isPending}
                  >
                    {createCheckout.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : !car.isAvailable ? (
                      "Not Available"
                    ) : (
                      "Reserve for £99"
                    )}
                  </Button>

                  {/* Add to Shortlist button for dealer users viewing dealer marketplace items */}
                  {user?.role === 'dealer' && car.marketplace === 'dealer_only' && (
                    <AddToShortlistButton carId={car.id} carName={`${car.year} ${car.make} ${car.model}`} />
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      if (car.dealer?.whatsappNumber) {
                        const message = `Hi, I'm interested in your ${car.year} ${car.make} ${car.model} listed on EVEEVO for £${car.price ? parseFloat(car.price.toString()).toLocaleString() : 'N/A'}`;
                        const whatsappUrl = `https://wa.me/${car.dealer.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      } else {
                        toast.error('WhatsApp contact not available for this dealer');
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Dealer via WhatsApp
                  </Button>

                  {car.dealer && (
                    <TestDriveBookingDialog
                      carId={car.id}
                      dealerId={car.dealer.id}
                      carName={`${car.year} ${car.make} ${car.model}`}
                    />
                  )}

                  {/* Show prominent finance button for FREE tier dealers, hide for PAID dealers */}
                  {car.dealer?.subscriptionStatus !== 'active' && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      size="lg"
                      onClick={() => navigate(`/finance-check?carId=${car.id}`)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Arrange Finance with EVEEVO
                    </Button>
                  )}

                  <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                    <p>✓ Free test drive</p>
                    <p>✓ No obligation</p>
                    <p>✓ Expert advice included</p>
                  </div>
                </CardContent>
              </Card>

              {/* Dealer Information */}
              {car.dealer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Dealer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{car.dealer.name}</p>
                    </div>
                    {car.dealer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${car.dealer.email}`} className="text-primary hover:underline">
                          {car.dealer.email}
                        </a>
                      </div>
                    )}
                    {car.dealer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${car.dealer.phone}`} className="text-primary hover:underline">
                          {car.dealer.phone}
                        </a>
                      </div>
                    )}
                    {car.dealer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground">{car.dealer.address}</p>
                      </div>
                    )}
                    {car.dealer.id && (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate(`/dealers/${car.dealer!.id}`)}
                      >
                        View Dealer Profile
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Finance Calculator */}
              {car.price && (
                <FinanceCalculator 
                  vehiclePrice={parseInt(car.price)} 
                  carId={car.id}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Similar Vehicles Section */}
      <SimilarVehiclesSection carId={parseInt(id || "0")} />
    </div>
  );
}

// Similar Vehicles Component
function SimilarVehiclesSection({ carId }: { carId: number }) {
  const [, navigate] = useLocation();
  const { data: similarCars, isLoading } = trpc.cars.getSimilarCars.useQuery(
    { carId, limit: 4 },
    { enabled: !!carId }
  );

  if (isLoading || !similarCars || similarCars.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-12">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6">Similar Vehicles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarCars.map((car) => (
            <Card 
              key={car.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/cars/${car.id}`)}
            >
              <div className="aspect-video relative bg-muted">
                {car.mainImage ? (
                  <img
                    src={car.mainImage}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">
                  {car.year} {car.make} {car.model}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{car.condition}</Badge>
                  {car.mileage && <span>{car.mileage.toLocaleString()} miles</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-xl font-bold">
                      £{car.price ? parseFloat(car.price.toString()).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {car.realRange && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Real Range</span>
                      <span>{car.realRange} miles</span>
                    </div>
                  )}
                  {car.batteryCapacity && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Battery</span>
                      <span>{car.batteryCapacity} kWh</span>
                    </div>
                  )}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
