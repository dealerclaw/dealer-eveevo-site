import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface FinanceCalculatorProps {
  vehiclePrice: number;
  carId?: number;
}

export default function FinanceCalculator({ vehiclePrice, carId }: FinanceCalculatorProps) {
  const [, setLocation] = useLocation();
  const [deposit, setDeposit] = useState(Math.round(vehiclePrice * 0.1)); // 10% default
  const [term, setTerm] = useState(48); // 48 months default
  const [apr, setApr] = useState(8.9); // Default APR
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    calculateMonthlyPayment();
  }, [deposit, term, apr, vehiclePrice]);

  const calculateMonthlyPayment = () => {
    const principal = vehiclePrice - deposit;
    const monthlyRate = apr / 100 / 12;
    const numPayments = term;

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numPayments);
    } else {
      const payment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      setMonthlyPayment(payment);
    }
  };

  const totalPayable = monthlyPayment * term + deposit;
  const totalInterest = totalPayable - vehiclePrice;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle>Finance Calculator</CardTitle>
        </div>
        <CardDescription>Estimate your monthly payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Price */}
        <div>
          <Label className="text-sm text-muted-foreground">Vehicle Price</Label>
          <p className="text-2xl font-bold">£{vehiclePrice.toLocaleString()}</p>
        </div>

        {/* Deposit */}
        <div className="space-y-2">
          <Label htmlFor="deposit">Deposit</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
            <Input
              id="deposit"
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="pl-7"
              min={0}
              max={vehiclePrice}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {((deposit / vehiclePrice) * 100).toFixed(0)}% of vehicle price
          </p>
        </div>

        {/* Term */}
        <div className="space-y-2">
          <Label htmlFor="term">Loan Term</Label>
          <Select value={term.toString()} onValueChange={(value) => setTerm(Number(value))}>
            <SelectTrigger id="term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 months (2 years)</SelectItem>
              <SelectItem value="36">36 months (3 years)</SelectItem>
              <SelectItem value="48">48 months (4 years)</SelectItem>
              <SelectItem value="60">60 months (5 years)</SelectItem>
              <SelectItem value="72">72 months (6 years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* APR */}
        <div className="space-y-2">
          <Label htmlFor="apr">Representative APR</Label>
          <div className="relative">
            <Input
              id="apr"
              type="number"
              value={apr}
              onChange={(e) => setApr(Number(e.target.value))}
              step="0.1"
              min={0}
              max={30}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Typical rates from 6.9% APR (subject to status)
          </p>
        </div>

        {/* Monthly Payment Result */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Estimated Monthly Payment</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            £{Math.round(monthlyPayment).toLocaleString()}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-2 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount to borrow</span>
            <span className="font-medium">£{(vehiclePrice - deposit).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total interest</span>
            <span className="font-medium">£{Math.round(totalInterest).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total payable</span>
            <span className="font-medium">£{Math.round(totalPayable).toLocaleString()}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => setLocation(`/finance-check${carId ? `?carId=${carId}` : ''}`)}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Get Pre-Approved Now
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          This is an estimate only. Final rates and payments subject to credit approval. 
          Representative APR may vary based on your credit score.
        </p>
      </CardContent>
    </Card>
  );
}
