import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DealerLayout from "@/components/DealerLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, GitCompare, FileText, Share2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import ShareShortlistDialog from "@/components/ShareShortlistDialog";

export default function MyShortlist() {
  const [shortlistIds, setShortlistIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load shortlist from localStorage
  useEffect(() => {
    const shortlistStr = localStorage.getItem("dealerShortlist");
    if (shortlistStr) {
      try {
        const ids = JSON.parse(shortlistStr);
        setShortlistIds(ids);
      } catch (e) {
        console.error("Failed to parse shortlist:", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch vehicle details for shortlisted cars
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.dealer.getShortlistVehicles.useQuery(
    { carIds: shortlistIds },
    { enabled: shortlistIds.length > 0 }
  );

  const handleRemove = (carId: number) => {
    const updated = shortlistIds.filter(id => id !== carId);
    setShortlistIds(updated);
    localStorage.setItem("dealerShortlist", JSON.stringify(updated));
    setSelectedIds(selectedIds.filter(id => id !== carId));
    toast.success("Removed from shortlist");
  };

  const handleBulkRemove = () => {
    const updated = shortlistIds.filter(id => !selectedIds.includes(id));
    setShortlistIds(updated);
    localStorage.setItem("dealerShortlist", JSON.stringify(updated));
    setSelectedIds([]);
    toast.success(`Removed ${selectedIds.length} vehicles from shortlist`);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === shortlistIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...shortlistIds]);
    }
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 vehicles to compare");
      return;
    }
    if (selectedIds.length > 4) {
      toast.error("You can compare up to 4 vehicles at once");
      return;
    }
    // Navigate to compare page with selected IDs
    window.location.href = `/compare?ids=${selectedIds.join(",")}`;
  };

  const handleRequestQuotes = () => {
    if (selectedIds.length === 0) {
      toast.error("Select vehicles to request quotes");
      return;
    }
    toast.success(`Quote requests sent for ${selectedIds.length} vehicles`);
  };

  if (isLoading || vehiclesLoading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Shortlist</h1>
            <p className="text-muted-foreground mt-1">
              {shortlistIds.length} vehicle{shortlistIds.length !== 1 ? "s" : ""} saved
            </p>
          </div>

          {shortlistIds.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
              >
                {selectedIds.length === shortlistIds.length ? "Deselect All" : "Select All"}
              </Button>

              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCompare}
                    disabled={selectedIds.length < 2}
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare ({selectedIds.length})
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleRequestQuotes}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request Quotes ({selectedIds.length})
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleBulkRemove}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove ({selectedIds.length})
                  </Button>
                </>
              )}

              <ShareShortlistDialog shortlistIds={shortlistIds} />
            </div>
          )}
        </div>

        {shortlistIds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Your shortlist is empty</p>
              <Link href="/dealer/marketplace">
                <Button>Browse Dealer Marketplace</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vehicles?.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.includes(vehicle.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, vehicle.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== vehicle.id));
                          }
                        }}
                      />

                      <img
                        src={vehicle.images?.[0] || "/placeholder-car.jpg"}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-muted-foreground">
                            {vehicle.mileage?.toLocaleString()} miles • {vehicle.condition}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            £{vehicle.price?.toLocaleString()}
                          </p>
                          {vehicle.marketplace === "dealer_only" && (
                            <Badge variant="secondary" className="mt-1">Trade Only</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Link href={`/dealer/marketplace/${vehicle.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(vehicle.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
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
    </DealerLayout>
  );
}
