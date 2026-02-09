import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { Battery, Car, Heart, Search } from "lucide-react";
import { Link } from "wouter";

export default function Browse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [rangeFilter, setRangeFilter] = useState([0, 400]);
  const [condition, setCondition] = useState<"all" | "new" | "used">("all");

  // Fetch cars with filters
  const { data: cars, isLoading } = trpc.cars.list.useQuery({
    make: selectedMake || undefined,
    model: selectedModel || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    minRange: rangeFilter[0],
    maxRange: rangeFilter[1],
    condition: condition === "all" ? undefined : condition,
    limit: 50,
  });

  // Get unique makes from cars
  const makes = useMemo(() => {
    if (!cars) return [];
    const uniqueMakes = new Set(cars.map(car => car.make));
    return Array.from(uniqueMakes).sort();
  }, [cars]);

  // Filter cars by search term
  const filteredCars = useMemo(() => {
    if (!cars) return [];
    if (!searchTerm) return cars;
    
    const term = searchTerm.toLowerCase();
    return cars.filter(car => 
      car.make.toLowerCase().includes(term) ||
      car.model.toLowerCase().includes(term) ||
      car.description?.toLowerCase().includes(term)
    );
  }, [cars, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Electric & Hybrid Vehicles</h1>
            <p className="text-xl text-muted-foreground">
              Explore our collection of {cars?.length || 0} electric and hybrid vehicles from 54,000+ listings
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search */}
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search make, model..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={(value: any) => setCondition(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Make */}
                  <div>
                    <Label>Make</Label>
                    <Select value={selectedMake} onValueChange={setSelectedMake}>
                      <SelectTrigger>
                        <SelectValue placeholder="All makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All makes</SelectItem>
                        {makes.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label>
                      Price Range: £{priceRange[0].toLocaleString()} - £{priceRange[1].toLocaleString()}
                    </Label>
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="mt-2"
                    />
                  </div>

                  {/* Range Filter */}
                  <div>
                    <Label>
                      Electric Range: {rangeFilter[0]} - {rangeFilter[1]} miles
                    </Label>
                    <Slider
                      min={0}
                      max={400}
                      step={10}
                      value={rangeFilter}
                      onValueChange={setRangeFilter}
                      className="mt-2"
                    />
                  </div>

                  {/* Reset Filters */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedMake("");
                      setSelectedModel("");
                      setPriceRange([0, 100000]);
                      setRangeFilter([0, 400]);
                      setCondition("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Cars Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-muted" />
                      <CardHeader>
                        <div className="h-6 bg-muted rounded mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : filteredCars && filteredCars.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {filteredCars.length} vehicles
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                      <Link key={car.id} href={`/cars/${car.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <div className="relative h-48 overflow-hidden rounded-t-lg">
                            {car.mainImage ? (
                              <img
                                src={car.mainImage}
                                alt={`${car.make} ${car.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Car className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // TODO: Add to favorites
                                }}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            {car.condition && (
                              <div className="absolute top-2 left-2">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                  {car.condition === 'new' ? 'New' : 'Used'}
                                </span>
                              </div>
                            )}
                          </div>
                          <CardHeader>
                            <CardTitle className="line-clamp-1">
                              {car.make} {car.model}
                            </CardTitle>
                            <CardDescription>
                              {car.year && <span>{car.year}</span>}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {car.price && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Price</span>
                                  <span className="font-semibold text-lg text-primary">
                                    £{parseFloat(car.price).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {car.range && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center">
                                    <Battery className="w-4 h-4 mr-1" /> Range
                                  </span>
                                  <span className="font-medium">{car.range} miles</span>
                                </div>
                              )}
                              {car.batteryCapacity && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Battery</span>
                                  <span className="font-medium">{car.batteryCapacity} kWh</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      No vehicles found matching your criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedMake("");
                        setPriceRange([0, 100000]);
                        setRangeFilter([0, 400]);
                        setCondition("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
