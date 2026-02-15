import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { 
  Phone, Mail, MessageCircle, MapPin, Star, 
  CheckCircle, Car, ExternalLink, Navigation, Trophy
} from "lucide-react";

export default function DealerProfile() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const dealerId = parseInt(id || "0");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  
  const { data: dealer, isLoading: dealerLoading } = trpc.dealers.getById.useQuery({ id: dealerId });
  const { data: cars, isLoading: carsLoading } = trpc.dealers.getCars.useQuery({ dealerId });
  const { data: reviews } = trpc.dealers.getReviews.useQuery({ dealerId });
  const { data: winStats } = trpc.dealers.getDealerWinStats.useQuery({ dealerId });

  const submitReviewMutation = trpc.dealers.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully");
      setReviewText("");
      setReviewRating(5);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }
    submitReviewMutation.mutate({
      dealerId,
      rating: reviewRating,
      reviewText: reviewText.trim(),
    });
  };

  if (dealerLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Dealer Not Found</h1>
        <Button onClick={() => navigate("/dealers")}>Browse Dealers</Button>
      </div>
    );
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/\s/g, '');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-b">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Dealer Logo/Avatar */}
            <div className="flex-shrink-0">
              {dealer.logoUrl ? (
                <img 
                  src={dealer.logoUrl} 
                  alt={dealer.name}
                  className="w-32 h-32 rounded-lg object-cover bg-white p-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                  <Car className="w-16 h-16 text-green-600" />
                </div>
              )}
            </div>

            {/* Dealer Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{dealer.name}</h1>
                {dealer.isVerified && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {dealer.subscriptionStatus === 'active' && (
                  <Badge variant="secondary">Premium Dealer</Badge>
                )}
                {winStats && winStats.totalWins > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800">
                    <Trophy className="w-3 h-3 mr-1 text-yellow-600" />
                    {winStats.totalWins} Auction {winStats.totalWins === 1 ? 'Win' : 'Wins'}
                  </Badge>
                )}
              </div>

              {/* Auction Stats */}
              {winStats && winStats.totalWins > 0 && (
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">{winStats.totalWins}</span>
                    <span className="text-muted-foreground">wins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{winStats.winRate.toFixed(1)}%</span>
                    <span className="text-muted-foreground">win rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">£{winStats.totalSpent.toLocaleString()}</span>
                    <span className="text-muted-foreground">total spent</span>
                  </div>
                </div>
              )}

              {dealer.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(parseFloat(dealer.rating || "0"))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dealer.rating} rating
                  </span>
                </div>
              )}

              {dealer.description && (
                <p className="text-muted-foreground mb-4">{dealer.description}</p>
              )}

              {/* Location */}
              {(dealer.address || dealer.city || dealer.postcode) && (
                <div className="flex items-start gap-2 text-sm mb-4">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {dealer.address && <>{dealer.address}, </>}
                    {dealer.city && <>{dealer.city}, </>}
                    {dealer.postcode}
                  </span>
                </div>
              )}

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-3">
                {dealer.phone && (
                  <Button asChild>
                    <a href={`tel:${formatPhone(dealer.phone)}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call {dealer.phone}
                    </a>
                  </Button>
                )}

                {dealer.whatsappNumber && (
                  <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200" asChild>
                    <a 
                      href={`https://wa.me/${formatPhone(dealer.whatsappNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}

                {dealer.email && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${dealer.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}

                {dealer.website && (
                  <Button variant="outline" asChild>
                    <a href={dealer.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}

                {(dealer.latitude && dealer.longitude) && (
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.latitude},${dealer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Available Vehicles ({cars?.length || 0})
          </h2>
        </div>

        {carsLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : cars && cars.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Card
                key={car.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/cars/${car.id}`)}
              >
                {/* Car Image */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                  {car.mainImage ? (
                    <img
                      src={car.mainImage}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {car.condition === 'new' && (
                    <Badge className="absolute top-2 left-2 bg-green-600">New</Badge>
                  )}
                </div>

                {/* Car Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {car.make} {car.model}
                  </h3>
                  {car.year && (
                    <p className="text-sm text-muted-foreground mb-3">{car.year}</p>
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    {car.price && (
                      <div className="text-2xl font-bold text-green-600">
                        £{parseFloat(car.price).toLocaleString()}
                      </div>
                    )}
                    {car.realRange && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Real Range</span>
                        <span className="font-medium">{car.realRange} miles</span>
                      </div>
                    )}
                    {car.batteryCapacity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Battery</span>
                        <span className="font-medium">{car.batteryCapacity} kWh</span>
                      </div>
                    )}
                    {car.mileage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mileage</span>
                        <span className="font-medium">{car.mileage.toLocaleString()} miles</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Vehicles Available</h3>
            <p className="text-muted-foreground">
              This dealer doesn't have any vehicles listed at the moment.
            </p>
          </Card>
        )}
      </div>

      {/* Reviews Section */}
      <div className="container py-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {/* Submit Review Form */}
        {isAuthenticated && (
          <Card className="mb-8">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Write a Review</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 cursor-pointer transition-colors ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                      onClick={() => setReviewRating(star)}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                  {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                </span>
              </div>
              <Textarea
                placeholder="Share your experience with this dealer..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSubmitReview}
                disabled={submitReviewMutation.isPending || !reviewText.trim()}
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </Card>
        )}

        {/* Reviews List */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{review.userName || "Anonymous"}</div>
                      {review.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm leading-relaxed">{review.reviewText}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">
              {isAuthenticated
                ? "Be the first to review this dealer!"
                : "Sign in to leave a review"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
