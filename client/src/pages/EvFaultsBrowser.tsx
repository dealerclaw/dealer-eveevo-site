import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, ThumbsUp, Plus, Wrench, Battery, Zap, Car, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  battery: Battery,
  charging: Zap,
  motor_drivetrain: Car,
  brakes: AlertCircle,
  suspension: Wrench,
  electrical: Zap,
  infotainment: AlertCircle,
  hvac: AlertCircle,
  body_trim: Car,
  safety_systems: AlertTriangle,
  software: AlertCircle,
  other: AlertCircle,
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const frequencyColors: Record<string, string> = {
  rare: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  occasional: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  common: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  very_common: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function EvFaultsBrowser() {

  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedFault, setSelectedFault] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch makes
  const { data: makes, isLoading: makesLoading } = trpc.dealer.getAllFaultMakes.useQuery();

  // Fetch models when make is selected
  const { data: models, isLoading: modelsLoading } = trpc.dealer.getAllFaultModels.useQuery(
    { make: selectedMake },
    { enabled: !!selectedMake }
  );

  // Fetch faults when make is selected
  const { data: faults, isLoading: faultsLoading, refetch: refetchFaults } = trpc.dealer.getFaultsByModel.useQuery(
    { make: selectedMake, model: selectedModel || undefined },
    { enabled: !!selectedMake }
  );

  // Fetch contributions for selected fault
  const { data: contributions } = trpc.dealer.getFaultContributions.useQuery(
    { faultId: selectedFault?.id },
    { enabled: !!selectedFault }
  );

  // Mark helpful mutation
  const markHelpful = trpc.dealer.markFaultHelpful.useMutation({
    onSuccess: () => {
      toast.success("Marked as helpful", {
        description: "Thank you for your feedback!",
      });
      refetchFaults();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleMarkHelpful = (faultId: number) => {
    markHelpful.mutate({ faultId });
  };

  const formatCost = (min?: string | number | null, max?: string | number | null) => {
    if (!min && !max) return "Cost varies";
    if (min && max) return `£${min} - £${max}`;
    if (min) return `From £${min}`;
    return `Up to £${max}`;
  };

  const CategoryIcon = selectedFault ? categoryIcons[selectedFault.category] || AlertCircle : AlertCircle;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">EV Faults Database</h1>
        <p className="text-muted-foreground">
          Browse common problems and solutions for electric vehicles. Contribute your own experience to help other dealers.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Faults</CardTitle>
          <CardDescription>Select a make and optionally a model to view known faults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Select value={selectedMake} onValueChange={(value) => {
                setSelectedMake(value);
                setSelectedModel("");
                setSelectedFault(null);
              }}>
                <SelectTrigger id="make">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {makesLoading && <SelectItem value="loading">Loading...</SelectItem>}
                  {makes?.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">Model (Optional)</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All models</SelectItem>
                  {modelsLoading && <SelectItem value="loading">Loading...</SelectItem>}
                  {models?.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={!selectedMake}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Fault Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Fault Report</DialogTitle>
                    <DialogDescription>
                      Share a fault you've encountered with {selectedMake} {selectedModel || "vehicles"}
                    </DialogDescription>
                  </DialogHeader>
                  <AddFaultForm
                    make={selectedMake}
                    model={selectedModel}
                    onSuccess={() => {
                      setShowAddDialog(false);
                      refetchFaults();
      toast.success("Fault report added", {
        description: "Thank you for contributing to the database!",
      });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedMake && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faults List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {faultsLoading ? "Loading..." : `${faults?.length || 0} Known Faults`}
            </h2>
            
            {faultsLoading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading faults...
                </CardContent>
              </Card>
            )}

            {!faultsLoading && faults?.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No faults found for this selection.
                </CardContent>
              </Card>
            )}

            {faults?.map((fault) => {
              const Icon = categoryIcons[fault.category] || AlertCircle;
              return (
                <Card
                  key={fault.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedFault?.id === fault.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedFault(fault)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{fault.problemTitle}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">{fault.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={severityColors[fault.severity]}>
                        {fault.severity}
                      </Badge>
                      <Badge className={frequencyColors[fault.frequency]}>
                        {fault.frequency.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">
                        {fault.category.replace("_", " ")}
                      </Badge>
                      {(fault.helpfulCount ?? 0) > 0 && (
                        <Badge variant="secondary">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {fault.helpfulCount ?? 0}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Fault Details */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            {selectedFault ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon className="h-6 w-6 text-primary" />
                    <CardTitle>{selectedFault.problemTitle}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={severityColors[selectedFault.severity]}>
                      {selectedFault.severity}
                    </Badge>
                    <Badge className={frequencyColors[selectedFault.frequency]}>
                      {selectedFault.frequency.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">
                      {selectedFault.category.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedFault.description}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Symptoms</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedFault.symptoms}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Resolution</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedFault.resolution}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Estimated Cost</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCost(selectedFault.estimatedCostMin, selectedFault.estimatedCostMax)}
                      </p>
                    </div>
                    {selectedFault.laborHours && (
                      <div>
                        <h3 className="font-semibold mb-1">Labor Hours</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedFault.laborHours} hours
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedFault.yearFrom && (
                    <div>
                      <h3 className="font-semibold mb-1">Affected Years</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedFault.yearFrom}
                        {selectedFault.yearTo ? ` - ${selectedFault.yearTo}` : "+"}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkHelpful(selectedFault.id)}
                      disabled={markHelpful.isPending}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Mark Helpful ({selectedFault.helpfulCount ?? 0})
                    </Button>
                    <AddContributionDialog
                      faultId={selectedFault.id}
                      faultTitle={selectedFault.problemTitle}
                      onSuccess={() => refetchFaults()}
                    />
                  </div>

                  {contributions && contributions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3">Dealer Contributions ({contributions.length})</h3>
                        <div className="space-y-3">
                          {contributions.map((contrib) => (
                            <div key={contrib.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {contrib.contributionType.replace("_", " ")}
                                </Badge>
                                {(contrib.helpfulCount ?? 0) > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {contrib.helpfulCount ?? 0}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-line">{contrib.content}</p>
                              {contrib.actualCost && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Actual cost: £{contrib.actualCost}
                                  {contrib.actualLaborHours && ` | ${contrib.actualLaborHours} hours`}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a fault to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Add Fault Form Component
function AddFaultForm({ make, model, onSuccess }: { make: string; model: string; onSuccess: () => void }) {

  const [formData, setFormData] = useState({
    problemTitle: "",
    description: "",
    symptoms: "",
    resolution: "",
    category: "other" as any,
    severity: "medium" as any,
    frequency: "occasional" as any,
    estimatedCostMin: "",
    estimatedCostMax: "",
    laborHours: "",
    yearFrom: "",
    yearTo: "",
  });

  const addFault = trpc.dealer.addFaultReport.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFault.mutate({
      make,
      model: model || make,
      problemTitle: formData.problemTitle,
      description: formData.description,
      symptoms: formData.symptoms,
      resolution: formData.resolution,
      category: formData.category,
      severity: formData.severity,
      frequency: formData.frequency,
      estimatedCostMin: formData.estimatedCostMin ? parseFloat(formData.estimatedCostMin) : undefined,
      estimatedCostMax: formData.estimatedCostMax ? parseFloat(formData.estimatedCostMax) : undefined,
      laborHours: formData.laborHours ? parseFloat(formData.laborHours) : undefined,
      yearFrom: formData.yearFrom ? parseInt(formData.yearFrom) : undefined,
      yearTo: formData.yearTo ? parseInt(formData.yearTo) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="problemTitle">Problem Title *</Label>
        <Input
          id="problemTitle"
          value={formData.problemTitle}
          onChange={(e) => setFormData({ ...formData, problemTitle: e.target.value })}
          placeholder="e.g., 12V Battery Failure"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the problem..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="symptoms">Symptoms *</Label>
        <Textarea
          id="symptoms"
          value={formData.symptoms}
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          placeholder="What the driver/dealer will notice..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="resolution">Resolution *</Label>
        <Textarea
          id="resolution"
          value={formData.resolution}
          onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
          placeholder="How to fix or mitigate the problem..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="battery">Battery</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="motor_drivetrain">Motor/Drivetrain</SelectItem>
              <SelectItem value="brakes">Brakes</SelectItem>
              <SelectItem value="suspension">Suspension</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="infotainment">Infotainment</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="body_trim">Body/Trim</SelectItem>
              <SelectItem value="safety_systems">Safety Systems</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="severity">Severity *</Label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as any })}>
            <SelectTrigger id="severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="occasional">Occasional</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="very_common">Very Common</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="costMin">Min Cost (£)</Label>
          <Input
            id="costMin"
            type="number"
            value={formData.estimatedCostMin}
            onChange={(e) => setFormData({ ...formData, estimatedCostMin: e.target.value })}
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="costMax">Max Cost (£)</Label>
          <Input
            id="costMax"
            type="number"
            value={formData.estimatedCostMax}
            onChange={(e) => setFormData({ ...formData, estimatedCostMax: e.target.value })}
            placeholder="1000"
          />
        </div>

        <div>
          <Label htmlFor="laborHours">Labor Hours</Label>
          <Input
            id="laborHours"
            type="number"
            step="0.5"
            value={formData.laborHours}
            onChange={(e) => setFormData({ ...formData, laborHours: e.target.value })}
            placeholder="2.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearFrom">Year From</Label>
          <Input
            id="yearFrom"
            type="number"
            value={formData.yearFrom}
            onChange={(e) => setFormData({ ...formData, yearFrom: e.target.value })}
            placeholder="2018"
          />
        </div>

        <div>
          <Label htmlFor="yearTo">Year To</Label>
          <Input
            id="yearTo"
            type="number"
            value={formData.yearTo}
            onChange={(e) => setFormData({ ...formData, yearTo: e.target.value })}
            placeholder="2022 (leave empty for ongoing)"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={addFault.isPending}>
        {addFault.isPending ? "Adding..." : "Add Fault Report"}
      </Button>
    </form>
  );
}

// Add Contribution Dialog Component
function AddContributionDialog({ faultId, faultTitle, onSuccess }: { faultId: number; faultTitle: string; onSuccess: () => void }) {

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    contributionType: "additional_solution" as any,
    content: "",
    actualCost: "",
    actualLaborHours: "",
  });

  const addContribution = trpc.dealer.addFaultContribution.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
      toast.success("Contribution added", {
        description: "Thank you for sharing your experience!",
      });
      setFormData({
        contributionType: "additional_solution",
        content: "",
        actualCost: "",
        actualLaborHours: "",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContribution.mutate({
      faultId,
      contributionType: formData.contributionType,
      content: formData.content,
      actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
      actualLaborHours: formData.actualLaborHours ? parseFloat(formData.actualLaborHours) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Your Experience
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Your Experience</DialogTitle>
          <DialogDescription>
            Share your experience with: {faultTitle}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contributionType">Contribution Type *</Label>
            <Select value={formData.contributionType} onValueChange={(value) => setFormData({ ...formData, contributionType: value as any })}>
              <SelectTrigger id="contributionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="additional_solution">Additional Solution</SelectItem>
                <SelectItem value="cost_update">Cost Update</SelectItem>
                <SelectItem value="symptom_clarification">Symptom Clarification</SelectItem>
                <SelectItem value="alternative_fix">Alternative Fix</SelectItem>
                <SelectItem value="parts_recommendation">Parts Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Your Experience *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your experience, solution, or recommendation..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actualCost">Actual Cost (£)</Label>
              <Input
                id="actualCost"
                type="number"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                placeholder="500"
              />
            </div>

            <div>
              <Label htmlFor="actualLaborHours">Labor Hours</Label>
              <Input
                id="actualLaborHours"
                type="number"
                step="0.5"
                value={formData.actualLaborHours}
                onChange={(e) => setFormData({ ...formData, actualLaborHours: e.target.value })}
                placeholder="2.5"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={addContribution.isPending}>
            {addContribution.isPending ? "Adding..." : "Add Contribution"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
