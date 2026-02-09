import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Battery, Car, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LifestyleSearch() {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    dailyMileage: 30,
    primaryUse: "mixed" as "city" | "highway" | "mixed",
    passengers: 4,
    budget: 30000,
    chargingAccess: "home" as "home" | "public" | "both",
    priorities: [] as ("range" | "performance" | "space" | "price" | "luxury")[],
    bodyType: [] as string[],
  });

  const [showResults, setShowResults] = useState(false);

  const { data: results, isLoading } = trpc.lifestyle.search.useQuery(preferences, {
    enabled: showResults,
  });

  const handleSearch = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setPreferences({
      dailyMileage: 30,
      primaryUse: "mixed",
      passengers: 4,
      budget: 30000,
      chargingAccess: "home",
      priorities: [],
      bodyType: [],
    });
    setShowResults(false);
    setStep(1);
  };

  const togglePriority = (priority: typeof preferences.priorities[number]) => {
    setPreferences(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const toggleBodyType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      bodyType: prev.bodyType.includes(type)
        ? prev.bodyType.filter(t => t !== type)
        : [...prev.bodyType, type],
    }));
  };

  if (showResults) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Your Perfect EV Matches</h1>
                  <p className="text-xl text-muted-foreground">
                    Based on your lifestyle preferences
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline">
                  Start New Search
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : results ? (
              <div className="space-y-8">
                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center text-primary">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Recommendations for You
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Tabs for New vs Used */}
                <Tabs defaultValue="used" className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="used">
                      Used EVs ({results.usedCars?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="new">
                      New EVs ({results.newCars?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="used" className="mt-6">
                    {results.usedCars && results.usedCars.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.usedCars.map((car) => (
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
                                <div className="absolute top-2 left-2">
                                  <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                                    Used
                                  </span>
                                </div>
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
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg text-muted-foreground">
                            No used vehicles match your preferences
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="new" className="mt-6">
                    {results.newCars && results.newCars.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.newCars.map((car, idx) => (
                          <Card key={idx} className="hover:shadow-lg transition-shadow h-full">
                            <div className="relative h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                              <Car className="w-20 h-20 text-primary" />
                              <div className="absolute top-2 left-2">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                  New
                                </span>
                              </div>
                            </div>
                            <CardHeader>
                              <CardTitle className="line-clamp-1">
                                {car.Vehicle_Make} {car.Vehicle_Model}
                              </CardTitle>
                              <CardDescription className="line-clamp-1">
                                {car.Vehicle_Variant}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                {car.Price_From && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">From</span>
                                    <span className="font-semibold text-lg text-primary">
                                      £{car.Price_From.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {(car.Range_WLTP || car.Range_Real) && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center">
                                      <Battery className="w-4 h-4 mr-1" /> Range
                                    </span>
                                    <span className="font-medium">
                                      {car.Range_WLTP || car.Range_Real} miles
                                    </span>
                                  </div>
                                )}
                                {car.Battery_Capacity && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Battery</span>
                                    <span className="font-medium">{car.Battery_Capacity} kWh</span>
                                  </div>
                                )}
                                {car.Acceleration_0_100 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">0-60mph</span>
                                    <span className="font-medium">{car.Acceleration_0_100}s</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg text-muted-foreground">
                            No new vehicles match your preferences
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Lifestyle Search</h1>
            <p className="text-xl text-muted-foreground">
              Answer a few questions to find your perfect electric or hybrid vehicle from 54,000+ listings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tell Us About Your Lifestyle</CardTitle>
              <CardDescription>
                We'll match you with EVs and hybrids from both new and used inventory (54,000+ vehicles)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Daily Mileage */}
              <div>
                <Label htmlFor="mileage">Daily Mileage (miles)</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={preferences.dailyMileage}
                  onChange={(e) => setPreferences(prev => ({ ...prev, dailyMileage: parseInt(e.target.value) || 0 }))}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How many miles do you typically drive per day?
                </p>
              </div>

              {/* Primary Use */}
              <div>
                <Label>Primary Use</Label>
                <RadioGroup
                  value={preferences.primaryUse}
                  onValueChange={(value: any) => setPreferences(prev => ({ ...prev, primaryUse: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="city" id="city" />
                    <Label htmlFor="city" className="font-normal">City driving</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="highway" id="highway" />
                    <Label htmlFor="highway" className="font-normal">Highway/motorway</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed" className="font-normal">Mixed driving</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Passengers */}
              <div>
                <Label htmlFor="passengers">Number of Passengers</Label>
                <Input
                  id="passengers"
                  type="number"
                  value={preferences.passengers}
                  onChange={(e) => setPreferences(prev => ({ ...prev, passengers: parseInt(e.target.value) || 0 }))}
                  className="mt-2"
                />
              </div>

              {/* Budget */}
              <div>
                <Label htmlFor="budget">Maximum Budget (£)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={preferences.budget}
                  onChange={(e) => setPreferences(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                  className="mt-2"
                />
              </div>

              {/* Charging Access */}
              <div>
                <Label>Charging Access</Label>
                <RadioGroup
                  value={preferences.chargingAccess}
                  onValueChange={(value: any) => setPreferences(prev => ({ ...prev, chargingAccess: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home" className="font-normal">Home charging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="font-normal">Public charging only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal">Both home and public</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Priorities */}
              <div>
                <Label>What's Most Important? (Select all that apply)</Label>
                <div className="mt-2 space-y-2">
                  {[
                    { value: "range", label: "Long range" },
                    { value: "performance", label: "Performance & speed" },
                    { value: "space", label: "Interior space" },
                    { value: "price", label: "Affordability" },
                    { value: "luxury", label: "Luxury features" },
                  ].map((priority) => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={priority.value}
                        checked={preferences.priorities.includes(priority.value as any)}
                        onCheckedChange={() => togglePriority(priority.value as any)}
                      />
                      <Label htmlFor={priority.value} className="font-normal">
                        {priority.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div>
                <Label>Preferred Body Type (Optional)</Label>
                <div className="mt-2 space-y-2">
                  {["SUV", "Sedan", "Hatchback", "Crossover", "MPV"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={preferences.bodyType.includes(type)}
                        onCheckedChange={() => toggleBodyType(type)}
                      />
                      <Label htmlFor={type} className="font-normal">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSearch} size="lg" className="w-full">
                Find My Perfect EV <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
