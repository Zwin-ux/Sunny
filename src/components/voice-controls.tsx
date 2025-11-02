'use client';

import { Button } from './ui/button';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { useSpeech } from '../hooks/useSpeech';
import { useEffect, useState, useCallback } from "react";
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription } from './ui/alert';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  className?: string;
  textToSpeak?: string;
  onError?: (error: string) => void;
  replayableContent?: string;
}

export function VoiceControls({ 
  onTranscript, 
  onSpeak, 
  isSpeaking,
  textToSpeak = '',
  onError,
  className = '',
  replayableContent = ''
}: VoiceControlsProps) {
  const { 
    isListening, 
    transcript, 
    isSupported, 
    isSpeaking: isSpeakingInternal,
    error,
    startListening, 
    stopListening,
    speak,
    cancelSpeech
  } = useSpeech();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showError, setShowError] = useState(false);

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Handle speaking state
  useEffect(() => {
    if (isSpeaking && textToSpeak) {
      const success = speak(textToSpeak, () => {
        onSpeak('');
      });
      
      if (!success) {
        onSpeak('');
      }
    }
  }, [isSpeaking, textToSpeak, speak, onSpeak]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Voice control error:', error);
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      onError?.(error);
      return () => clearTimeout(timer);
    }
  }, [error, onError]);

  const toggleListening = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      if (isListening) {
        const finalTranscript = stopListening();
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      } else {
        const started = startListening();
        if (!started) {
          throw new Error('Failed to start speech recognition');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setShowError(true);
      onError?.(errorMessage);
      console.error('Error toggling speech recognition:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isListening, startListening, stopListening, onTranscript, onError]);

  const handleSpeakClick = useCallback(() => {
    if (isSpeakingInternal) {
      cancelSpeech();
      // Also notify parent to cancel any pending auto-play
      onSpeak(''); 
    } else if (replayableContent) {
      speak(replayableContent);
    }
  }, [isSpeakingInternal, replayableContent, speak, cancelSpeech, onSpeak]);

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("text-sm text-muted-foreground p-2", className)}>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice controls not supported in your browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const speaking = isSpeaking || isSpeakingInternal;

  return (
    <div className={cn("flex items-center space-x-2 relative", className)}>
      {/* Error Alert */}
      {showError && error && (
        <div className="absolute -top-12 left-0 right-0 z-50">
          <Alert variant="destructive" className="p-2 text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error.length > 50 ? `${error.substring(0, 47)}...` : error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Voice Input Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleListening}
              disabled={isProcessing || speaking}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              className={cn({
                "animate-pulse": isListening,
                "opacity-50": isProcessing || speaking
              })}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? "Stop listening" : "Start voice input"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Text-to-Speech Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={speaking ? "default" : "outline"}
              size="icon"
              onClick={handleSpeakClick}
              disabled={!replayableContent || isListening || isProcessing}
              aria-label={speaking ? "Stop speaking" : "Read message aloud"}
              className={cn({
                "opacity-50": !textToSpeak || isListening,
                "bg-blue-500 hover:bg-blue-600 text-white": speaking
              })}
            >
              {speaking ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{speaking ? "Stop speaking" : "Read message aloud"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
