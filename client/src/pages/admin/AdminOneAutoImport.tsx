import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

export default function AdminOneAutoImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const importData = trpc.dealer.importOneAutoData.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setImporting(false);
      toast.success("Import completed!");
    },
    onError: (error) => {
      toast.error(error.message);
      setImporting(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setImporting(true);
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      importData.mutate({
        fileData: base64.split(',')[1], // Remove data:...;base64, prefix
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">OneAuto Data Import</h1>
          <p className="text-muted-foreground">
            Upload OneAuto export file to update inventory health data (days on market, price changes)
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select the OneAuto export Excel or CSV file. The system will match vehicles by VIN or registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">OneAuto Export File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="mt-2"
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full"
              >
                {importing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Matched</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{results.matched || 0}</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Updated</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{results.updated || 0}</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium">Unmatched</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{results.unmatched || 0}</div>
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Errors encountered:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {results.errors.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully. Inventory health ratings have been recalculated.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Expected File Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The OneAuto export file should contain the following columns:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[120px]">VIN or Reg:</span>
                <span className="text-muted-foreground">Vehicle identification (VIN or registration number)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[120px]">Days on Market:</span>
                <span className="text-muted-foreground">Number of days the vehicle has been listed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[120px]">Original Price:</span>
                <span className="text-muted-foreground">Initial listing price (optional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[120px]">Current Price:</span>
                <span className="text-muted-foreground">Current asking price (optional)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
