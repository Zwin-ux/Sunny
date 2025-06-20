'use client';

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { useEffect } from "react";

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  className?: string;
}

export function VoiceControls({ 
  onTranscript, 
  onSpeak, 
  isSpeaking,
  className = '' 
}: VoiceControlsProps) {
  const { 
    isListening, 
    transcript, 
    isSupported, 
    startListening, 
    stopListening,
    speak 
  } = useSpeech();

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Handle speaking state
  useEffect(() => {
    if (isSpeaking) {
      // This will be used when we implement text-to-speech
      // speak(textToSpeak);
    }
  }, [isSpeaking, speak]);

  if (!isSupported) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Voice controls not supported in your browser
      </div>
    );
  }

  const toggleListening = () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    } else {
      startListening();
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        type="button"
        variant={isSpeaking ? "default" : "outline"}
        size="icon"
        onClick={() => onSpeak('')}
        disabled={isSpeaking}
        aria-label={isSpeaking ? "Speaking..." : "Read message aloud"}
      >
        {isSpeaking ? (
          <Volume2 className="h-4 w-4 animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
