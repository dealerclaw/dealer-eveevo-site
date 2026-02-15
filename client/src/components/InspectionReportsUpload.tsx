import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface InspectionReport {
  url: string;
  name: string;
  type: string;
  uploadedAt: string;
}

interface InspectionReportsUploadProps {
  carId: number;
  existingReports?: InspectionReport[];
}

export default function InspectionReportsUpload({ carId, existingReports = [] }: InspectionReportsUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<InspectionReport[]>(existingReports);

  const utils = trpc.useUtils();

  const uploadMutation = trpc.dealer.uploadInspectionReport.useMutation({
    onSuccess: (data) => {
      setReports([...reports, data.report]);
      toast.success("Inspection report uploaded successfully");
      utils.dealer.getMyInventory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload report");
      setUploading(false);
    },
  });

  const deleteMutation = trpc.dealer.deleteInspectionReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      utils.dealer.getMyInventory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await uploadMutation.mutateAsync({
          carId,
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
        });
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload file");
      setUploading(false);
    }

    // Reset input
    e.target.value = "";
  };

  const handleDelete = async (reportUrl: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    setReports(reports.filter(r => r.url !== reportUrl));
    await deleteMutation.mutateAsync({ carId, reportUrl });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Inspection Reports
        </CardTitle>
        <CardDescription>
          Upload HPI checks, battery health certificates, and other inspection documents (PDF only, max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload button */}
        <div>
          <Label htmlFor="inspection-upload" className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground">HPI check, battery health, inspection report</p>
                </div>
              )}
            </div>
          </Label>
          <Input
            id="inspection-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {/* Existing reports */}
        {reports.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Reports</Label>
            {reports.map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">PDF</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(report.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(report.url)}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {reports.length === 0 && !uploading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No inspection reports uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
