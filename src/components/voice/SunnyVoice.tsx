'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SunnyVoiceProps {
  text: string;
  autoPlay?: boolean;
  showButton?: boolean;
}

export function SunnyVoice({ text, autoPlay = false, showButton = true }: SunnyVoiceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && text) {
      handleSpeak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay]);

  const handleSpeak = async () => {
    if (isPlaying) {
      // Stop current playback
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to generate voice');

      const { audio, format } = await response.json();

      // Convert base64 to blob URL
      const audioBlob = base64ToBlob(audio, `audio/${format}`);
      const url = URL.createObjectURL(audioBlob);

      setAudioUrl(url);

      // Create and play audio
      const audioElement = new Audio(url);
      audioRef.current = audioElement;

      audioElement.onplay = () => setIsPlaying(true);
      audioElement.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audioElement.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audioElement.play();
    } catch (error) {
      console.error('Voice playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showButton) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSpeak}
      disabled={isLoading}
      className="ml-2"
      title={isPlaying ? 'Stop' : 'Listen to Sunny'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}

// Helper function
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
