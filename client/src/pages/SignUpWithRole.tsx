import { SignUp, useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Store } from 'lucide-react';

export default function SignUpWithRole() {
  const [selectedRole, setSelectedRole] = useState<'consumer' | 'dealer' | null>(null);
  const { signUp } = useSignUp();

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Join EVEEVO</h1>
            <p className="text-lg text-gray-600">Choose how you'd like to use our platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Consumer Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={() => setSelectedRole('consumer')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">I'm a Consumer</CardTitle>
                <CardDescription className="text-base">
                  Looking to buy an electric vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Browse thousands of EVs from verified dealers
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Compare specs and get instant finance quotes
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Reserve vehicles and manage your favorites
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Access EV fault database and reviews
                  </li>
                </ul>
                <Button className="w-full mt-6" size="lg">
                  Continue as Consumer
                </Button>
              </CardContent>
            </Card>

            {/* Dealer Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={() => setSelectedRole('dealer')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">I'm a Dealer</CardTitle>
                <CardDescription className="text-base">
                  Selling electric vehicles to consumers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    List your inventory and reach thousands of buyers
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Access dealer-to-dealer marketplace and auctions
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Track inventory health and get pricing insights
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Manage reservations and customer communications
                  </li>
                </ul>
                <Button className="w-full mt-6" size="lg">
                  Continue as Dealer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedRole === 'consumer' ? 'Consumer' : 'Dealer'} Sign Up
          </h1>
          <p className="text-gray-600">Create your account to get started</p>
          <Button 
            variant="link" 
            onClick={() => setSelectedRole(null)}
            className="mt-2"
          >
            ← Change role
          </Button>
        </div>
        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
          unsafeMetadata={{
            role: selectedRole,
            accountType: selectedRole
          }}
        />
      </div>
    </div>
  );
}
