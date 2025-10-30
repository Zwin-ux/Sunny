'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  xp: number;
  streak: number;
  isSpeaking: boolean;
  onToggleSpeaking: () => void;
  appVersion?: string;
}

export function ChatHeader({
  xp,
  streak,
  isSpeaking,
  onToggleSpeaking,
  appVersion = 'v2',
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-4 md:px-6 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Image src="/sun.png" alt="Sunny" width={40} height={40} className="animate-pulse" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center">
              Chat with Sunny ☀️
              <span
                title={`Build ${appVersion}`}
                className="ml-2 inline-block text-[10px] leading-none font-extrabold px-2 py-1 rounded-full border-2 border-black bg-yellow-200"
              >
                {appVersion}
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-600">Your AI learning companion</p>
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-gray-900">{xp} XP</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="font-bold text-gray-900">{streak} day streak</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSpeaking}
            className="border-2 border-black"
            title={isSpeaking ? 'Disable voice output' : 'Enable voice output'}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
