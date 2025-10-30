'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Brain, Volume2, VolumeX } from 'lucide-react';

interface MobileStatsProps {
  xp: number;
  streak: number;
  messagesCount: number;
  isSpeaking: boolean;
  onToggleSpeaking: () => void;
}

export function MobileStats({
  xp,
  streak,
  messagesCount,
  isSpeaking,
  onToggleSpeaking,
}: MobileStatsProps) {
  return (
    <div className="md:hidden bg-white border-t-2 border-black px-4 py-3">
      <div className="flex items-center justify-around">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-sm">{xp}</span>
          </div>
          <p className="text-xs text-gray-600">XP</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold text-sm">{streak}</span>
          </div>
          <p className="text-xs text-gray-600">Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
            <Brain className="w-4 h-4" />
            <span className="font-bold text-sm">{messagesCount}</span>
          </div>
          <p className="text-xs text-gray-600">Messages</p>
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
  );
}
