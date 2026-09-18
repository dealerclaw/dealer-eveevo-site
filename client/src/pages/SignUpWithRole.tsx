import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Store, ArrowLeft } from 'lucide-react';
import { GoogleButton } from '@/components/GoogleButton';

export default function SignUpWithRole() {
  const [selectedRole, setSelectedRole] = useState<'consumer' | 'dealer' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const role = selectedRole === 'dealer' ? 'dealer' : 'user';
  const accountType = selectedRole === 'dealer' ? 'business' : 'individual';
  const afterSignUpUrl = selectedRole === 'dealer' ? '/dealer/dashboard' : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role, accountType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Sign up failed');
        return;
      }
      window.location.href = afterSignUpUrl;
    } catch {
      setError('Sign up failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1 — Role selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <img src="/eveevo-logo.png" alt="EVEEVO" className="h-10 mx-auto mb-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Browse thousands of EVs from verified dealers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Compare specs and get instant finance quotes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Reserve vehicles and manage your favourites
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
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
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary border-green-200"
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
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    List your inventory and reach thousands of buyers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Access dealer-to-dealer marketplace and auctions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Track inventory health and get pricing insights
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    Manage reservations and customer communications
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700" size="lg">
                  Continue as Dealer
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <a href="/sign-in" className="text-green-600 hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </div>
    );
  }

  // Step 2 — Clerk sign-up form (role already chosen)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back button — subtle, at the top */}
        <button
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to role selection
        </button>

        <div className="text-center mb-6">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedRole === 'dealer' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {selectedRole === 'dealer'
              ? <Store className="w-6 h-6 text-green-600" />
              : <User className="w-6 h-6 text-blue-600" />
            }
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedRole === 'dealer' ? 'Dealer' : 'Consumer'} Sign Up
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <GoogleButton
            href={`/api/auth/google?returnTo=${encodeURIComponent(afterSignUpUrl)}&role=${role}&accountType=${accountType}`}
            label="Sign up with Google"
          />

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                {selectedRole === 'dealer' ? 'Dealership name' : 'Full name'}
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              className={`w-full ${selectedRole === 'dealer' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
