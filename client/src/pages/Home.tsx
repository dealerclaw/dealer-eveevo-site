import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Battery, Car, DollarSign, Heart, MapPin, Search, Zap } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: featuredCars, isLoading } = trpc.cars.featured.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-32">
          <div className="container">
            <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Smart. Easy. <span className="text-primary">Electric</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Find your perfect electric vehicle from 54,000+ listings. Compare specs, get finance quotes, and reserve with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/browse">
                    Browse EVs <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg">
                  <Link href="/lifestyle-search">
                    Lifestyle Search <Zap className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* One-Click Filters */}
        <section className="py-12 border-b">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">Quick Search</h2>
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Body Type */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Body Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['SUV', 'Hatchback', 'Saloon', 'Estate', 'Coupe', 'MPV', 'Sports'].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/browse?bodyType=${type}`}>
                        {type}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Price Range</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Under £20k', max: 20000 },
                    { label: '£20k-£30k', min: 20000, max: 30000 },
                    { label: '£30k-£50k', min: 30000, max: 50000 },
                    { label: 'Over £50k', min: 50000 },
                  ].map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/browse?minPrice=${range.min || 0}&maxPrice=${range.max || 999999}`}>
                        {range.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Range */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Electric Range</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Under 150 miles', max: 150 },
                    { label: '150-250 miles', min: 150, max: 250 },
                    { label: '250-350 miles', min: 250, max: 350 },
                    { label: 'Over 350 miles', min: 350 },
                  ].map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/browse?minRange=${range.min || 0}&maxRange=${range.max || 999}`}>
                        <Battery className="w-3 h-3 mr-1" />
                        {range.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Special Features */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Special Features</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/browse?seats=7">
                      7 Seater
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/browse?fastCharging=true">
                      <Zap className="w-3 h-3 mr-1" />
                      Fast Charging
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/browse?performance=true">
                      Performance (0-60 &lt; 5s)
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/browse?segment=Luxury">
                      Luxury
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Options */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">How Do You Want to Search?</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <Link href="/browse">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Classic Search</CardTitle>
                    <CardDescription>
                      Filter by make, model, price, range, and location
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Perfect if you know what you're looking for. Use advanced filters to narrow down your options.
                    </p>
                    <Button variant="ghost" className="w-full">
                      Start Classic Search <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <Link href="/lifestyle-search">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Lifestyle Search</CardTitle>
                    <CardDescription>
                      Find EVs that match your lifestyle and needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Not sure where to start? Answer a few questions about your lifestyle and we'll recommend the perfect EV.
                    </p>
                    <Button variant="ghost" className="w-full">
                      Start Lifestyle Search <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Cars */}
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Electric Vehicles</h2>
              <Button asChild variant="outline">
                <Link href="/browse">
                  <a>View All</a>
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : featuredCars && featuredCars.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCars.slice(0, 6).map((car) => (
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
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-1">
                          {car.make} {car.model}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {car.year && <span>{car.year}</span>}
                          {car.condition && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                              {car.condition}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {car.price && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Price</span>
                              <span className="font-semibold text-lg">
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No featured cars available at the moment</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose EVEEVO?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">54,000+ EVs & Hybrids</h3>
                <p className="text-muted-foreground">
                  Largest selection of electric and hybrid vehicles in the UK
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Finance Options</h3>
                <p className="text-muted-foreground">
                  Get instant finance quotes and credit checks
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Dealers</h3>
                <p className="text-muted-foreground">
                  Connect with trusted dealers across the UK
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
                <p className="text-muted-foreground">
                  Rebecca AI helps you find the perfect EV
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Go Electric?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start your journey to sustainable driving today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/browse">
                  <a>Browse All EVs</a>
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link href="/browse">
                    <a>Create Account</a>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">EVEEVO</h3>
              <p className="text-sm text-muted-foreground">
                Smart, Easy, Electric EVs for everyone
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Browse</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse"><a className="text-muted-foreground hover:text-foreground">All EVs</a></Link></li>
                <li><Link href="/dealers"><a className="text-muted-foreground hover:text-foreground">Dealers</a></Link></li>
                <li><Link href="/compare"><a className="text-muted-foreground hover:text-foreground">Compare</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/finance"><a className="text-muted-foreground hover:text-foreground">Finance</a></Link></li>
                <li><Link href="/lifestyle-search"><a className="text-muted-foreground hover:text-foreground">Lifestyle Search</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://eveevo.uk/privacy/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
                <li><a href="https://eveevo.uk/idd/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EVEEVO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
