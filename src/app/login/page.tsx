'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SunnyBackground } from '@/components/ui/SunnyBackground';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement actual authentication
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store user session (temporary solution)
      localStorage.setItem('sunny_user', JSON.stringify({
        email,
        name: email.split('@')[0],
        id: `user-${Date.now()}`
      }));

      toast.success('Welcome back to Sunny!');
      router.push('/');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Quick demo login
    localStorage.setItem('sunny_user', JSON.stringify({
      email: 'demo@sunny.com',
      name: 'Demo User',
      id: 'demo-user'
    }));
    toast.success('Welcome to the demo!');
    router.push('/');
  };

  return (
    <SunnyBackground opacity={0.12} overlay={true}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back to landing button */}
          <Link href="/landing">
          <Button
            className="mb-4 font-semibold hover:bg-white/50"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          {/* Sunny Logo */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-7xl text-center mb-4"
          >
            ☀️
          </motion.div>

          <h1 className="text-3xl font-black text-center mb-2">Welcome Back!</h1>
          <p className="text-gray-600 text-center mb-8">Sign in to continue learning with Sunny</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 pr-12 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-2 border-black" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-4 font-bold text-lg rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  Sign In
                  <Sparkles className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-600 font-semibold">Or try demo</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleDemoLogin}
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 p-3 font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
            >
              Continue with Demo
            </Button>
          </div>

          {/* Sign up link */}
          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Secure & encrypted • 🎓 Built in partnership with families</p>
        </div>
      </div>
    </SunnyBackground>
  );
}
