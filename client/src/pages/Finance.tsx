import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, TrendingUp, Shield, Clock, 
  CheckCircle2, ArrowRight, Calculator, Sparkles 
} from "lucide-react";

export default function Finance() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Free Credit Score Check</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Free Credit Score</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Check your eligibility for EV finance in minutes. No impact on your credit score. 
            Instant decision. No sign-in required.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/finance-check")}
            className="text-lg px-8 py-6"
          >
            Check Your Score Now - It's Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            ✓ Takes only 2 minutes  ✓ No sign-in needed  ✓ Soft credit check only
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Clock className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Instant Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get your credit score and pre-approval decision in under 60 seconds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle>No Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Soft credit check only - won't affect your credit score at all
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Best Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Access competitive APR rates from 6.9% with flexible terms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="w-10 h-10 text-primary mb-2" />
              <CardTitle>No Sign-In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start your check immediately - no account creation required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">How It Works</CardTitle>
            <CardDescription>Simple 3-step process to get your free credit score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Your Details</h3>
                <p className="text-sm text-muted-foreground">
                  Provide basic information - name, date of birth, address, and employment details
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Instant Credit Check</h3>
                <p className="text-sm text-muted-foreground">
                  We perform a soft credit check with Evolution Funding - no impact on your score
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Your Score</h3>
                <p className="text-sm text-muted-foreground">
                  See your credit score and pre-approval amount instantly - browse EVs within your budget
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Finance Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Contract Purchase (PCP)</CardTitle>
                <CardDescription>Most popular option</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Lower monthly payments with a final balloon payment. Option to return, 
                  part-exchange, or keep the vehicle at the end.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Flexible end-of-term options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Lower monthly payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Upgrade to new EV easily</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hire Purchase (HP)</CardTitle>
                <CardDescription>Own the car at the end</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fixed monthly payments over an agreed term. You own the vehicle 
                  outright once all payments are made.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Fixed interest rate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Guaranteed ownership</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>No mileage restrictions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Loan</CardTitle>
                <CardDescription>Flexible and simple</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Borrow a fixed amount and own the vehicle from day one. 
                  Full flexibility with no restrictions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Immediate ownership</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>No restrictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    <span>Competitive rates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="text-center p-12 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader>
            <CardTitle className="text-3xl mb-4">Ready to Find Your Perfect EV?</CardTitle>
            <CardDescription className="text-lg">
              Get your free credit score and see how much you can borrow in just 2 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              onClick={() => setLocation("/finance-check")}
              className="text-lg px-8 py-6"
            >
              Start Your Free Credit Check
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              Powered by Evolution Funding • FCA Regulated • Soft Search Only
            </p>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Will this affect my credit score?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No. We perform a soft credit check which is only visible to you and won't 
                  impact your credit score. Only a full application creates a hard search.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need to sign in?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No sign-in required! You can start your credit check immediately and get 
                  your score without creating an account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does it take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The entire process takes about 2 minutes to complete the form, and you'll 
                  get your credit score and decision instantly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What information do I need?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Just basic details: name, date of birth, address, employment status, and 
                  income. No documents needed for the initial check.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
