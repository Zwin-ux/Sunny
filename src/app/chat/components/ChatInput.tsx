'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import SmartSuggestions from '@/components/chat/SmartSuggestions';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onVoiceToggle: () => void;
  isListening: boolean;
  isLoading: boolean;
  showSmartSuggestions?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onVoiceToggle,
  isListening,
  isLoading,
  showSmartSuggestions = true,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleVoiceClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    onVoiceToggle();
  };

  const handleSuggestionPick = (text: string) => {
    onChange(text);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Input Row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Button
          onClick={handleVoiceClick}
          variant="outline"
          size="icon"
          className={`border-2 border-black transition-colors ${
            isListening ? 'bg-red-100 animate-pulse' : ''
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-red-600" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed px-6"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Tip */}
      <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
        <p>
          <strong>Tip:</strong> Tell me how you're feeling to get personalized help! I adapt to
          your emotions and learning style.
        </p>
      </div>

      {/* Smart Suggestions */}
      {showSmartSuggestions && (
        <div className="mt-3">
          <SmartSuggestions onPick={handleSuggestionPick} />
        </div>
      )}
    </div>
  );
}
