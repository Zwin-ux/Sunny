"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat, type Message as AIChatMessage } from 'ai/react';

import { Message, UserMessage, AssistantMessage, StudentProfile, ChallengeMessage, Challenge, UIMessage } from '@/types/chat';
import EmotionSelector from '@/components/emotion-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Award, Heart, Lightbulb, Bot, Rocket, BookOpen, BookMarked, BookCheck, Volume2, VolumeX, Mic, MicOff, Settings } from 'lucide-react';
import TopicBubbles from "@/components/topic-bubbles";
import ChatMessage from "@/components/chat-message";
import RewardBadge from "@/components/reward-badge";
import SunnyCharacter from "@/components/sunny-character";
import Link from "next/link";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { VoiceControls } from "@/components/voice-controls";
import { cn } from "@/lib/utils";

// CSS for claymation effects
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]"
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`
const clayInput = `rounded-2xl border-4 border-purple-300 bg-white py-4 px-6 text-lg text-gray-800 placeholder-gray-500 
  focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 
  transition-all duration-200 shadow-sm ${clayShadow} 
  hover:shadow-md hover:translate-y-[-2px]`

function Chat() {
  const searchParams = useSearchParams();
  const [name, setName] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('studentName') || 'Student' : 'Student';
  });
  const [isNameSet, setIsNameSet] = useState<boolean>(true);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>('happy');
  const [question, setQuestion] = useState<string>("");
  const [rewardCount, setRewardCount] = useState<number>(0);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState<boolean>(false);
  const [textToSpeak, setTextToSpeak] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>({
    name: 'Student',
    level: 1,
    points: 0,
    completedLessons: [],
    emotion: 'happy',
    learningStyle: 'visual',
    difficulty: 'beginner',
    preferredLearningStyle: 'visual',
    knownConcepts: [],
    knowledgeGaps: [],
    conversationHistory: []
  });
  const [completedLesson, setCompletedLesson] = useState<{
    id: string;
    title: string;
    completedAt: string;
  } | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onResponse: (response) => {
      if (isVoiceModeActive) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let fullText = '';
          
          const readStream = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value);
              const lines = text.split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const message = line.replace(/^data: /, '');
                  if (message === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(message);
                    if (parsed.choices?.[0]?.delta?.content) {
                      fullText += parsed.choices[0].delta.content;
                      setTextToSpeak(fullText);
                    }
                  } catch (e) {
                    console.error('Error parsing message:', e);
                  }
                }
              }
            }
          };
          
          readStream();
        }
      }
    },
  });
  
  const lastAssistantMessageContent = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content || '';
  
  // Check for completed lessons when the component mounts
  useEffect(() => {
    // This check ensures the code runs only in the browser
    if (typeof window !== 'undefined') {
      // Set initial welcome message if no messages exist
      if (messages.length === 0) {
        const welcomeMessage: AssistantMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          role: 'assistant',
          content: `Hi ${name}! I'm Sunny, your friendly AI learning companion. What would you like to learn about today?`,
          timestamp: Date.now(),
          name: 'Sunny',
          isLoading: false
        };
        setMessages([welcomeMessage]);
      }
      
      // Check localStorage for any completed lessons
      const savedLesson = localStorage.getItem('lastCompletedLesson');
      if (savedLesson) {
        try {
          const lessonData = JSON.parse(savedLesson);
          setCompletedLesson(lessonData);
        } catch (error) {
          console.error('Error parsing completed lesson data:', error);
        }
      }
    }
    
    // Check URL parameter for lesson completion
    const lessonComplete = searchParams.get('lessonComplete');
    if (lessonComplete === 'true') {
      handleLessonCompleted();
    }
  }, [searchParams, name]);
  
  // Handle when a lesson has been completed and user returns to chat
  const handleLessonCompleted = () => {
    if (!completedLesson) return
    
    // Add Sunny's response about the completed lesson
    const lessonResponse: AssistantMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      role: 'assistant',
      content: `Wow, you completed the "${completedLesson.title}" lesson! That's amazing! What did you think of it?`,
      timestamp: Date.now(),
      name: 'Sunny',
      isLoading: false
    }
    
    setMessages(prev => [...prev, lessonResponse])
    
    // Clear the completed lesson from localStorage to avoid showing the message again
    localStorage.removeItem('lastCompletedLesson')
    
    // Show reward animation
    setRewardCount(prev => prev + 1)
    setShowReward(true)
    setTimeout(() => setShowReward(false), 3000)
  }

  const handleNameSubmit = () => {
    // This function is kept for compatibility but is not used in the simplified flow
    if (name.trim()) {
      localStorage.setItem('studentName', name);
      setIsNameSet(true);
    }
  }

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    // In the simplified flow, we don't need to add a message when emotion changes
  }

  // Handle topic selection
  const handleTopicSelect = async (topic: 'math' | 'ideas' | 'robots' | 'space') => {
    const topicMessages = {
      math: `Can you help me with some math problems? I'm learning about addition and subtraction.`,
      ideas: `I need some fun project ideas! What can I build with things around the house?`,
      robots: `Tell me about robots! How do they work and what can they do?`,
      space: `I want to learn about space! What's the most interesting planet?`,
    } as const;

    const recommendLesson = topic !== 'ideas';
    const lessonId = {
      math: 'math-patterns-001',
      robots: 'robots-intro-001',
      space: 'space-planets-001',
      ideas: ''
    }[topic];
    
    const message = topicMessages[topic] || topicMessages.ideas;
    setQuestion(message);
    
    if (recommendLesson && lessonId) {
      // Store the recommended lesson in localStorage
      const lessonData = {
        id: lessonId,
        title: `Recommended Lesson: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('lastCompletedLesson', JSON.stringify(lessonData));
      setCompletedLesson(lessonData);
    }
    
    // Auto-send the message if there's content
    if (message && !isLoading) {
      const userMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        role: 'user' as const,
        content: message,
        name: name || 'User',
        timestamp: Date.now(),
      };
      
      // Update the input field and trigger submission
      handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
      
      try {
        // Add user message to UI immediately
        setMessages(prev => [...prev, userMessage]);
        
        // Call the API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [...messages, { role: 'user', content: message }],
            stream: true
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        // Handle streaming response
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let assistantMessage = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const message = line.replace(/^data: /, '');
                if (message === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(message);
                  if (parsed.choices?.[0]?.delta?.content) {
                    assistantMessage += parsed.choices[0].delta.content;
                    
                    // Update the assistant's message in real-time
                    setMessages(prev => {
                      const lastMessage = prev[prev.length - 1];
                      if (lastMessage?.role === 'assistant') {
                        return [...prev.slice(0, -1), { ...lastMessage, content: assistantMessage }];
                      }
                      return [...prev, { 
                        id: `assistant-${Date.now()}`,
                        type: 'assistant',
                        role: 'assistant',
                        content: assistantMessage,
                        name: 'Sunny',
                        timestamp: Date.now()
                      }];
                    });
                    
                    // Speak the message in voice mode
                    if (isVoiceModeActive) {
                      speakMessage(assistantMessage);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to send message', e);
      }
    }
  };

  const speakMessage = useCallback((text: string) => {
    if (!isVoiceModeActive || typeof window === 'undefined' || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'en-US') || null;
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onend = () => {
        setTextToSpeak('');
      };

      utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        setTextToSpeak('');
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setTextToSpeak('');
    }
  }, [isVoiceModeActive]);

  const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Call the useChat's handleSubmit
    handleSubmit(e);
    
    // Speak the message in voice mode if enabled
    if (isVoiceModeActive) {
      speakMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        {/* Chat Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message: AIChatMessage) => {
            const uiMessage: UIMessage = {
              id: message.id,
              role: message.role === 'user' ? 'user' : 'assistant',
              content: typeof message.content === 'string' ? message.content : '',
              name: message.role === 'assistant' ? 'Sunny' : (name || 'User'),
              timestamp: Date.now(),
              type: message.role === 'assistant' ? 'assistant' : 'user',
              isLoading: false
            };
            return (
              <ChatMessage 
                key={message.id} 
                message={uiMessage} 
                isUser={message.role === 'user'}
              />
            );
          })}
        </div>
        
        {/* Input Area - Clay Style */}
        {selectedEmotion && (
          <div className={`${clayCard} border-yellow-400 bg-yellow-100 p-6 transform -rotate-1`}>
            <form onSubmit={handleSubmitWrapper} className="w-full">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className={clayInput}
                  disabled={isLoading}
                  name="message"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`${clayButton} bg-blue-500 hover:bg-blue-600 text-white border-blue-600`}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>

                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center 
                    bg-gradient-to-br from-green-400 to-green-500 text-white 
                    border-4 border-green-600 shadow-lg hover:shadow-xl 
                    transition-all duration-200 transform hover:scale-105 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    focus:outline-none focus:ring-4 focus:ring-green-200 focus:ring-opacity-50`}
                  aria-label="Send message"
                  style={{
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.15)'
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${!input.trim() || isLoading ? 'opacity-70' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`}
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>

                <Button
                  type="button"
                  variant={isVoiceModeActive ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsVoiceModeActive(!isVoiceModeActive)}
                  className={cn("rounded-full h-14 w-14", clayShadow, {
                    "bg-blue-500 text-white hover:bg-blue-600": isVoiceModeActive,
                    "bg-white text-gray-700 hover:bg-gray-100": !isVoiceModeActive
                  })}
                  aria-label={isVoiceModeActive ? "Disable voice mode" : "Enable voice mode"}
                >
                  {isVoiceModeActive ? (
                    <Volume2 className="h-6 w-6" />
                  ) : (
                    <VolumeX className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Footer - Clay Style */}
      <footer className="py-5 px-6 text-center relative z-10">
        <div className={`${clayCard} border-purple-400 bg-purple-300 py-4 px-8 inline-block transform -rotate-1`}>
          <p className="text-lg font-bold text-purple-800 flex items-center justify-center gap-3">
            <span>Sunny AI for Schools</span>
            <span className="text-2xl">☀️</span>
            <Link href="/teacher" className="inline-block px-4 py-2 bg-yellow-300 text-yellow-800 rounded-full border-2 border-yellow-400 hover:bg-yellow-400 transition-all hover:scale-110 hover:rotate-3 transform">
              Teacher Zone
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Chat />
    </Suspense>
  );
}

