import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Zap,
  Fuel,
  Car,
  MapPin,
  Filter,
  ChevronRight,
  Info,
  ArrowRight,
  Loader2,
} from "lucide-react";

const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"];
const BODY_TYPES = ["Hatchback", "Saloon", "SUV", "Estate", "Coupe", "Convertible", "Van", "Pickup"];
const BUYER_NEEDS = [
  "Budget Buy", "First Car", "Family Car", "Long Distance",
  "Low Insurance", "ULEZ", "Prestige", "Part-Exchange Bargain", "Work Vehicle",
];
const PRICE_RANGES = [
  { label: "Under £5,000", max: 5000 },
  { label: "Under £10,000", max: 10000 },
  { label: "Under £15,000", max: 15000 },
  { label: "Under £20,000", max: 20000 },
  { label: "£20,000+", min: 20000 },
];
const TRANSMISSIONS = ["Automatic", "Manual"];

function FuelBadge({ fuel }: { fuel?: string | null }) {
  if (!fuel) return <span className="text-xs text-muted-foreground">Fuel type unknown</span>;
  const colours: Record<string, string> = {
    Electric: "bg-green-100 text-green-800 border-green-300",
    "Plug-in Hybrid": "bg-blue-100 text-blue-800 border-blue-300",
    Hybrid: "bg-teal-100 text-teal-800 border-teal-300",
    Petrol: "bg-orange-100 text-orange-800 border-orange-300",
    Diesel: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colours[fuel] ?? "bg-muted text-muted-foreground"}`}>
      {fuel}
    </span>
  );
}

function DealerClawCarCard({ car }: { car: any }) {
  const images = car.images && car.images.length > 0 ? car.images : (car.mainImage ? [car.mainImage] : []);
  const thumb = images[0] ?? null;
  const price = car.price ? `£${Number(car.price).toLocaleString()}` : "POA";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {/* DealerClaw badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-[#1a1a2e] text-white text-xs font-bold px-2 py-0.5 rounded">DealerClaw Car</span>
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Dealer-promoted stock</span>
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight">{car.year} {car.make} {car.model}</h3>
            {car.derivative && <p className="text-xs text-muted-foreground">{car.derivative}</p>}
          </div>
          <span className="font-bold text-primary text-sm whitespace-nowrap">{price}</span>
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          <FuelBadge fuel={car.fuelType} />
          {car.transmission && (
            <span className="text-xs text-muted-foreground">{car.transmission}</span>
          )}
          {car.mileage != null && (
            <span className="text-xs text-muted-foreground">{Number(car.mileage).toLocaleString()} mi</span>
          )}
        </div>
        {(car.dealerName || car.location) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{[car.dealerName, car.location].filter(Boolean).join(" · ")}</span>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/cars/${car.id}`}>View Car</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/browse?type=electric&maxPrice=${car.price ?? 20000}`}>
              <Zap className="w-3 h-3 mr-1" />
              Compare EV
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DealerClawCars() {
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedBody, setSelectedBody] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<{ max?: number; min?: number } | null>(null);
  const [selectedTransmission, setSelectedTransmission] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleFuel = (f: string) =>
    setSelectedFuels(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleBody = (b: string) =>
    setSelectedBody(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const { data, isLoading } = trpc.cars.list.useQuery({
    source: "dealerclaw",
    fuelType: selectedFuels.length === 1 ? selectedFuels[0] : undefined,
    bodyType: selectedBody.length === 1 ? selectedBody[0] : undefined,
    maxPrice: selectedPrice?.max,
    minPrice: selectedPrice?.min,
    transmission: selectedTransmission ?? undefined,
    limit: 48,
    offset: 0,
  } as any, { keepPreviousData: true } as any);

  const cars: any[] = (data as any)?.cars ?? [];
  const total: number = (data as any)?.total ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* SEO-friendly server-rendered hero */}
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#1a1a2e] text-white py-16">
          <div className="container max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">DealerClaw Cars</span>
              <span className="text-white/60 text-xs">Dealer-promoted stock</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Practical dealer stock for buyers not ready to switch to electric yet.
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl">
              Browse petrol, diesel, hybrid and value cars promoted by trusted dealers using DealerClaw. EVEEVO stays EV-first, but DealerClaw Cars helps you find the right practical option today — and compare it with electric alternatives for the future.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-[#1a1a2e] hover:bg-white/90 font-semibold" onClick={() => document.getElementById('car-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                Browse DealerClaw Cars
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                <Link href="/browse">Compare with EV Alternatives</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Explainer sections */}
        <section className="bg-muted/40 py-10 border-b">
          <div className="container max-w-4xl grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">What are DealerClaw Cars?</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                DealerClaw Cars are vehicles supplied by dealers using DealerClaw, EVEEVO's AI stock-selling engine. These cars may include petrol, diesel, hybrid, part-exchange, value, prestige and older dealer stock.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                They are listed separately from EVEEVO Electric because they are practical alternatives for buyers who cannot switch to electric yet.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Why show non-electric cars on EVEEVO?</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                EVEEVO helps buyers move towards smarter, cleaner motoring. Some buyers are ready for electric today. Others need a lower-cost petrol, diesel or hybrid car first because of budget, charging access, insurance, towing, work use or personal circumstances.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                DealerClaw Cars keeps those buyers inside the EVEEVO ecosystem while still helping them compare running costs and future EV options.
              </p>
            </div>
          </div>
        </section>

        {/* Filters + Grid */}
        <section className="py-8" id="car-grid">
          <div className="container">
            {/* Filter toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">DealerClaw Cars</h2>
                {total > 0 && <p className="text-sm text-muted-foreground">{total.toLocaleString()} vehicles available</p>}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}>
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {showFilters && (
              <div className="bg-muted/30 border rounded-lg p-4 mb-6 space-y-4">
                {/* Fuel type */}
                <div>
                  <p className="text-sm font-semibold mb-2">Fuel Type</p>
                  <div className="flex flex-wrap gap-2">
                    {FUEL_TYPES.map(f => (
                      <button
                        key={f}
                        onClick={() => toggleFuel(f)}
                        className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${selectedFuels.includes(f) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                {/* Body type */}
                <div>
                  <p className="text-sm font-semibold mb-2">Vehicle Type</p>
                  <div className="flex flex-wrap gap-2">
                    {BODY_TYPES.map(b => (
                      <button
                        key={b}
                        onClick={() => toggleBody(b)}
                        className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${selectedBody.includes(b) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                {/* Price */}
                <div>
                  <p className="text-sm font-semibold mb-2">Price</p>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map(p => {
                      const active = selectedPrice?.max === p.max && selectedPrice?.min === p.min;
                      return (
                        <button
                          key={p.label}
                          onClick={() => setSelectedPrice(active ? null : { max: p.max, min: p.min })}
                          className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Separator />
                {/* Transmission */}
                <div>
                  <p className="text-sm font-semibold mb-2">Transmission</p>
                  <div className="flex flex-wrap gap-2">
                    {TRANSMISSIONS.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTransmission(selectedTransmission === t ? null : t)}
                        className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${selectedTransmission === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedFuels.length > 0 || selectedBody.length > 0 || selectedPrice || selectedTransmission) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedFuels([]); setSelectedBody([]); setSelectedPrice(null); setSelectedTransmission(null); }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <Car className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No DealerClaw Cars found</h3>
                <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters, or browse all vehicles.</p>
                <Button asChild>
                  <Link href="/browse">Browse All Vehicles</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cars.map((car: any) => (
                  <DealerClawCarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Buyer note */}
        <section className="bg-muted/40 border-t py-10">
          <div className="container max-w-3xl text-center">
            <p className="text-sm text-muted-foreground italic">
              EVEEVO is EV-first, but we know not every buyer can switch to electric today. DealerClaw Cars shows practical petrol, diesel, hybrid and value cars from dealers using DealerClaw — while helping you compare running costs and future EV alternatives.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/browse">Browse Electric Cars</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/for-dealers">
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Are you a dealer? Learn about DealerClaw
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
