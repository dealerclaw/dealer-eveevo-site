import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, TrendingDown, Clock, CheckCircle2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AdminInventoryHealth() {
  const [healthFilter, setHealthFilter] = useState<"all" | "green" | "amber" | "blue">("all");
  const [searchDealer, setSearchDealer] = useState("");

  const { data: inventory, isLoading } = trpc.dealer.getAllInventoryHealth.useQuery({ 
    healthFilter: healthFilter === "all" ? undefined : healthFilter 
  });

  const getHealthBadge = (rating: string | null, daysOnMarket: number) => {
    const actualRating = rating || (daysOnMarket > 45 ? "blue" : daysOnMarket > 30 ? "amber" : "green");
    
    if (actualRating === "green") {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Healthy</Badge>;
    } else if (actualRating === "amber") {
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" />Warning</Badge>;
    } else {
      return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" />Action Needed</Badge>;
    }
  };

  const handleContactDealer = (dealerEmail: string | null, dealerName: string | null, carInfo: string) => {
    const subject = `Inventory Alert: ${carInfo}`;
    const body = `Hi ${dealerName},\n\nWe noticed that your ${carInfo} has been on the market for an extended period. Consider pushing it to the dealer network to increase visibility and sell faster.\n\nBest regards,\nEVEEVO Team`;
    
    window.location.href = `mailto:${dealerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Email client opened");
  };

  const filteredInventory = inventory?.filter((car: any) => {
    if (!searchDealer) return true;
    const dealerName = car.dealerName?.toLowerCase() || "";
    return dealerName.includes(searchDealer.toLowerCase());
  });

  const stats = {
    total: inventory?.length || 0,
    green: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "green";
    }).length || 0,
    amber: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "amber";
    }).length || 0,
    blue: inventory?.filter((car: any) => {
      const rating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
      return rating === "blue";
    }).length || 0,
    dealers: new Set(inventory?.map((car: any) => car.dealerId)).size || 0,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System-Wide Inventory Health</h1>
        <p className="text-muted-foreground">
          Monitor all dealer inventory and identify vehicles needing attention
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.dealers} dealers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.green}</div>
            <p className="text-xs text-muted-foreground">0-30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.amber}</div>
            <p className="text-xs text-muted-foreground">31-45 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Action Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blue}</div>
            <p className="text-xs text-muted-foreground">45+ days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Days on Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory && inventory.length > 0
                ? Math.round(inventory.reduce((sum: number, car: any) => sum + car.daysOnMarket, 0) / inventory.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">across all dealers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={healthFilter} onValueChange={(value: any) => setHealthFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="green">Healthy Only</SelectItem>
            <SelectItem value="amber">Warning Only</SelectItem>
            <SelectItem value="blue">Action Needed Only</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by dealer name..."
          value={searchDealer}
          onChange={(e) => setSearchDealer(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Inventory List */}
      {isLoading ? (
        <div className="text-center py-12">Loading inventory...</div>
      ) : !filteredInventory || filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No vehicles found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInventory.map((car: any) => {
            const actualRating = car.inventoryHealthRating || (car.daysOnMarket > 45 ? "blue" : car.daysOnMarket > 30 ? "amber" : "green");
            const priceChangeNum = Number(car.priceChangePercentage) || 0;

            return (
              <Card key={car.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {car.mainImage && (
                      <img
                        src={car.mainImage}
                        alt={`${car.make} ${car.model}`}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Dealer: {car.dealerName || "Unknown"}
                          </p>
                          <p className="text-2xl font-bold text-primary mt-1">
                            £{Number(car.price).toLocaleString()}
                          </p>
                        </div>
                        {getHealthBadge(car.inventoryHealthRating, car.daysOnMarket)}
                      </div>

                      <div className="flex gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {car.daysOnMarket} days on market
                        </div>
                        {priceChangeNum !== 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            Price {priceChangeNum > 0 ? "increased" : "dropped"} {Math.abs(priceChangeNum).toFixed(1)}%
                          </div>
                        )}
                        {car.marketplace === "dealer_only" && (
                          <Badge variant="outline">On Dealer Network</Badge>
                        )}
                      </div>

                      {(actualRating === "amber" || actualRating === "blue") && car.marketplace !== "dealer_only" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleContactDealer(
                              car.dealerEmail,
                              car.dealerName,
                              `${car.year} ${car.make} ${car.model}`
                            )}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Dealer
                          </Button>
                          {car.dealerPhone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.location.href = `tel:${car.dealerPhone}`;
                              }}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
