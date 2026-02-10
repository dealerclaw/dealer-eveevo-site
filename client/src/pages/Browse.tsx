import { useState, useMemo, useEffect } from "react";
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
import { Battery, Car, Heart, Search, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Browse() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [rangeFilter, setRangeFilter] = useState([0, 400]);
  const [condition, setCondition] = useState<"all" | "new" | "used">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Read URL parameters and set filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Body type filter
    const bodyType = params.get('bodyType');
    if (bodyType) {
      // Note: This would need proper body type filtering in the backend
      setSearchTerm(bodyType);
    }
    
    // Price range filters
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : 100000
      ]);
    }
    
    // Range filters
    const minRange = params.get('minRange');
    const maxRange = params.get('maxRange');
    if (minRange || maxRange) {
      setRangeFilter([
        minRange ? parseInt(minRange) : 0,
        maxRange ? parseInt(maxRange) : 400
      ]);
    }
  }, [location]);

  // Fetch cars with filters
  const { data: cars, isLoading } = trpc.cars.list.useQuery({
    make: selectedMake && selectedMake !== 'all_makes' ? selectedMake : undefined,
    model: selectedModel || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
    minRange: rangeFilter[0] > 0 ? rangeFilter[0] : undefined,
    maxRange: rangeFilter[1] < 400 ? rangeFilter[1] : undefined,
    condition: condition === "all" ? undefined : condition,
    limit: 1000,
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

  // Pagination logic
  const totalPages = Math.ceil((filteredCars?.length || 0) / itemsPerPage);
  const paginatedCars = useMemo(() => {
    if (!filteredCars) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCars.slice(startIndex, endIndex);
  }, [filteredCars, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMake, selectedModel, priceRange, rangeFilter, condition, searchTerm]);

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
                        <SelectItem value="all_makes">All makes</SelectItem>
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
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCars.length)} of {filteredCars.length} vehicles
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedCars.map((car) => (
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
                              {car.realRange && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center">
                                    <Battery className="w-4 h-4 mr-1" /> Real Range
                                  </span>
                                  <span className="font-medium">{car.realRange} miles</span>
                                </div>
                              )}
                              {car.batteryCapacity && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Battery</span>
                                  <span className="font-medium">{car.batteryCapacity} kWh</span>
                                </div>
                              )}
                              {car.chargingTime && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center">
                                    <Zap className="w-4 h-4 mr-1" /> Charging
                                  </span>
                                  <span className="font-medium">{car.chargingTime}h (10-100%)</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
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
