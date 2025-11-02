'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function DemoWaitlistCTA() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setPosition(data.position);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">☀️</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You're on the list!
          </h1>

          <Card className="p-8 bg-green-50 border-2 border-green-200 mb-8">
            <p className="text-6xl font-bold text-green-800 mb-2">
              #{position}
            </p>
            <p className="text-lg text-green-700">
              in line
            </p>
          </Card>

          <div className="text-left max-w-md mx-auto mb-8">
            <p className="text-lg text-gray-700 mb-4">
              📧 Check your email for:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Your waitlist confirmation</li>
              <li>• Early access perks</li>
              <li>• Sunny updates</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full max-w-md bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              Back to Home →
            </Button>

            <Button
              onClick={() => window.location.href = '/demo'}
              variant="outline"
              className="w-full max-w-md"
            >
              Try Demo Again
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Share with friends:</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">Twitter</Button>
                <Button variant="outline" size="sm">Facebook</Button>
                <Button variant="outline" size="sm">Copy Link</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">☀️</div>
          <Card className="p-6 bg-yellow-50 border-2 border-yellow-200 mb-6">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              🎉 You just experienced Sunny's adaptive learning!
            </p>
            <p className="text-gray-700">
              Imagine this every day for your child...
            </p>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            ✨ What You'll Get:
          </h2>
          
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">✅</span>
              <span className="text-gray-700">Unlimited adaptive missions</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">🎙️</span>
              <span className="text-gray-700">Sunny's voice conversations</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">📊</span>
              <span className="text-gray-700">Personalized learning paths</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">👨‍👩‍👧</span>
              <span className="text-gray-700">Parent progress dashboard</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="text-2xl">💡</span>
              <span className="text-gray-700">Daily learning insights</span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-6">
          Join <span className="font-bold text-yellow-600">500+</span> families on the waitlist
        </p>

        {/* Waitlist Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-lg py-6 font-semibold"
            >
              {status === 'loading' ? 'Joining...' : 'Join Waitlist! →'}
            </Button>

            {status === 'error' && (
              <p className="text-red-600 text-sm text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </form>

          <div className="mt-6 text-center space-y-1">
            <p className="text-sm text-gray-500">🔒 Your data is safe & private</p>
            <p className="text-sm text-gray-500">📧 We'll email when it's your turn</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
