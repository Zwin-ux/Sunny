"use client";

import { useState, useEffect, useRef, useCallback, Suspense, Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// UI Components
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Badge } from '../src/components/ui/badge';
import { Sparkles, Award, Mic, MicOff, Settings, Lightbulb, BookOpen, XCircle } from 'lucide-react';

// Hooks
import { useLearningChat } from '../src/hooks/useLearningChat';
import { useLearningSession } from '../src/contexts/LearningSessionContext';

// Utils
import { cn } from "../src/lib/utils";

// #region --- TYPE DEFINITIONS ---

type StudentProfile = {
  name: string;
  level: number;
  completedLessons: string[];
  achievements: string[];
  points?: number;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Message types
interface BaseMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  name?: string;
}

interface TextMessage extends BaseMessage {
  content: string;
  type?: 'text';
}

interface StructuredMessage extends BaseMessage {
  content: { type: string; [key: string]: any };
  type: 'structured';
}

type ChatMessage = TextMessage | StructuredMessage;

type Lesson = {
  id: string;
  title: string;
  description: string;
  content: any[];
  completed?: boolean;
};

// Prop types for dynamically loaded components
interface EmotionSelectorProps {
  selectedEmotion: string | null;
  onSelect: Dispatch<SetStateAction<string | null>>;
}

interface SunnyCharacterProps {
  emotion: string | null;
  className?: string;
}

// #endregion

// #region --- DYNAMIC COMPONENTS ---

const EmotionSelector = dynamic(() => import('../src/components/emotion-selector').then(mod => mod.default as React.FC<EmotionSelectorProps>), { ssr: false });
const SunnyCharacter = dynamic(() => import('../src/components/sunny-character').then(mod => mod.default as React.FC<SunnyCharacterProps>), { ssr: false });
const ContentRenderer = dynamic(() => import('../src/components/interactive/ContentRenderer'), { ssr: false });

// #endregion

// #region --- UI STYLES ---

const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-lg border-2 border-black px-6 py-2 font-bold transition-all duration-200 ${clayShadow} hover:shadow-md hover:translate-y-[-2px]`;
const clayInput = `rounded-lg border-2 border-black w-full p-2 bg-white text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 shadow-sm ${clayShadow} hover:shadow-md`;

// #endregion

function Chat() {
  const { processMessage, isProcessing } = useLearningChat();
  const { currentLesson, currentStep, isInLesson, nextStep, previousStep } = useLearningSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({ 
    name: 'Alex', level: 5, completedLessons: ['intro-to-bees'], achievements: ['First Flight'], points: 150 
  });
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>('happy');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined' || !voiceMode) return;

    speechSynthesisRef.current = window.speechSynthesis;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setVoiceError("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionImpl();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        setInput(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setVoiceError(`Speech error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) recognition.start(); // Keep listening if active
      };

      recognitionRef.current = recognition;
      if (isListening) recognition.start();

    } catch (error) {
      console.error("Failed to initialize Speech Recognition:", error);
      setVoiceError("Speech recognition could not be started.");
    }

    return () => {
      recognitionRef.current?.stop();
      speechSynthesisRef.current?.cancel();
    };
  }, [voiceMode, isListening]);

  const speak = (text: string) => {
    if (speechSynthesisRef.current && voiceMode) {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const handleUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: TextMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    const response = await processMessage(content);
    
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      type: typeof response.content === 'string' ? 'text' : 'structured',
    };
    setMessages(prev => [...prev, assistantMessage]);

    const textToSpeak = typeof response.content === 'string' ? response.content : response.content.text;
    if (textToSpeak) speak(textToSpeak);

  }, [processMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleListening = () => {
    if (!voiceMode) setVoiceMode(true);
    setIsListening(prev => !prev);
  };
  
  const handleNext = () => nextStep?.();
  const handlePrevious = () => previousStep?.();
  const handleQuizAnswer = (answer: string | number) => console.log('Quiz answer:', answer);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-1/3 bg-yellow-100 p-6 flex flex-col justify-between border-r-4 border-black">
        <div>
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Sunny</h1>
            <p className="text-lg text-gray-600">Your AI Learning Companion</p>
          </header>
          <SunnyCharacter emotion={selectedEmotion} className="w-full h-auto" />
          <EmotionSelector selectedEmotion={selectedEmotion} onSelect={setSelectedEmotion} />
        </div>
        <div className="bg-white/60 p-4 rounded-lg border-2 border-black">
          <h3 className="font-bold text-lg mb-2">{studentProfile.name}'s Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Badge variant="secondary">Level {studentProfile.level}</Badge><span className="font-semibold">{studentProfile.points} pts</span></div>
            <div className="flex flex-wrap gap-2">
              {studentProfile.achievements.map(ach => <Badge key={ach} variant="default"> <Award className="w-4 h-4 mr-1"/> {ach}</Badge>)}
            </div>
          </div>
        </div>
      </aside>

      <main className="w-2/3 flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b-4 border-black bg-white">
          <div className="flex items-center space-x-2">
            <Lightbulb className="text-yellow-500" />
            <h2 className="font-bold text-xl">{isInLesson ? currentLesson?.title : "Chat with Sunny"}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setVoiceMode(!voiceMode)} className={cn(clayButton, voiceMode ? 'bg-green-400' : 'bg-gray-200', 'p-2')} title={voiceMode ? 'Disable Voice Mode' : 'Enable Voice Mode'}>
              {voiceMode ? <Mic className="w-5 h-5"/> : <MicOff className="w-5 h-5"/>}
            </button>
            <Settings className="text-gray-600 cursor-pointer" />
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 bg-blue-50/50">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type !== 'structured' ? (
                  <div className={`flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && <SunnyCharacter emotion="happy" className="w-12 h-12" />}
                    <div className={`max-w-xl px-4 py-3 rounded-2xl ${clayShadow} border-2 border-black ${message.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <ContentRenderer content={message.content} onNext={handleNext} onPrevious={handlePrevious} onAnswer={handleQuizAnswer} isFirst={currentStep === 0} isLast={currentLesson ? currentStep === currentLesson.content.length - 1 : false} showNavigation={isInLesson} />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t-4 border-black p-4 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask me anything or say 'teach me about...'" className={clayInput} disabled={isProcessing} />
              {isProcessing && <div className="absolute right-3 top-1/2 transform -translate-y-1/2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
            <button onClick={toggleListening} className={cn(clayButton, isListening ? 'bg-red-500' : 'bg-blue-400', 'p-2')} title={isListening ? 'Stop Listening' : 'Start Listening'}>
              {isListening ? <MicOff className="w-6 h-6"/> : <Mic className="w-6 h-6"/>}
            </button>
            <Button type="submit" className={`${clayButton} bg-blue-500 text-white hover:bg-blue-600`} disabled={!input.trim() || isProcessing}>Send</Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {["Teach me about bees", "Quiz me", "What can you teach me?"].map((suggestion) => (
              <button key={suggestion} onClick={() => handleUserMessage(suggestion)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors border border-gray-300">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </main>

      {voiceError && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <XCircle className="w-5 h-5" />
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} className="ml-4 text-red-500 hover:text-red-700 font-bold" aria-label="Dismiss error">&times;</button>
        </motion.div>
      )}
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // A component that needs Suspense should be wrapped in it.
  // This is a placeholder for any logic that might need it.
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-2xl font-bold">Loading Sunny...</div>}> 
      <Chat />
    </Suspense>
  );
}
