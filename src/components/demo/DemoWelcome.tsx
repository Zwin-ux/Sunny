'use client';

import { Button } from '@/components/ui/button';
import { SunnyVoice } from '@/components/voice/SunnyVoice';

interface DemoWelcomeProps {
  onStart: () => void;
}

export function DemoWelcome({ onStart }: DemoWelcomeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-2xl text-center">
        {/* Animated Sunny Avatar */}
        <div className="text-8xl mb-6 animate-bounce">☀️</div>
        
        {/* Welcome Message */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Hi! I'm Sunny!
        </h1>
        
        <p className="text-xl text-gray-600 mb-3">
          I'm your AI learning companion.
        </p>
        
        <p className="text-xl text-gray-600 mb-6">
          I adapt to how <span className="font-bold text-yellow-600">YOU</span> learn best!
        </p>
        
        <p className="text-lg text-gray-500 mb-8">
          Let's try a quick demo together.
          <br />
          It'll only take 2 minutes! 🎯
        </p>
        
        {/* Voice Button */}
        <div className="mb-8">
          <SunnyVoice 
            text="Hi! I'm Sunny! Ready to learn together?"
            showButton={true}
          />
        </div>
        
        {/* Start Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Start Demo! →
        </Button>
        
        {/* Trust Signals */}
        <p className="text-sm text-gray-400 mt-6">
          No signup required • 100% free • Takes 2 minutes
        </p>
      </div>
    </div>
  );
}
