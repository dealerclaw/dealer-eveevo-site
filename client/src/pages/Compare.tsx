import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { X, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Compare() {
  const [compareIds, setCompareIds] = useState<number[]>([]);

  // Load comparison IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("compareVehicles");
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        setCompareIds(ids);
      } catch (e) {
        console.error("Failed to parse compare vehicles:", e);
      }
    }
  }, []);

  // Fetch vehicles by IDs
  const { data: vehicles, isLoading } = trpc.cars.getByIds.useQuery(
    { ids: compareIds },
    { enabled: compareIds.length > 0 }
  );

  const removeVehicle = (id: number) => {
    const newIds = compareIds.filter((vid) => vid !== id);
    setCompareIds(newIds);
    localStorage.setItem("compareVehicles", JSON.stringify(newIds));
  };

  const clearAll = () => {
    setCompareIds([]);
    localStorage.removeItem("compareVehicles");
  };

  if (compareIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Compare Vehicles</h1>
            <p className="text-muted-foreground mb-8">
              You haven't selected any vehicles to compare yet.
            </p>
            <Link href="/browse">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Vehicles
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="text-center">Loading comparison...</div>
        </main>
      </div>
    );
  }

  const specs = [
    { label: "Price", key: "price", format: (v: any) => v ? `£${parseInt(v).toLocaleString()}` : "N/A" },
    { label: "Condition", key: "condition", format: (v: any) => v || "N/A" },
    { label: "Real Range", key: "realRange", format: (v: any) => v ? `${v} miles` : "N/A" },
    { label: "Battery Capacity", key: "batteryCapacity", format: (v: any) => v ? `${v} kWh` : "N/A" },
    { label: "Fast Charge (10-80%)", key: "chargingTime", format: (v: any) => v ? `${v} min` : "N/A" },
    { label: "0-60 mph", key: "acceleration", format: (v: any) => v ? `${v}s` : "N/A" },
    { label: "Mileage", key: "mileage", format: (v: any) => v ? `${parseInt(v).toLocaleString()} miles` : "N/A" },
    { label: "Year", key: "year", format: (v: any) => v || "N/A" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compare Vehicles</h1>
            <p className="text-muted-foreground">
              Comparing {vehicles?.length || 0} vehicle{vehicles?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/browse">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Browse
              </Button>
            </Link>
            <Button variant="destructive" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left bg-muted font-semibold border">
                  Specification
                </th>
                {vehicles?.map((car) => (
                  <th key={car.id} className="p-4 border bg-muted">
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={car.mainImage || "https://placehold.co/200x150?text=No+Image"}
                        alt={`${car.make} ${car.model}`}
                        className="w-32 h-24 object-cover rounded"
                      />
                      <div className="text-center">
                        <div className="font-semibold">{car.make} {car.model}</div>
                        <div className="text-sm text-muted-foreground">{car.year}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVehicle(car.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.key}>
                  <td className="p-4 font-medium border bg-muted/50">
                    {spec.label}
                  </td>
                  {vehicles?.map((car) => (
                    <td key={car.id} className="p-4 text-center border">
                      {spec.format((car as any)[spec.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View Details Buttons */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          {vehicles?.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`}>
              <Button>
                View {car.make} {car.model} Details
              </Button>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
