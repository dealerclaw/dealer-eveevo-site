import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DealerLayout from "@/components/DealerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface VehicleRow {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  condition?: 'new' | 'used';
  bodyType?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  batteryCapacity?: number;
  realRange?: number;
  chargingTime?: string;
  acceleration?: string;
  topSpeed?: number;
  power?: number;
  description?: string;
  vin?: string;
  registrationNumber?: string;
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  const addVehicleMutation = trpc.dealer.addVehicle.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    
    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedVehicles = results.data as VehicleRow[];
        setVehicles(parsedVehicles);
        toast.success(`Parsed ${parsedVehicles.length} vehicles from CSV`);
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (vehicles.length === 0) {
      toast.error('No vehicles to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      
      try {
        await addVehicleMutation.mutateAsync({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: vehicle.price,
          mileage: vehicle.mileage,
          condition: vehicle.condition,
          bodyType: vehicle.bodyType,
          color: vehicle.color,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          batteryCapacity: vehicle.batteryCapacity,
          realRange: vehicle.realRange,
          chargingTime: vehicle.chargingTime,
          acceleration: vehicle.acceleration,
          topSpeed: vehicle.topSpeed,
          power: vehicle.power,
          description: vehicle.description,
          vin: vehicle.vin,
          registrationNumber: vehicle.registrationNumber,
        });
        
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      setProgress(((i + 1) / vehicles.length) * 100);
      setResults({ success: successCount, failed: failedCount, errors });
    }

    setUploading(false);
    
    if (failedCount === 0) {
      toast.success(`Successfully uploaded ${successCount} vehicles!`);
    } else {
      toast.warning(`Uploaded ${successCount} vehicles, ${failedCount} failed`);
    }
  };

  const downloadTemplate = () => {
    const template = `make,model,year,price,mileage,condition,bodyType,color,fuelType,transmission,batteryCapacity,realRange,chargingTime,acceleration,topSpeed,power,description,vin,registrationNumber
Tesla,Model 3,2023,35000,5000,used,Saloon,White,Electric,Automatic,75,300,30 min,3.1s,162,283,Long Range AWD with Autopilot,5YJ3E1EB1KF123456,AB12 CDE
BMW,i4,2024,50000,0,new,Saloon,Blue,Electric,Automatic,83.9,365,31 min,3.9s,140,335,eDrive40 M Sport,WBA11BF01PCG12345,CD34 EFG`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  return (
    <DealerLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Vehicle Upload</h1>
          <p className="text-muted-foreground">
            Upload multiple vehicles at once using a CSV file
          </p>
        </div>

        {/* Download Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              CSV Template
            </CardTitle>
            <CardDescription>
              Download the template to see the required format and example data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing your vehicle inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {file && vehicles.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Ready to upload {vehicles.length} vehicles
                  </AlertDescription>
                </Alert>
              )}

              {vehicles.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : `Upload ${vehicles.length} Vehicles`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {uploading && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(results.success > 0 || results.failed > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">{results.success} Successful</span>
                  </div>
                  {results.failed > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">{results.failed} Failed</span>
                    </div>
                  )}
                </div>

                {results.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Errors:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground max-h-60 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <p key={index} className="text-red-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DealerLayout>
  );
}
