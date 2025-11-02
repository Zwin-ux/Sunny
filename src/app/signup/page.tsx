'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    password: '',
    confirmPassword: '',
    childName: '',
    childAge: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual signup
      // For now, simulate signup
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create user object
      const user = {
        id: `user-${Date.now()}`,
        email: formData.email,
        name: formData.parentName,
        childName: formData.childName,
        childAge: formData.childAge,
        createdAt: new Date().toISOString()
      };

      // Store user session (temporary solution)
      localStorage.setItem('sunny_user', JSON.stringify(user));

      toast.success('Account created successfully!');

      // Redirect to onboarding
      router.push('/onboarding');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 text-6xl opacity-10"
        >
          🎨
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 right-10 text-5xl opacity-10"
        >
          📚
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Back button */}
        <Link href="/landing">
          <Button
            className="mb-4 font-semibold hover:bg-white/50"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        {/* Signup Card */}
        <div className="bg-white rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          {/* Sunny Logo */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-7xl text-center mb-4"
          >
            ☀️
          </motion.div>

          <h1 className="text-3xl font-black text-center mb-2">Start Learning with Sunny!</h1>
          <p className="text-gray-600 text-center mb-8">Create your free account in minutes</p>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                Parent Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="parentName">
                    Your Name
                  </label>
                  <Input
                    id="parentName"
                    name="parentName"
                    type="text"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
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
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              i < strength.strength ? strength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full p-3 pr-12 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Child Information */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-200">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                Child Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="childName">
                    Child's Name
                  </label>
                  <Input
                    id="childName"
                    name="childName"
                    type="text"
                    value={formData.childName}
                    onChange={handleChange}
                    placeholder="Alex"
                    className="w-full p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" htmlFor="childAge">
                    Child's Age
                  </label>
                  <Input
                    id="childAge"
                    name="childAge"
                    type="number"
                    min="4"
                    max="12"
                    value={formData.childAge}
                    onChange={handleChange}
                    placeholder="8"
                    className="w-full p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-5 h-5 mt-1 rounded border-2 border-black"
                  required
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-4 font-bold text-lg rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  Create Account
                  <Sparkles className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign in
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-6 bg-white/70 rounded-2xl border-2 border-black p-6">
          <h3 className="font-bold mb-3">What you'll get:</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              '✅ Personalized AI tutor',
              '✅ Progress tracking & analytics',
              '✅ Unlimited lessons & quizzes',
              '✅ Parent dashboard',
              '✅ 30-day free trial',
              '✅ Cancel anytime'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
