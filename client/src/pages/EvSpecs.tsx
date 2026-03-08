import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Gauge,
  Battery,
  Wind,
  Ruler,
  Car,
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EvSpecs() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const evdbId = parseInt(id ?? "0", 10);

  const { data: vehicle, isLoading, error } = trpc.dealer.getEvDbVehicle.useQuery(
    { evdbId },
    { enabled: evdbId > 0, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading EV specs...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium">EV not found in database</p>
          <p className="text-sm">ID {evdbId} was not found in the local EV Database.</p>
          <Button variant="outline" onClick={() => window.history.back()} className="mt-2 gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const images = (vehicle.images as string[] | null) ?? [];
  const mainImage = images[0] ?? null;

  const isAvailable = vehicle.availabilityStatus === 1;
  const availRange = [vehicle.availabilityDateFrom, vehicle.availabilityDateTo]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.close()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Close
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">EV Database Specs</span>
          </div>
          {vehicle.evdbDetailUrl && (
            <a
              href={vehicle.evdbDetailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              View on EV-Database.org <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-6">
          {mainImage && (
            <div className="md:w-2/5 shrink-0">
              <img
                src={mainImage}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full rounded-xl object-cover aspect-[4/3] bg-muted"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="flex flex-col gap-3 justify-center">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isAvailable ? "default" : "secondary"}>
                  {isAvailable ? "Currently Available" : "Discontinued"}
                </Badge>
                {vehicle.miscSegment && <Badge variant="outline">{vehicle.miscSegment}</Badge>}
                {vehicle.miscBody && <Badge variant="outline">{vehicle.miscBody}</Badge>}
              </div>
              <h1 className="text-3xl font-bold mt-2">
                {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.version && (
                <p className="text-lg text-muted-foreground">{vehicle.version}</p>
              )}
              {availRange && (
                <p className="text-sm text-muted-foreground mt-1">Available: {availRange}</p>
              )}
            </div>

            {/* Key stats hero row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 p-4 bg-muted/50 rounded-xl">
              {vehicle.rangeWltp && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{vehicle.rangeWltp}</div>
                  <div className="text-xs text-muted-foreground">WLTP Range (mi)</div>
                </div>
              )}
              {vehicle.rangeReal && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{vehicle.rangeReal}</div>
                  <div className="text-xs text-muted-foreground">Real Range (mi)</div>
                </div>
              )}
              {vehicle.batteryCapacityUseable && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{vehicle.batteryCapacityUseable}</div>
                  <div className="text-xs text-muted-foreground">Battery (kWh)</div>
                </div>
              )}
              {vehicle.fastchargePowerMax && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{vehicle.fastchargePowerMax}</div>
                  <div className="text-xs text-muted-foreground">Max Charge (kW)</div>
                </div>
              )}
            </div>

            {vehicle.priceFromUk && (
              <p className="text-sm text-muted-foreground">
                New from <span className="font-semibold text-foreground">£{vehicle.priceFromUk.toLocaleString()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Performance */}
        <Section title="Performance & Drivetrain" icon={Gauge}>
          <StatCard label="Power" value={vehicle.drivetrainPower} unit="kW" />
          <StatCard label="Power (HP)" value={vehicle.drivetrainPowerHp} unit="hp" />
          <StatCard label="Torque" value={vehicle.drivetrainTorque} unit="Nm" />
          <StatCard label="0–100 km/h" value={vehicle.performanceAcceleration} unit="s" />
          <StatCard label="Top Speed" value={vehicle.performanceTopspeed} unit="km/h" />
          <StatCard label="Drive Type" value={vehicle.drivetrainType} />
          <StatCard label="Propulsion" value={vehicle.drivetrainPropulsion} />
          <StatCard label="Seats" value={vehicle.miscSeats} />
        </Section>

        {/* Range */}
        <Section title="Range & Efficiency" icon={Wind}>
          <StatCard label="WLTP Range" value={vehicle.rangeWltp} unit="mi" />
          <StatCard label="Real Range" value={vehicle.rangeReal} unit="mi" />
          <StatCard label="Real Range (Hwy)" value={vehicle.rangeRealWHwy} unit="mi" />
          <StatCard label="Real Range (City)" value={vehicle.rangeRealWCty} unit="mi" />
          <StatCard label="Real Range (Combined)" value={vehicle.rangeRealWCmb} unit="mi" />
          <StatCard label="Efficiency" value={vehicle.efficiencyReal} unit="Wh/mi" />
          <StatCard label="Fuel Equivalent" value={vehicle.efficiencyRealFuelEqV} unit="mpg" />
        </Section>

        {/* Battery & Charging */}
        <Section title="Battery & Charging" icon={Battery}>
          <StatCard label="Useable Capacity" value={vehicle.batteryCapacityUseable} unit="kWh" />
          <StatCard label="Full Capacity" value={vehicle.batteryCapacityFull} unit="kWh" />
          <StatCard label="Fast Charge Plug" value={vehicle.fastchargePlug} />
          <StatCard label="Max Charge Power" value={vehicle.fastchargePowerMax} unit="kW" />
          <StatCard label="Avg Charge Power" value={vehicle.fastchargePowerAvg} unit="kW" />
          <StatCard label="Charge Time (10–80%)" value={vehicle.fastchargeChargeTime} unit="min" />
          <StatCard label="Charge Speed" value={vehicle.fastchargeChargeSpeed} unit="mi/min" />
          {vehicle.fastchargeOptional !== null && vehicle.fastchargeOptional !== undefined && (
            <StatCard label="Fast Charge" value={vehicle.fastchargeOptional ? "Optional" : "Standard"} />
          )}
        </Section>

        {/* Dimensions */}
        <Section title="Dimensions & Practicality" icon={Ruler}>
          <StatCard label="Length" value={vehicle.dimsLength} unit="mm" />
          <StatCard label="Width" value={vehicle.dimsWidth} unit="mm" />
          <StatCard label="Height" value={vehicle.dimsHeight} unit="mm" />
          <StatCard label="Wheelbase" value={vehicle.dimsWheelbase} unit="mm" />
          <StatCard label="Kerb Weight" value={vehicle.dimsWeight} unit="kg" />
          <StatCard label="GVWR" value={vehicle.dimsWeightGvwr} unit="kg" />
          <StatCard label="Boot Space" value={vehicle.dimsBootspace} unit="L" />
          <StatCard label="Boot (Seats Down)" value={vehicle.dimsBootspaceMax} unit="L" />
          <StatCard label="Frunk" value={vehicle.dimsBootspaceFrunk} unit="L" />
          {vehicle.dimsTowHitch !== null && vehicle.dimsTowHitch !== undefined && (
            <StatCard label="Tow Hitch" value={vehicle.dimsTowHitch ? "Available" : "Not available"} />
          )}
          {vehicle.dimsTowWeightBraked && (
            <StatCard label="Tow Weight (Braked)" value={vehicle.dimsTowWeightBraked} unit="kg" />
          )}
        </Section>

        {/* UK Tax / BIK */}
        {(vehicle.bikUkRate || vehicle.bikUkAmount || vehicle.bikUkYear) && (
          <Section title="UK Tax & BIK" icon={Car}>
            <StatCard label="BIK Year" value={vehicle.bikUkYear} />
            <StatCard label="BIK Rate" value={vehicle.bikUkRate} unit="%" />
            <StatCard label="BIK Amount (20% taxpayer)" value={vehicle.bikUkAmount ? `£${vehicle.bikUkAmount.toLocaleString()}` : null} />
          </Section>
        )}

        {/* Image gallery */}
        {images.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4 text-primary" />
                Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.slice(0, 12).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${vehicle.make} ${vehicle.model} ${i + 1}`}
                    className="w-full aspect-[4/3] object-cover rounded-lg bg-muted"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          Data sourced from <a href="https://ev-database.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">EV-Database.org</a>
          {vehicle.id && <span> · EV Database ID: {vehicle.id}</span>}
        </div>
      </div>
    </div>
  );
}
