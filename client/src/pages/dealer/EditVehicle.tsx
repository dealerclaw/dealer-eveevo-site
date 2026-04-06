import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload, X, Loader2, Search, CheckCircle2 } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import InspectionReportsUpload from "@/components/InspectionReportsUpload";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function EditVehicle() {
  const params = useParams<{ id: string }>();
  const vehicleId = parseInt(params.id || '0');
  const [, navigate] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    condition: "used" as "new" | "used",
    bodyType: "",
    color: "",
    fuelType: "Electric",
    transmission: "Automatic",
    batteryCapacity: "",
    realRange: "",
    chargingTime: "",
    acceleration: "",
    topSpeed: "",
    power: "",
    mainImage: "",
    images: [] as string[],
    description: "",
    features: "",
    vin: "",
    registrationNumber: "",
    marketplace: "consumer" as "consumer" | "dealer_only",
    isAuction: false,
    startingBid: "",
    reservePrice: "",
    buyNowPrice: "",
    conditionNotes: "",
    rebeccaReview: "",
  });

  const [evdbVehicleId, setEvdbVehicleId] = useState<number | null>(null);
  const [vrmInput, setVrmInput] = useState("");
  const [vrmLookupEnabled, setVrmLookupEnabled] = useState(false);

  const { data: vehicle, isLoading: vehicleLoading } = trpc.cars.getById.useQuery({ id: vehicleId });

  // VRM lookup query
  const vrmQuery = trpc.dealer.lookupVrm.useQuery(
    { vrm: vrmInput.replace(/\s/g, "").toUpperCase() },
    { enabled: vrmLookupEnabled && vrmInput.length >= 2, retry: false }
  );

  useEffect(() => {
    if (!vrmLookupEnabled) return;
    if (vrmQuery.isSuccess) {
      setVrmLookupEnabled(false);
      const data = vrmQuery.data as any;
      if (data?.evdbVehicleId) {
        setEvdbVehicleId(data.evdbVehicleId);
        toast.success(`Linked to EV Database: ${data.make} ${data.model}`);
      } else {
        toast.info("No EV Database match found for this VRM");
      }
    }
    if (vrmQuery.isError) {
      setVrmLookupEnabled(false);
      toast.error("VRM lookup failed \u2014 check the registration and try again");
    }
  }, [vrmQuery.isSuccess, vrmQuery.isError, vrmLookupEnabled]);

  const updateMutation = trpc.dealer.updateVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      navigate("/dealer/inventory");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle");
    },
  });

  // Load vehicle data and evdbVehicleId into form when available
  useEffect(() => {
    if (vehicle) {
      if ((vehicle as any).evdbVehicleId) setEvdbVehicleId((vehicle as any).evdbVehicleId);
      setFormData({
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year?.toString() || "",
        price: vehicle.price?.toString() || "",
        mileage: vehicle.mileage?.toString() || "",
        condition: (vehicle.condition as "new" | "used") || "used",
        bodyType: vehicle.bodyType || "",
        color: vehicle.color || "",
        fuelType: vehicle.fuelType || "Electric",
        transmission: vehicle.transmission || "Automatic",
        batteryCapacity: vehicle.batteryCapacity?.toString() || "",
        realRange: vehicle.realRange?.toString() || "",
        chargingTime: vehicle.chargingTime || "",
        acceleration: vehicle.acceleration || "",
        topSpeed: vehicle.topSpeed?.toString() || "",
        power: vehicle.power?.toString() || "",
        mainImage: vehicle.mainImage || "",
        images: (vehicle.images as string[]) || [],
        description: vehicle.description || "",
        features: ((vehicle.features as string[]) || []).join(", "),
        vin: vehicle.vin || "",
        registrationNumber: vehicle.registrationNumber || "",
        marketplace: (vehicle.marketplace as "consumer" | "dealer_only") || "consumer",
        isAuction: vehicle.isAuction || false,
        startingBid: vehicle.startingBid?.toString() || "",
        reservePrice: vehicle.reservePrice?.toString() || "",
        buyNowPrice: vehicle.buyNowPrice?.toString() || "",
        conditionNotes: vehicle.conditionNotes || "",
        rebeccaReview: (vehicle as any).rebeccaReview || "",
      });
    }
  }, [vehicle]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        // Upload to server endpoint that handles S3 upload
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      if (isMain && uploadedUrls.length > 0) {
        setFormData((prev) => ({ ...prev, mainImage: uploadedUrls[0] }));
      } else {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
      }

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload images");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.make || !formData.model) {
      toast.error("Make and Model are required");
      return;
    }

    // Validate dealer marketplace fields
    if (formData.marketplace === "dealer_only") {
      if (!formData.startingBid || !formData.reservePrice || !formData.buyNowPrice) {
        toast.error("Starting bid, reserve price, and buy now price are required for dealer marketplace");
        return;
      }
      const starting = parseFloat(formData.startingBid);
      const reserve = parseFloat(formData.reservePrice);
      const buyNow = parseFloat(formData.buyNowPrice);
      if (reserve < starting) {
        toast.error("Reserve price must be greater than or equal to starting bid");
        return;
      }
      if (buyNow < reserve) {
        toast.error("Buy now price must be greater than or equal to reserve price");
        return;
      }
    }

    // Convert string numbers to actual numbers
    const submitData: any = {
      make: formData.make,
      model: formData.model,
      condition: formData.condition,
      fuelType: formData.fuelType,
      transmission: formData.transmission,
      mainImage: formData.mainImage || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      description: formData.description || undefined,
      vin: formData.vin || undefined,
      registrationNumber: formData.registrationNumber || undefined,
      marketplace: formData.marketplace,
    };

    // Add auction fields for dealer marketplace
    if (formData.marketplace === "dealer_only") {
      submitData.isAuction = true;
      submitData.startingBid = parseFloat(formData.startingBid);
      submitData.reservePrice = parseFloat(formData.reservePrice);
      submitData.buyNowPrice = parseFloat(formData.buyNowPrice);
    }

    // Add optional numeric fields
    if (formData.year) submitData.year = parseInt(formData.year);
    if (formData.price) submitData.price = parseFloat(formData.price);
    if (formData.mileage) submitData.mileage = parseInt(formData.mileage);
    if (formData.batteryCapacity) submitData.batteryCapacity = parseFloat(formData.batteryCapacity);
    if (formData.realRange) submitData.realRange = parseInt(formData.realRange);
    if (formData.topSpeed) submitData.topSpeed = parseInt(formData.topSpeed);
    if (formData.power) submitData.power = parseInt(formData.power);

    // Add optional string fields
    if (formData.bodyType) submitData.bodyType = formData.bodyType;
    if (formData.color) submitData.color = formData.color;
    if (formData.chargingTime) submitData.chargingTime = formData.chargingTime;
    if (formData.acceleration) submitData.acceleration = formData.acceleration;
    if (formData.conditionNotes) submitData.conditionNotes = formData.conditionNotes;

    // Parse features
    if (formData.features) {
      submitData.features = formData.features.split(",").map((f) => f.trim()).filter(Boolean);
    }

    if (evdbVehicleId) submitData.evdbVehicleId = evdbVehicleId;
    if (formData.rebeccaReview.trim()) {
      try {
        JSON.parse(formData.rebeccaReview);
        (submitData as any).rebeccaReview = formData.rebeccaReview.trim();
      } catch {
        // invalid JSON — skip silently
      }
    } else {
      (submitData as any).rebeccaReview = null;
    }
    updateMutation.mutate({ id: vehicleId, ...submitData });
  };

  return (
    <DealerLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-muted-foreground">Update vehicle information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Marketplace Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
              <CardDescription>Choose where to list this vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketplace">List On</Label>
                <Select
                  value={formData.marketplace}
                  onValueChange={(value) => handleInputChange("marketplace", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumer">Consumer Marketplace (Public)</SelectItem>
                    <SelectItem value="dealer_only">Dealer-to-Dealer Marketplace</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.marketplace === "consumer" 
                    ? "Vehicle will be visible to public consumers"
                    : "Vehicle will only be visible to subscribed dealers"}
                </p>
              </div>

              {formData.marketplace === "dealer_only" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold">Auction Settings</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingBid">Starting Bid (£) *</Label>
                      <Input
                        id="startingBid"
                        type="number"
                        value={formData.startingBid}
                        onChange={(e) => handleInputChange("startingBid", e.target.value)}
                        placeholder="20000"
                        required={formData.marketplace === "dealer_only"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reservePrice">Reserve Price (£) *</Label>
                      <Input
                        id="reservePrice"
                        type="number"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange("reservePrice", e.target.value)}
                        placeholder="25000"
                        required={formData.marketplace === "dealer_only"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum price you'll accept
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyNowPrice">Buy Now Price (£) *</Label>
                      <Input
                        id="buyNowPrice"
                        type="number"
                        value={formData.buyNowPrice}
                        onChange={(e) => handleInputChange("buyNowPrice", e.target.value)}
                        placeholder="30000"
                        required={formData.marketplace === "dealer_only"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Instant purchase price
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VRM Lookup — EV Database Link */}
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Search className="h-5 w-5" /> EV Database Link
              </CardTitle>
              <CardDescription>
                Look up this car's registration to link it to the EV Database and show the BEV/PHEV badge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {evdbVehicleId ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Linked to EV Database (ID: {evdbVehicleId})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-6"
                    onClick={() => setEvdbVehicleId(null)}
                  >
                    Remove link
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter registration e.g. AB23 EVC"
                    value={vrmInput}
                    onChange={(e) => setVrmInput(e.target.value)}
                    className="max-w-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setVrmLookupEnabled(true);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVrmLookupEnabled(true)}
                    disabled={vrmQuery.isFetching || vrmInput.length < 2}
                  >
                    {vrmQuery.isFetching ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking up…</>
                    ) : (
                      <><Search className="mr-2 h-4 w-4" /> Look Up VRM</>
                    )}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Linking to the EV Database adds the ⚡ BEV / 🔌 PHEV badge to this listing and enables the "View Full EV Specs" button for buyers.
              </p>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential vehicle details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => handleInputChange("make", e.target.value)}
                    placeholder="Tesla"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    placeholder="Model 3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    placeholder="2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleInputChange("condition", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="35000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange("mileage", e.target.value)}
                    placeholder="15000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="Pearl White"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body Type</Label>
                  <Input
                    id="bodyType"
                    value={formData.bodyType}
                    onChange={(e) => handleInputChange("bodyType", e.target.value)}
                    placeholder="Sedan"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>EV performance and battery details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batteryCapacity">Battery Capacity (kWh)</Label>
                  <Input
                    id="batteryCapacity"
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacity}
                    onChange={(e) => handleInputChange("batteryCapacity", e.target.value)}
                    placeholder="75.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="realRange">Real Range (miles)</Label>
                  <Input
                    id="realRange"
                    type="number"
                    value={formData.realRange}
                    onChange={(e) => handleInputChange("realRange", e.target.value)}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chargingTime">Fast Charge Time (min, 10-80%)</Label>
                  <Input
                    id="chargingTime"
                    value={formData.chargingTime}
                    onChange={(e) => handleInputChange("chargingTime", e.target.value)}
                    placeholder="27"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceleration">0-60 mph (seconds)</Label>
                  <Input
                    id="acceleration"
                    value={formData.acceleration}
                    onChange={(e) => handleInputChange("acceleration", e.target.value)}
                    placeholder="5.3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topSpeed">Top Speed (mph)</Label>
                  <Input
                    id="topSpeed"
                    type="number"
                    value={formData.topSpeed}
                    onChange={(e) => handleInputChange("topSpeed", e.target.value)}
                    placeholder="140"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="power">Power (hp)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={formData.power}
                    onChange={(e) => handleInputChange("power", e.target.value)}
                    placeholder="283"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Input
                    id="transmission"
                    value={formData.transmission}
                    onChange={(e) => handleInputChange("transmission", e.target.value)}
                    placeholder="Automatic"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Upload vehicle images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainImage">Main Image</Label>
                <div className="flex items-center gap-4">
                  {formData.mainImage ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={formData.mainImage}
                        alt="Main"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setFormData((prev) => ({ ...prev, mainImage: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-2">Upload</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Images</Label>
                <div className="flex flex-wrap gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative w-32 h-32">
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Description, features, and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the vehicle condition, history, and highlights..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => handleInputChange("features", e.target.value)}
                  placeholder="Autopilot, Premium Audio, Glass Roof, Heated Seats"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionNotes">Condition Notes</Label>
                <Textarea
                  id="conditionNotes"
                  value={formData.conditionNotes}
                  onChange={(e) => handleInputChange("conditionNotes", e.target.value)}
                  placeholder="Document any cosmetic issues, mechanical notes, service history details, or other condition-related information..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Detailed condition notes help buyers make informed decisions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleInputChange("vin", e.target.value)}
                    placeholder="5YJ3E1EA1KF123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                    placeholder="AB12 CDE"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspection Reports */}
          <InspectionReportsUpload 
            carId={vehicleId} 
            existingReports={vehicle?.inspectionReports || []}
          />

          {/* Rebecca Review */}
          <Card className="border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <span>⭐</span> Rebecca Review (Optional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste the AI-generated Rebecca review JSON here. This will display a detailed review panel on the car listing.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="rebeccaReview">Review JSON</Label>
                <textarea
                  id="rebeccaReview"
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.rebeccaReview}
                  onChange={(e) => handleInputChange("rebeccaReview", e.target.value)}
                  placeholder='{"verdict": "Best used EV under £35k if you charge at home", "rating": 8, ...}'
                />
                {formData.rebeccaReview && (() => {
                  try { JSON.parse(formData.rebeccaReview); return <p className="text-xs text-green-600">✓ Valid JSON</p>; }
                  catch { return <p className="text-xs text-red-500">✗ Invalid JSON — please check the format</p>; }
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={updateMutation.isPending || uploading}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Vehicle"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dealer/inventory")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DealerLayout>
  );
}
