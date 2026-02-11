import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface FinanceFormData {
  // Personal Details
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  mobileNumber: string;
  
  // Address
  accommodationType: string;
  timeAtPropertyYears: number;
  timeAtPropertyMonths: number;
  address: string;
  postcode: string;
  
  // Driving License
  licenceType: string;
  
  // Personal Info
  maritalStatus: string;
  
  // Employment
  employmentStatus: string;
  areaOfEmployment: string;
  annualGrossIncome: number;
  employerName: string;
  employerTownCity: string;
  timeAtEmployerYears: number;
  timeAtEmployerMonths: number;
  
  // Affordability
  affordabilityConfirmed: boolean;
  
  // Vehicle details (optional)
  carId?: number;
  vehiclePrice?: number;
  deposit?: number;
  term?: number;
}

export default function FinanceCheck() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const carId = searchParams.get("carId");
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FinanceFormData>({
    title: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    mobileNumber: "",
    accommodationType: "",
    timeAtPropertyYears: 0,
    timeAtPropertyMonths: 0,
    address: "",
    postcode: "",
    licenceType: "",
    maritalStatus: "",
    employmentStatus: "",
    areaOfEmployment: "",
    annualGrossIncome: 0,
    employerName: "",
    employerTownCity: "",
    timeAtEmployerYears: 0,
    timeAtEmployerMonths: 0,
    affordabilityConfirmed: false,
    carId: carId ? parseInt(carId) : undefined,
  });
  
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  
  const lookupAddress = trpc.finance.lookupAddress.useQuery(
    { postcode: postcodeSearch },
    { enabled: false }
  );
  
  const submitCreditCheck = trpc.finance.submitCreditCheck.useMutation();
  const [creditResult, setCreditResult] = useState<any>(null);
  
  const handlePostcodeLookup = async () => {
    if (!postcodeSearch) {
      toast.error("Please enter a postcode");
      return;
    }
    
    const result = await lookupAddress.refetch();
    if (result.data && result.data.length > 0) {
      setAddresses(result.data);
      toast.success(`Found ${result.data.length} addresses`);
    } else {
      toast.error("No addresses found for this postcode");
    }
  };
  
  const handleAddressSelect = (address: any) => {
    setFormData({
      ...formData,
      address: address.fullAddress,
      postcode: address.postcode,
    });
    setAddresses([]);
  };
  
  const updateField = (field: keyof FinanceFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.title || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.email || !formData.mobileNumber || !formData.address || !formData.postcode) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (step === 2) {
      if (!formData.employmentStatus || !formData.areaOfEmployment || !formData.annualGrossIncome || !formData.employerName || !formData.employerTownCity) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (step === 3) {
      if (!formData.affordabilityConfirmed) {
        toast.error("Please confirm you can afford the payments");
        return;
      }
    }
    
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = async () => {
    try {
      const result = await submitCreditCheck.mutateAsync(formData);
      setCreditResult(result);
      setStep(5);
      
      if (result.success) {
        toast.success("Credit check completed successfully!");
      } else {
        toast.error("Credit check failed. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to submit credit check");
      console.error(error);
    }
  };
  
  return (
    <div className="container max-w-4xl py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Personal</span>
          <span>Employment</span>
          <span>Affordability</span>
          <span>Review</span>
          <span>Result</span>
        </div>
      </div>
      
      {/* Step 1: Personal Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Please provide your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Select value={formData.title} onValueChange={(v) => updateField("title", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Miss">Miss</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="licenceType">Driving Licence *</Label>
                <Select value={formData.licenceType} onValueChange={(v) => updateField("licenceType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select licence type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full UK">Full UK</SelectItem>
                    <SelectItem value="Provisional">Provisional</SelectItem>
                    <SelectItem value="International">International</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY) *</Label>
              <Input
                id="dateOfBirth"
                placeholder="DD/MM/YYYY"
                value={formData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) => updateField("mobileNumber", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <Select value={formData.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Civil Partnership">Civil Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Address Details</h3>
              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter postcode"
                  value={postcodeSearch}
                  onChange={(e) => setPostcodeSearch(e.target.value)}
                />
                <Button onClick={handlePostcodeLookup} disabled={lookupAddress.isFetching}>
                  {lookupAddress.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find Address"}
                </Button>
              </div>
              
              {addresses.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto border rounded-md">
                  {addresses.map((addr, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-2 hover:bg-muted"
                      onClick={() => handleAddressSelect(addr)}
                    >
                      {addr.fullAddress}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => updateField("postcode", e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="accommodationType">Accommodation Type *</Label>
                  <Select value={formData.accommodationType} onValueChange={(v) => updateField("accommodationType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accommodation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Tenant">Tenant</SelectItem>
                      <SelectItem value="Living with Parents">Living with Parents</SelectItem>
                      <SelectItem value="Council Tenant">Council Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeAtPropertyYears">Years at Address *</Label>
                    <Input
                      id="timeAtPropertyYears"
                      type="number"
                      value={formData.timeAtPropertyYears}
                      onChange={(e) => updateField("timeAtPropertyYears", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeAtPropertyMonths">Months at Address *</Label>
                    <Input
                      id="timeAtPropertyMonths"
                      type="number"
                      value={formData.timeAtPropertyMonths}
                      onChange={(e) => updateField("timeAtPropertyMonths", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button onClick={nextStep}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 2: Employment Information */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
            <CardDescription>Please provide your employment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employmentStatus">Employment Status *</Label>
              <Select value={formData.employmentStatus} onValueChange={(v) => updateField("employmentStatus", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Self Employed">Self Employed</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="areaOfEmployment">Area of Employment *</Label>
              <Input
                id="areaOfEmployment"
                placeholder="e.g., IT, Healthcare, Education"
                value={formData.areaOfEmployment}
                onChange={(e) => updateField("areaOfEmployment", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="annualGrossIncome">Annual Gross Income (£) *</Label>
              <Input
                id="annualGrossIncome"
                type="number"
                value={formData.annualGrossIncome}
                onChange={(e) => updateField("annualGrossIncome", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="employerName">Employer Name *</Label>
              <Input
                id="employerName"
                value={formData.employerName}
                onChange={(e) => updateField("employerName", e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="employerTownCity">Employer Town/City *</Label>
              <Input
                id="employerTownCity"
                value={formData.employerTownCity}
                onChange={(e) => updateField("employerTownCity", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeAtEmployerYears">Years at Employer *</Label>
                <Input
                  id="timeAtEmployerYears"
                  type="number"
                  value={formData.timeAtEmployerYears}
                  onChange={(e) => updateField("timeAtEmployerYears", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="timeAtEmployerMonths">Months at Employer *</Label>
                <Input
                  id="timeAtEmployerMonths"
                  type="number"
                  value={formData.timeAtEmployerMonths}
                  onChange={(e) => updateField("timeAtEmployerMonths", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 3: Affordability Declaration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Affordability Declaration</CardTitle>
            <CardDescription>Please confirm you can afford the payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-6 bg-muted/50">
              <h3 className="font-semibold mb-4">Important Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                By proceeding with this finance application, you confirm that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>All information provided is accurate and complete</li>
                <li>You can afford the monthly payments</li>
                <li>You understand this is a credit check that may affect your credit score</li>
                <li>You authorize us to share your information with our finance partners</li>
              </ul>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="affordability"
                checked={formData.affordabilityConfirmed}
                onCheckedChange={(checked) => updateField("affordabilityConfirmed", checked)}
              />
              <label
                htmlFor="affordability"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm I can afford the monthly payments and agree to the terms above *
              </label>
            </div>
            
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={nextStep}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Application</CardTitle>
            <CardDescription>Please review your information before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Personal Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Name:</div>
                <div>{formData.title} {formData.firstName} {formData.lastName}</div>
                <div className="text-muted-foreground">Date of Birth:</div>
                <div>{formData.dateOfBirth}</div>
                <div className="text-muted-foreground">Email:</div>
                <div>{formData.email}</div>
                <div className="text-muted-foreground">Mobile:</div>
                <div>{formData.mobileNumber}</div>
                <div className="text-muted-foreground">Address:</div>
                <div>{formData.address}, {formData.postcode}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Employment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Status:</div>
                <div>{formData.employmentStatus}</div>
                <div className="text-muted-foreground">Employer:</div>
                <div>{formData.employerName}</div>
                <div className="text-muted-foreground">Annual Income:</div>
                <div>£{formData.annualGrossIncome.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitCreditCheck.isPending}>
                {submitCreditCheck.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Credit Check"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 5: Credit Score Result */}
      {step === 5 && creditResult && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Check Result</CardTitle>
            <CardDescription>Your application has been processed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              {creditResult.success ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Credit Check Complete</h2>
                  {creditResult.creditScore && (
                    <div className="text-center mb-4">
                      <p className="text-muted-foreground">Your Credit Score</p>
                      <p className="text-5xl font-bold text-primary">{creditResult.creditScore}</p>
                    </div>
                  )}
                  {creditResult.preApproved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-green-800 font-semibold">You are pre-approved for finance!</p>
                      {creditResult.validUntil && (
                        <p className="text-sm text-green-600 mt-1">Valid until: {creditResult.validUntil}</p>
                      )}
                    </div>
                  )}
                  {creditResult.applicationReference && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Reference: {creditResult.applicationReference}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-red-500 mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Application Unsuccessful</h2>
                  <p className="text-muted-foreground text-center">
                    {creditResult.message || "Unfortunately, we were unable to approve your application at this time."}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex justify-center gap-2">
              <Button onClick={() => setLocation("/")}>
                Return to Home
              </Button>
              {carId && (
                <Button variant="outline" onClick={() => setLocation(`/cars/${carId}`)}>
                  View Vehicle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
