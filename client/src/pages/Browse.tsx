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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Battery, Car, Heart, Search, Zap, Save, Bookmark, GitCompare, X, CalendarPlus, Images, Store, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TestDriveBookingDialog from "@/components/TestDriveBookingDialog";
import RecentlyViewed from "@/components/RecentlyViewed";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Browse() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDealer, setSelectedDealer] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [rangeFilter, setRangeFilter] = useState([0, 400]);
  const [mileageFilter, setMileageFilter] = useState([0, 100000]);
  const [condition, setCondition] = useState<"all" | "new" | "used">("all");
  const [drivetrainFilter, setDrivetrainFilter] = useState<string[]>([]);
  const [rebeccaReviewedOnly, setRebeccaReviewedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  // Save search dialog state
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  
  // Comparison state
  const [compareIds, setCompareIds] = useState<number[]>([]);
  
  // Load comparison IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("compareVehicles");
    if (stored) {
      try {
        setCompareIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse compare vehicles:", e);
      }
    }
  }, []);
  
  const toggleCompare = (carId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let newIds: number[];
    if (compareIds.includes(carId)) {
      newIds = compareIds.filter(id => id !== carId);
    } else {
      if (compareIds.length >= 4) {
        toast.error("You can compare up to 4 vehicles at a time");
        return;
      }
      newIds = [...compareIds, carId];
    }
    
    setCompareIds(newIds);
    localStorage.setItem("compareVehicles", JSON.stringify(newIds));
  };

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

  // Saved searches
  const { data: savedSearches } = trpc.savedSearches.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const saveSearchMutation = trpc.savedSearches.save.useMutation({
    onSuccess: () => {
      toast.success("Search saved successfully!");
      setSaveSearchOpen(false);
      setSearchName("");
    },
    onError: () => {
      toast.error("Failed to save search. Please try again.");
    },
  });
  const deleteSearchMutation = trpc.savedSearches.delete.useMutation({
    onSuccess: () => {
      toast.success("Search deleted successfully!");
    },
  });
  const utils = trpc.useUtils();

  // Favorites
  const { data: favoritesList } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });
  const favoritedIds = new Set((favoritesList ?? []).map((f: any) => f.favorite?.carId ?? f.car?.id));
  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => { utils.favorites.list.invalidate(); toast.success('Added to favourites'); },
    onError: () => toast.error('Failed to save favourite'),
  });
  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => { utils.favorites.list.invalidate(); toast.success('Removed from favourites'); },
  });
  const toggleFavorite = (carId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) { toast.info('Sign in to save favourites'); return; }
    if (favoritedIds.has(carId)) {
      removeFavoriteMutation.mutate({ carId });
    } else {
      addFavoriteMutation.mutate({ carId });
    }
  };

  // Fetch dealers for filter
  const { data: dealersList } = trpc.dealers.listForFilter.useQuery();

  // Fetch cars with filters
  const { data: cars, isLoading } = trpc.cars.list.useQuery({
    make: selectedMake && selectedMake !== 'all_makes' ? selectedMake : undefined,
    model: selectedModel || undefined,
    dealerId: selectedDealer && selectedDealer !== 'all_dealers' ? parseInt(selectedDealer) : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
    minRange: rangeFilter[0] > 0 ? rangeFilter[0] : undefined,
    maxRange: rangeFilter[1] < 400 ? rangeFilter[1] : undefined,
    minMileage: mileageFilter[0] > 0 ? mileageFilter[0] : undefined,
    maxMileage: mileageFilter[1] < 100000 ? mileageFilter[1] : undefined,
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
    let result = cars;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(car => 
        car.make.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.description?.toLowerCase().includes(term)
      );
    }

    if (drivetrainFilter.length > 0) {
      result = result.filter(car => car.drivetrainType && drivetrainFilter.includes(car.drivetrainType));
    }

    if (rebeccaReviewedOnly) {
      result = result.filter(car => !!car.rebeccaReview);
    }
    
    return result;
  }, [cars, searchTerm, drivetrainFilter, rebeccaReviewedOnly]);

  // Sort cars
  const sortedCars = useMemo(() => {
    if (!filteredCars) return [];
    const sorted = [...filteredCars];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = a.price ? parseFloat(a.price) : Infinity;
          const priceB = b.price ? parseFloat(b.price) : Infinity;
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = a.price ? parseFloat(a.price) : -Infinity;
          const priceB = b.price ? parseFloat(b.price) : -Infinity;
          return priceB - priceA;
        });
      case 'mileage-low':
        return sorted.sort((a, b) => {
          const mileageA = a.mileage || Infinity;
          const mileageB = b.mileage || Infinity;
          return mileageA - mileageB;
        });
      case 'range-high':
        return sorted.sort((a, b) => {
          const rangeA = a.realRange || a.range || -Infinity;
          const rangeB = b.realRange || b.range || -Infinity;
          return rangeB - rangeA;
        });
      case 'newest':
      default:
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
    }
  }, [filteredCars, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil((sortedCars?.length || 0) / itemsPerPage);
  const paginatedCars = useMemo(() => {
    if (!sortedCars) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCars.slice(startIndex, endIndex);
  }, [sortedCars, currentPage, itemsPerPage]);

  // Save search handler
  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for your search");
      return;
    }
    
    const searchParams = {
      make: selectedMake && selectedMake !== 'all_makes' ? selectedMake : undefined,
      model: selectedModel || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
      minRange: rangeFilter[0] > 0 ? rangeFilter[0] : undefined,
      maxRange: rangeFilter[1] < 400 ? rangeFilter[1] : undefined,
      minMileage: mileageFilter[0] > 0 ? mileageFilter[0] : undefined,
      maxMileage: mileageFilter[1] < 100000 ? mileageFilter[1] : undefined,
      condition: condition === "all" ? undefined : condition,
      sortBy,
    };
    
    saveSearchMutation.mutate({
      name: searchName,
      searchParams,
    });
  };
  
  // Load saved search
  const handleLoadSearch = (search: any) => {
    const params = search.searchParams;
    if (params.make) setSelectedMake(params.make);
    if (params.model) setSelectedModel(params.model);
    if (params.minPrice || params.maxPrice) {
      setPriceRange([params.minPrice || 0, params.maxPrice || 100000]);
    }
    if (params.minRange || params.maxRange) {
      setRangeFilter([params.minRange || 0, params.maxRange || 400]);
    }
    if (params.minMileage || params.maxMileage) {
      setMileageFilter([params.minMileage || 0, params.maxMileage || 100000]);
    }
    if (params.condition) setCondition(params.condition);
    if (params.sortBy) setSortBy(params.sortBy);
    toast.success(`Loaded search: ${search.name}`);
  };

  // Mobile filter panel toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMake, selectedModel, priceRange, rangeFilter, condition, searchTerm, drivetrainFilter, rebeccaReviewedOnly]);

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
          
          {/* Recently Viewed Section */}
          <RecentlyViewed />

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <aside className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
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

                  {/* Dealer */}
                  <div>
                    <Label>Dealer</Label>
                    <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                      <SelectTrigger>
                        <SelectValue placeholder="All dealers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_dealers">All dealers</SelectItem>
                        {dealersList?.map((dealer: any) => (
                          <SelectItem key={dealer.id} value={dealer.id.toString()}>
                            {dealer.name} ({dealer.vehicleCount})
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

                  {/* Mileage Filter */}
                  <div>
                    <Label>
                      Mileage: {mileageFilter[0].toLocaleString()} - {mileageFilter[1].toLocaleString()} miles
                    </Label>
                    <Slider
                      min={0}
                      max={100000}
                      step={5000}
                      value={mileageFilter}
                      onValueChange={setMileageFilter}
                      className="mt-2"
                    />
                  </div>

                  {/* Rebecca Reviewed Filter */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="rounded border-border accent-primary w-4 h-4"
                        checked={rebeccaReviewedOnly}
                        onChange={(e) => setRebeccaReviewedOnly(e.target.checked)}
                      />
                      <span className="text-sm font-medium text-violet-600">⭐ Rebecca Reviewed only</span>
                    </label>
                  </div>

                  {/* Drivetrain Type Filter */}
                  <div>
                    <Label className="mb-2 block">Drivetrain Type</Label>
                    <div className="space-y-2">
                      {([
                        { value: 'BEV', label: '⚡ Battery Electric (BEV)', color: 'text-green-600' },
                        { value: 'PHEV', label: '🔌 Plug-in Hybrid (PHEV)', color: 'text-blue-600' },
                        { value: 'HEV', label: '🔋 Hybrid (HEV)', color: 'text-yellow-600' },
                        { value: 'MHEV', label: '⚙️ Mild Hybrid (MHEV)', color: 'text-orange-500' },
                      ] as const).map(({ value, label, color }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="rounded border-border accent-primary w-4 h-4"
                            checked={drivetrainFilter.includes(value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDrivetrainFilter(prev => [...prev, value]);
                              } else {
                                setDrivetrainFilter(prev => prev.filter(v => v !== value));
                              }
                            }}
                          />
                          <span className={`text-sm font-medium ${color}`}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Save Search */}
                  {isAuthenticated && (
                    <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          Save Search
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Current Search</DialogTitle>
                          <DialogDescription>
                            Save your current filters and sorting preferences to quickly access them later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="search-name">Search Name</Label>
                            <Input
                              id="search-name"
                              placeholder="e.g., Budget EVs under £30k"
                              value={searchName}
                              onChange={(e) => setSearchName(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSaveSearchOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSearch} disabled={saveSearchMutation.isPending}>
                            {saveSearchMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Saved Searches */}
                  {isAuthenticated && savedSearches && savedSearches.length > 0 && (
                    <div className="space-y-2">
                      <Label>My Saved Searches</Label>
                      <div className="space-y-2">
                        {savedSearches.map((search) => (
                          <div key={search.id} className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start"
                              onClick={() => handleLoadSearch(search)}
                            >
                              <Bookmark className="mr-2 h-3 w-3" />
                              {search.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                deleteSearchMutation.mutate({ id: search.id });
                                utils.savedSearches.list.invalidate();
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                      setMileageFilter([0, 100000]);
                      setCondition("all");
                      setDrivetrainFilter([]);
                      setRebeccaReviewedOnly(false);
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
                  <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedCars.length)} of {sortedCars.length} vehicles
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Sort by:</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                            <SelectItem value="range-high">Range: Longest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedCars.map((car) => (
                      <Card key={car.id} className="hover:shadow-lg transition-shadow cursor-pointer h-full" onClick={() => navigate(`/cars/${car.id}`)}>
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
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="rounded-full"
                                onClick={(e) => toggleFavorite(car.id, e)}
                                title={favoritedIds.has(car.id) ? 'Remove from favourites' : 'Add to favourites'}
                              >
                                <Heart className={`h-4 w-4 ${favoritedIds.has(car.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                              <Button
                                size="icon"
                                variant={compareIds.includes(car.id) ? "default" : "secondary"}
                                className="rounded-full"
                                onClick={(e) => toggleCompare(car.id, e)}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {car.condition && (
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                  {car.condition === 'new' ? 'New' : 'Used'}
                                </span>
                              )}
                              {car.drivetrainType === 'BEV' && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> BEV
                                </span>
                              )}
                              {car.drivetrainType === 'PHEV' && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                  🔌 PHEV
                                </span>
                              )}
                              {car.drivetrainType && car.drivetrainType !== 'BEV' && car.drivetrainType !== 'PHEV' && (
                                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                                  {car.drivetrainType}
                                </span>
                              )}
                              {car.dealerClawCarId && (
                                <span className="px-2 py-0.5 bg-purple-700 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                  🐾 DealerClaw
                                </span>
                              )}
                              {car.rebeccaReview && (
                                <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                  ⭐ Rebecca Reviewed
                                </span>
                              )}
                            </div>
                            {car.images && car.images.length > 1 && (
                              <div className="absolute bottom-2 left-2">
                                <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                  <Images className="w-3 h-3" />
                                  {car.images.length}
                                </span>
                              </div>
                            )}
                          </div>
                          <CardHeader>
                            <CardTitle className="line-clamp-1">
                              {car.make} {car.model}
                            </CardTitle>
                            <CardDescription className="flex items-center justify-between">
                              <span>{car.year && <span>{car.year}</span>}</span>
                              {car.dealerName && (
                                <Badge variant="secondary" className="text-xs">
                                  <Store className="w-3 h-3 mr-1" />
                                  {car.dealerName}
                                </Badge>
                              )}
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
                              {car.rebeccaReview && (() => {
                                try {
                                  const review = JSON.parse(car.rebeccaReview);
                                  const hook = review?.openingHook;
                                  const fallback = review?.finalVerdict?.oneLineSummary || review?.finalVerdict?.rebeccaVerdict || review?.verdict || review?.summary;
                                  const text = hook || fallback;
                                  if (!text) return null;
                                  // Show first sentence of hook as teaser
                                  const teaser = hook
                                    ? (text.split(/\.\s/)[0] + '.').replace(/^"|"$/g, '')
                                    : text;
                                  return (
                                    <p className="text-xs italic text-amber-700 dark:text-amber-400 line-clamp-2 pt-0.5 flex items-start gap-1">
                                      <span className="flex-shrink-0">😆</span>
                                      <span>&ldquo;{teaser}&rdquo;</span>
                                    </p>
                                  );
                                } catch { return null; }
                              })()}
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
                              {car.mileage && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center">
                                    <Car className="w-4 h-4 mr-1" /> Mileage
                                  </span>
                                  <span className="font-medium">{car.mileage.toLocaleString()} miles</span>
                                </div>
                              )}
                            </div>
                            {car.dealerId && (
                              <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                                <TestDriveBookingDialog
                                  carId={car.id}
                                  dealerId={car.dealerId}
                                  carName={`${car.year} ${car.make} ${car.model}`}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
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
      
      {/* Floating Comparison Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-lg border-t z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitCompare className="h-5 w-5" />
                <span className="font-semibold">
                  {compareIds.length} vehicle{compareIds.length !== 1 ? 's' : ''} selected for comparison
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCompareIds([]);
                    localStorage.removeItem("compareVehicles");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Link href="/compare">
                  <Button variant="secondary" size="sm" disabled={compareIds.length < 2}>
                    Compare Now ({compareIds.length}/4)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
