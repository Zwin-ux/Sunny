import { useState, useCallback, useEffect, useRef } from 'react';



export const useSpeech = (language = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const results = event.results;
      const transcript = Array.from(results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart recognition if still supposed to be listening
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    synthesisRef.current = window.speechSynthesis;
    setIsSupported(true);

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (utteranceRef.current) {
        synthesisRef.current?.cancel();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return false;
    }

    if (isListening) return false;

    try {
      setError(null);
      setTranscript('');
      setIsListening(true);
      recognitionRef.current?.start();
      return true;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
      setIsListening(false);
      return false;
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback((): string => {
    if (!isListening || !recognitionRef.current) return transcript;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      return transcript;
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
      return transcript;
    }
  }, [isListening, transcript]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthesisRef.current) {
      setError('Speech synthesis not available');
      return false;
    }

    try {
      // Cancel any ongoing speech
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      
      // Try to find a natural-sounding voice
      const voices = synthesisRef.current.getVoices();
      const preferredVoices = voices.filter(voice => 
        voice.lang.startsWith(language) && 
        voice.name.toLowerCase().includes('natural')
      );
      
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError('Error during speech synthesis');
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      synthesisRef.current.speak(utterance);
      utteranceRef.current = utterance;
      return true;
    } catch (err) {
      console.error('Error with speech synthesis:', err);
      setError('Failed to speak text');
      return false;
    }
  }, [language]);

  const cancelSpeech = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
};
