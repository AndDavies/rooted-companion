import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signup } from '../login/actions'
import { User } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Dark Background */}
      <div className="bg-neutral-950 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-800 mb-6">
            <User className="w-10 h-10 text-neutral-300" />
          </div>
          <h2 className="text-xl font-serif text-neutral-200 mb-2">ROOTED Way</h2>
          <p className="text-neutral-400 text-sm max-w-sm">
            Begin your recovery journey with purpose
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white shadow-md rounded-xl border border-neutral-200 px-6 py-8">
            {/* Heading */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold text-neutral-900 mb-2">Create your account</h1>
              <p className="text-sm text-neutral-600">
                Start your transformation today
              </p>
            </div>

            {/* Error Message */}
            {searchParams.error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {searchParams.error}
              </div>
            )}
            
            {/* Form */}
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-neutral-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="transition-all duration-200"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="transition-all duration-200"
                  placeholder="••••••••"
                />
                <p className="text-xs text-neutral-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                formAction={signup} 
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-full transition-all duration-200"
                size="lg"
              >
                Sign up
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="text-neutral-900 hover:underline font-medium transition-all duration-200"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline transition-all duration-200"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
