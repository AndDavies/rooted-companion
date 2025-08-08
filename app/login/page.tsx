import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from './actions'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel - Branded Background */}
      <div
        className="relative p-8 text-neutral-900"
        style={{
          backgroundImage: "url('/images/login_left_image_rooted.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Light overlay for legibility without heavy darkening */}
        <div className="absolute inset-0 bg-white/20" />

        {/* Brand - top-left */}
        <div className="absolute z-20 top-6 left-6">
          <div className="text-neutral-900/90 bg-white/40 backdrop-blur-[1px] px-3 py-1.5 rounded-md inline-block">
            <span className="text-base sm:text-lg font-logo font-semibold">The ROOTED Companion</span>
          </div>
        </div>

        {/* Centered content (middle of panel) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-6 sm:px-0">
            <p className="text-sm sm:text-base text-neutral-900/90 leading-relaxed">
              Welcome to your calm, supportive space for better recovery and resilience. Build
              sustainable, stress‑reducing habits with gentle coaching guidance. One clear step each
              day, so you can feel more balanced—one day at a time.
            </p>

            {/* Supporting Graphic below copy */}
            <div className="mt-6 flex justify-center">
              <Image
                src="/images/login_screen_graphic_rooted.png"
                alt="ROOTED login illustration"
                width={640}
                height={360}
                className="w-full max-w-sm drop-shadow-sm"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white shadow-md rounded-xl border border-neutral-200 px-6 py-8">
            {/* Heading */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold text-neutral-900 mb-2">Welcome back</h1>
              <p className="text-sm text-neutral-600">
                Sign in to continue your journey
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
                  className="transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-left">
                <Link 
                  href="#" 
                  className="text-sm text-green-700 hover:underline transition-all duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button 
                formAction={login} 
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-full transition-all duration-200"
                size="lg"
              >
                Log in
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/signup" 
                  className="text-neutral-900 hover:underline font-medium transition-all duration-200"
                >
                  Sign up
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

