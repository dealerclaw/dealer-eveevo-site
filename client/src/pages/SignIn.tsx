import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { useSearch } from 'wouter';

export default function SignIn() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const returnTo = params.get('returnTo');
  const afterSignInUrl = returnTo ? decodeURIComponent(returnTo) : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EVEEVO</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>
        <ClerkSignIn
          routing="virtual"
          signUpUrl="/sign-up"
          afterSignInUrl={afterSignInUrl}
          afterSignUpUrl={afterSignInUrl}
        />
      </div>
    </div>
  );
}
