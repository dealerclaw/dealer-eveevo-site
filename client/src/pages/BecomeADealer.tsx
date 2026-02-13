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
import { Building2, CheckCircle2, Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export default function BecomeADealer() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });

  const applyMutation = trpc.dealer.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully! We'll review your application and get back to you soon.");
      setLocation("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Become a Dealer</h1>
            <p className="text-xl text-muted-foreground">
              Join EVEEVO's network of trusted electric vehicle dealers
            </p>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Building2 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Expand Your Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access thousands of potential buyers actively searching for electric vehicles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Verified Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build trust with verified dealer status and professional listing tools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Lead Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track inquiries, manage inventory, and analyze performance from one dashboard
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription>
                Complete our simple 4-step application process and start selling on EVEEVO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => setLocation("/dealer/onboarding")}>
                Start Your Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Takes only 5-10 minutes to complete
              </p>
            </CardContent>
          </Card>

          {/* Old Quick Contact Form */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Dealer Application</CardTitle>
              <CardDescription>
                Fill out the form below to apply to become a verified dealer on EVEEVO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      placeholder="Your dealership name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="contact@dealership.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+44 20 1234 5678"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="Full business address"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tell us about your dealership *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Describe your dealership, years in business, number of vehicles, etc."
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={applyMutation.isPending} className="flex-1">
                    {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
