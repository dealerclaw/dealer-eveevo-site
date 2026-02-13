import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  Building2, CheckCircle2, Mail, Phone, MapPin, 
  Upload, FileText, ArrowRight, ArrowLeft, Check 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type OnboardingStep = 1 | 2 | 3 | 4;

export default function DealerOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: "",
    registrationNumber: "",
    vatNumber: "",
    
    // Step 2: Contact Details
    contactName: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    website: "",
    
    // Step 3: Location
    address: "",
    city: "",
    postcode: "",
    
    // Step 4: Additional Info
    description: "",
    yearsInBusiness: "",
    averageMonthlyInventory: "",
  });

  const [documents, setDocuments] = useState<{
    businessLicense?: File;
    insurance?: File;
  }>({});

  const applyMutation = trpc.dealer.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully! We'll review your application within 24-48 hours.");
      setLocation("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.businessName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    applyMutation.mutate({
      businessName: formData.businessName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      address: `${formData.address}, ${formData.city}, ${formData.postcode}`,
      description: formData.description,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'businessLicense' | 'insurance') => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(prev => ({ ...prev, [type]: file }));
      toast.success(`${type === 'businessLicense' ? 'Business License' : 'Insurance Certificate'} uploaded`);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Dealer Application</h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of 4
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: "Business Info" },
              { num: 2, label: "Contact Details" },
              { num: 3, label: "Location" },
              { num: 4, label: "Review & Submit" },
            ].map((step) => (
              <div
                key={step.num}
                className={`flex flex-col items-center ${
                  step.num <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                    step.num < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : step.num === currentStep
                      ? "border-primary"
                      : "border-muted"
                  }`}
                >
                  {step.num < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.num
                  )}
                </div>
                <span className="text-xs text-center hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Tell us about your dealership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Your Dealership Ltd"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Company Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vatNumber">VAT Number (if applicable)</Label>
                    <Input
                      id="vatNumber"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleChange}
                      placeholder="GB123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="yearsInBusiness">Years in Business</Label>
                    <Input
                      id="yearsInBusiness"
                      name="yearsInBusiness"
                      type="number"
                      value={formData.yearsInBusiness}
                      onChange={handleChange}
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessLicense">Business License / Certificate of Incorporation</Label>
                    <Input
                      id="businessLicense"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'businessLicense')}
                    />
                    {documents.businessLicense && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {documents.businessLicense.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="insurance">Motor Trade Insurance Certificate</Label>
                    <Input
                      id="insurance"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'insurance')}
                    />
                    {documents.insurance && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {documents.insurance.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                  <CardDescription>
                    How can customers reach you?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactName">Primary Contact Name *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@yourdealership.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01234 567890"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number (recommended)</Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      placeholder="07123 456789"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Customers can contact you directly via WhatsApp
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourdealership.com"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>
                    Where is your dealership located?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 High Street"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="London"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="SW1A 1AA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="averageMonthlyInventory">Average Monthly Inventory</Label>
                    <Input
                      id="averageMonthlyInventory"
                      name="averageMonthlyInventory"
                      type="number"
                      value={formData.averageMonthlyInventory}
                      onChange={handleChange}
                      placeholder="50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many vehicles do you typically have in stock?
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">About Your Dealership</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your dealership, specialties, and what makes you unique..."
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Application</CardTitle>
                  <CardDescription>
                    Please review your information before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Business Information
                    </h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Business Name:</dt>
                        <dd className="font-medium">{formData.businessName}</dd>
                      </div>
                      {formData.registrationNumber && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Registration Number:</dt>
                          <dd className="font-medium">{formData.registrationNumber}</dd>
                        </div>
                      )}
                      {formData.yearsInBusiness && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Years in Business:</dt>
                          <dd className="font-medium">{formData.yearsInBusiness}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Details
                    </h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Contact Name:</dt>
                        <dd className="font-medium">{formData.contactName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Email:</dt>
                        <dd className="font-medium">{formData.email}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Phone:</dt>
                        <dd className="font-medium">{formData.phone}</dd>
                      </div>
                      {formData.whatsappNumber && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">WhatsApp:</dt>
                          <dd className="font-medium">{formData.whatsappNumber}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Address:</dt>
                        <dd className="font-medium text-right">
                          {formData.address}, {formData.city}, {formData.postcode}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {documents.businessLicense || documents.insurance ? (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {documents.businessLicense && (
                          <li className="flex items-center gap-2 text-green-600">
                            <Check className="w-4 h-4" />
                            Business License: {documents.businessLicense.name}
                          </li>
                        )}
                        {documents.insurance && (
                          <li className="flex items-center gap-2 text-green-600">
                            <Check className="w-4 h-4" />
                            Insurance: {documents.insurance.name}
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : null}

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">What happens next?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>We'll review your application within 24-48 hours</li>
                      <li>You'll receive an email with your approval status</li>
                      <li>Once approved, you can start listing vehicles immediately</li>
                      <li>Access your dealer dashboard to manage inventory and leads</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="ml-auto"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
