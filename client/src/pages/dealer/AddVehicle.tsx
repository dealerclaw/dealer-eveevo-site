import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload, X, Loader2 } from "lucide-react";
import DealerLayout from "@/components/DealerLayout";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AddVehicle() {
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
  });

  const addMutation = trpc.dealer.addVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle added successfully");
      navigate("/dealer/inventory");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add vehicle");
    },
  });

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
    };

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

    // Parse features
    if (formData.features) {
      submitData.features = formData.features.split(",").map((f) => f.trim()).filter(Boolean);
    }

    addMutation.mutate(submitData);
  };

  return (
    <DealerLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Add Vehicle</h1>
          <p className="text-muted-foreground">Add a new vehicle to your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={addMutation.isPending || uploading}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Vehicle"
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
