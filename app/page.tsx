"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateSunnyResponse } from '@/lib/sunny-ai';
import { Message, SunnyChatMessage } from '@/types/chat';
import EmotionSelector from '@/components/emotion-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Award, Heart, Lightbulb, Bot, Rocket, BookOpen, BookMarked, BookCheck, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
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

export default function Home() {
  const { isOnboardingComplete } = useOnboarding();
  const searchParams = useSearchParams();
  const [name, setName] = useState<string>("") 
  const [isNameSet, setIsNameSet] = useState<boolean>(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [question, setQuestion] = useState<string>("") 
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false) 
  const [rewardCount, setRewardCount] = useState<number>(0) 
  const [showReward, setShowReward] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false)
  const [completedLesson, setCompletedLesson] = useState<{
    id: string;
    title: string;
    completedAt: string;
  } | null>(null)
  
  // Check for completed lessons when the component mounts
  useEffect(() => {
    // Check localStorage for any completed lessons
    const savedLesson = localStorage.getItem('lastCompletedLesson')
    if (savedLesson) {
      try {
        const lessonData = JSON.parse(savedLesson)
        setCompletedLesson(lessonData)
      } catch (error) {
        console.error('Error parsing completed lesson data:', error)
      }
    }
    
    // Check URL parameter for lesson completion
    const lessonComplete = searchParams.get('lessonComplete')
    if (lessonComplete === 'true' && isNameSet && selectedEmotion) {
      // When we return from a completed lesson, trigger Sunny to mention it
      handleLessonCompleted()
    }
  }, [searchParams, isNameSet, selectedEmotion])
  
  // Handle when a lesson has been completed and user returns to chat
  const handleLessonCompleted = () => {
    if (!completedLesson) return
    
    // Add Sunny's response about the completed lesson
    const lessonResponse: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant' as const,
      content: `Great job completing the "${completedLesson.title}" lesson! What did you learn? Would you like to talk more about it?`,
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
    if (name.trim()) {
      setIsNameSet(true)
      setMessages([
        {
          type: "assistant" as const,
          content: `Hi ${name}! I'm Sunny! How are you feeling today?`,
          timestamp: Date.now(),
          id: `assistant-${Date.now()}`,
          name: 'Sunny'
        },
      ])
    }
  }

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion)
    
    // Add a welcome message from Sunny
    const welcomeMessages = {
      happy: "I'm so happy you're here! What would you like to talk about today? 😊",
      sad: "I'm here to help cheer you up! What's on your mind? 🌈",
      excited: "Yay! I'm excited to chat with you! What's new? 🎉",
      curious: "I love curious minds! What would you like to learn about today? 🧐",
      silly: "Let's get silly! What's the funniest thing you can think of? 🤪"
    } as const;
    
    setMessages(prev => [
      ...prev,
      {
        type: 'assistant' as const,
        content: welcomeMessages[emotion as keyof typeof welcomeMessages] || welcomeMessages.happy,
        timestamp: Date.now(),
        id: `assistant-${Date.now()}`,
        name: 'Sunny'
      }
    ])
  }

  // Handle topic selection
  const handleTopicSelect = (topic: 'math' | 'ideas' | 'robots' | 'space') => {
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
      handleSendMessage();
    }
  }

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!question.trim()) return;

    const userMessage: UserMessage = {
      id: Date.now().toString(),
      type: 'user',
      role: 'user',
      content: question,
      name: name || 'User',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await generateSunnyResponse({
        prompt: question,
        name: name || 'Friend',
        conversationHistory: messages as SunnyChatMessage[],
      });

      const aiMessage: AssistantMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        role: 'assistant',
        content: response.content,
        name: 'Sunny',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the AI's response if voice is enabled
      if (isVoiceEnabled && response.content) {
        speakMessage(response.content);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [question, name, messages, isVoiceEnabled, speakMessage]);

  // Handle text-to-speech for AI messages
  const speakMessage = useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'en-US') || null;
      
      if (voice) {
        utterance.voice = voice;
      }
      
      setIsSpeaking(true);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled]);

  // Handle speech recognition result
  const handleTranscript = useCallback((text: string) => {
    setQuestion(text);
  }, []);

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      window.speechSynthesis.cancel();
      setIsListening(false);
    } else {
      setIsListening(true);
    }
  }, [isListening]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    if (trimmedQuestion && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Onboarding Flow */}
      {!isOnboardingComplete && <OnboardingFlow />}
      
      {/* Background Image - Higher saturation */}
      <div className="fixed inset-0 -z-10">
        <Image 
          src="/background.png" 
          alt="Background" 
          fill 
          className="object-cover brightness-105 contrast-105 saturate-[1.2]" 
          priority 
        />
      </div>
      
      {/* Floating Clay Elements */}
      <div className="fixed -top-10 -left-10 w-40 h-40 bg-blue-300 rounded-full opacity-60 animate-float-slow z-0"></div>
      <div className="fixed top-1/4 -right-20 w-52 h-52 bg-yellow-200 rounded-full opacity-50 animate-float-medium z-0"></div>
      <div className="fixed bottom-20 -left-10 w-36 h-36 bg-green-200 rounded-full opacity-50 animate-float-fast z-0"></div>
      
      {/* Playful Clay Header */}
      <header className="py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`${clayCard} bg-yellow-400 border-yellow-500 p-3 flex items-center transform rotate-3 hover:rotate-6 transition-all cursor-pointer`}>
            <Image 
              src="/sun.png" 
              alt="Sunny AI Logo" 
              width={48} 
              height={48} 
              className="drop-shadow-md animate-pulse-slow" 
            />
            <h1 className="text-2xl font-extrabold text-yellow-800 ml-2 drop-shadow-sm">Sunny AI 
              <span className="block text-sm font-bold text-yellow-700">for Schools</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Link href="/images">
            <button className={`${clayButton} bg-orange-400 border-4 border-orange-500 text-orange-800 flex items-center gap-2`}>
              <div className="relative w-8 h-8">
                <Image 
                  src="/rainbow.png" 
                  alt="Art Gallery" 
                  fill 
                  className="object-contain" 
                />
              </div>
              <span>Gallery</span>
            </button>
          </Link>
          <Link href="/teacher">
            <button className={`${clayButton} bg-blue-400 border-4 border-blue-500 text-blue-800 flex items-center gap-2`}>
              <div className="relative w-8 h-8">
                <Image 
                  src="/bulb.png" 
                  alt="Teacher" 
                  fill 
                  className="object-contain" 
                />
              </div>
              <span>Teachers</span>
            </button>
          </Link>
        </div>
      </header>
      
      {/* Custom animations for floating elements */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-wiggle:hover { animation: wiggle 1s ease-in-out infinite; }
        .animate-bounce-soft:hover { animation: bounce-soft 1s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FCD34D;
          border-radius: 10px;
          border: 3px solid #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F59E0B;
        }
      `}</style>
      
      {/* Main Chat Interface - Clay Style */}
      <div className="max-w-4xl mx-auto px-4 py-2 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        {!isNameSet ? (
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44 mb-4 animate-float-medium">
              <Image 
                src="/sun.png" 
                alt="Sunny" 
                fill 
                className="object-contain drop-shadow-lg" 
              />
            </div>
            
            <div className="w-full max-w-md mb-6">
              <div className={`${clayCard} border-yellow-400 bg-yellow-300 p-8 text-center mb-6 transform rotate-1`}>
                <h2 className="text-3xl font-extrabold text-yellow-800 mb-2 drop-shadow-sm">Hi there, friend!</h2>
                <p className="text-xl text-yellow-800 font-medium">I'm Sunny! What's your name?</p>
                
                <div className="mt-6 relative">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${clayInput} w-full text-center text-xl font-medium`}
                    placeholder="Type your name here..."
                    onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  />
                  <div className="absolute right-2 top-2">
                    <button 
                      onClick={handleNameSubmit}
                      aria-label="Submit name"
                      className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 rounded-full p-2 border-4 border-yellow-500 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
              <div className={`${clayCard} border-purple-400 bg-purple-300 p-5 text-center animate-float-slow animate-wiggle transform rotate-2`}>
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <Image 
                    src="/bulb.png" 
                    alt="Ideas" 
                    fill 
                    className="object-contain drop-shadow-md" 
                  />
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-1">Smart Learning</h3>
                <p className="text-purple-800 font-medium">Lessons just for you!</p>
              </div>
              
              <div className={`${clayCard} border-blue-400 bg-blue-300 p-5 text-center animate-float-medium animate-bounce-soft transform -rotate-2`}>
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <Image 
                    src="/robot.png" 
                    alt="Interactive" 
                    fill 
                    className="object-contain drop-shadow-md" 
                  />
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-1">Fun Chats</h3>
                <p className="text-blue-800 font-medium">Ask me anything!</p>
              </div>
              
              <div className={`${clayCard} border-green-400 bg-green-300 p-5 text-center animate-float-fast animate-wiggle transform rotate-3`}>
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <Image 
                    src="/star.png" 
                    alt="Rewards" 
                    fill 
                    className="object-contain drop-shadow-md" 
                  />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-1">Cool Rewards</h3>
                <p className="text-green-800 font-medium">Earn fun prizes!</p>
              </div>
            </div>
          </div>
        ) : (

          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-auto mb-4 pr-2 custom-scrollbar">
              {/* Messages Container */}
              <div className="space-y-6 pb-2">
                {!selectedEmotion ? (
                  <div className={`${clayCard} border-yellow-300 bg-yellow-100 p-6 transform rotate-1`}>
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                          localStorage.removeItem('sunny-onboarding-complete');
                          window.location.reload();
                        }}
                        title="Reset Onboarding"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                      <div className="relative w-16 h-16 animate-pulse-slow">
                        <Image src="/sun.png" alt="Sunny" fill className="object-contain drop-shadow-md" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-yellow-800 mb-2">Sunny</p>
                        <div className="prose">
                          <p className="text-lg text-yellow-800">Hi {name}! I'm Sunny! How are you feeling today?</p>
                          <div className="mt-6">
                            <EmotionSelector onSelect={handleEmotionSelect} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: message.type === 'user' ? 50 : -50 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className={message.type === 'assistant' ? 'pr-8' : 'pl-8'}
                        >
                          <ChatMessage
                            id={message.id}
                            type={message.type}
                            content={message.content}
                            name={message.name}
                            timestamp={message.timestamp}
                            isLoading={false}
                            className=""
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              
              {/* Achievement Reward Animation */}
              {showReward && (
                <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce-soft">
                  <div className={`${clayCard} border-yellow-400 bg-yellow-300 p-8 flex flex-col items-center transform rotate-3`}>
                    <div className="relative w-24 h-24 mb-3 animate-float-medium">
                      <Image src="/rainbow.png" alt="Achievement" fill className="object-contain drop-shadow-lg" />
                    </div>
                    <div className="relative">
                      <h3 className="text-2xl font-extrabold text-yellow-800 mb-1 drop-shadow-sm">SUPER AWESOME!</h3>
                      <div className="absolute -top-6 -right-6">
                        <div className="relative w-12 h-12">
                          <Image src="/star.png" alt="Star" fill className="object-contain drop-shadow-md animate-pulse-slow" />
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-yellow-800">You've earned a new achievement!</p>
                    <div className="absolute -bottom-3 -left-3">
                      <div className="relative w-14 h-14">
                        <Image src="/thumbsup.png" alt="Thumbs Up" fill className="object-contain drop-shadow-md animate-pulse-slow" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Learning Resources - Clay Style */}
            {selectedEmotion && (
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative w-8 h-8">
                    <Image src="/bulb.png" alt="Lesson" fill className="object-contain drop-shadow-md" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-800">Fun Lessons for You!</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/lesson/math-patterns-001" className="block">
                    <div className={`${clayCard} border-blue-400 bg-blue-300 p-4 transform rotate-1 hover:rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-blue-800 mb-1">Pattern Game</p>
                          <div className="mt-1 flex items-center">
                            <span className="text-blue-800 font-medium px-3 py-1 bg-blue-200 rounded-full text-sm mr-2 border-2 border-blue-400">Math</span>
                            <span className="text-sm font-bold text-blue-800">5-10 min</span>
                          </div>
                        </div>
                        <div className="relative w-10 h-10 animate-pulse-slow">
                          <Image src="/star.png" alt="Math" fill className="object-contain drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/lesson/robots-intro-001" className="block">
                    <div className={`${clayCard} border-purple-400 bg-purple-300 p-4 transform -rotate-1 hover:-rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-purple-800 mb-1">Robot Fun</p>
                          <div className="mt-1 flex items-center">
                            <span className="text-purple-800 font-medium px-3 py-1 bg-purple-200 rounded-full text-sm mr-2 border-2 border-purple-400">Robots</span>
                            <span className="text-sm font-bold text-purple-800">15 min</span>
                          </div>
                        </div>
                        <div className="relative w-10 h-10 animate-float-slow">
                          <Image src="/robot.png" alt="Robots" fill className="object-contain drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/lesson/space-planets-001" className="block">
                    <div className={`${clayCard} border-indigo-400 bg-indigo-300 p-4 transform rotate-1 hover:rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-indigo-800 mb-1">Space Adventure</p>
                          <div className="mt-1 flex items-center">
                            <span className="text-indigo-800 font-medium px-3 py-1 bg-indigo-200 rounded-full text-sm mr-2 border-2 border-indigo-400">Space</span>
                            <span className="text-sm font-bold text-indigo-800">10 min</span>
                          </div>
                        </div>
                        <div className="relative w-10 h-10 animate-pulse-slow">
                          <Image src="/star.png" alt="Space" fill className="object-contain drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Topic Bubbles - Clay Style */}
            {selectedEmotion && (
              <div className="mb-6">
                <p className="text-lg font-bold text-purple-800 mb-3">What do you want to talk about?</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleTopicSelect('math')}
                    className="px-5 py-3 bg-blue-300 text-blue-800 rounded-full text-lg font-bold border-4 border-blue-400 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 transform hover:-rotate-3"
                  >
                    Math Help 🔢
                  </button>
                  <button 
                    onClick={() => handleTopicSelect('ideas')} 
                    className="px-5 py-3 bg-purple-300 text-purple-800 rounded-full text-lg font-bold border-4 border-purple-400 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 transform hover:rotate-3"
                  >
                    Cool Ideas 💡
                  </button>
                  <button
                    onClick={() => handleTopicSelect('robots')}
                    className="px-5 py-3 bg-orange-300 text-orange-800 rounded-full text-lg font-bold border-4 border-orange-400 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 transform hover:-rotate-3"
                  >
                    Robots 🤖
                  </button>
                  <button
                    onClick={() => handleTopicSelect('space')}
                    className="px-5 py-3 bg-indigo-300 text-indigo-800 rounded-full text-lg font-bold border-4 border-indigo-400 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 transform hover:rotate-3"
                  >
                    Space 🪐
                  </button>
                </div>
              </div>
            )}
            
            {/* Input Area - Clay Style */}
            {selectedEmotion && (
              <div className={`${clayCard} border-yellow-400 bg-yellow-100 p-6 transform -rotate-1`}>
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex gap-3 w-full items-stretch">
                    <div className="flex items-center space-x-2 w-full">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask me anything..."
                          className={`${clayInput} pr-16`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors",
                            isListening ? "bg-red-100 text-red-600" : "text-gray-500 hover:bg-gray-100"
                          )}
                          aria-label={isListening ? "Stop listening" : "Start voice input"}
                        >
                          {isListening ? (
                            <MicOff className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={isLoading || !question.trim()}
                          className={`bg-yellow-400 hover:bg-yellow-500 text-gray-900 ${clayButton}`}
                        >
                          {isLoading ? 'Thinking...' : 'Send'}
                        </Button>
                        <Button
                          type="button"
                          variant={isVoiceEnabled ? "default" : "outline"}
                          size="icon"
                          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                          className={cn("rounded-full", clayShadow, {
                            "bg-blue-500 text-white hover:bg-blue-600": isVoiceEnabled,
                            "bg-white text-gray-700 hover:bg-gray-100": !isVoiceEnabled
                          })}
                          aria-label={isVoiceEnabled ? "Disable voice" : "Enable voice"}
                        >
                          {isVoiceEnabled ? (
                            <Volume2 className="h-5 w-5" />
                          ) : (
                            <VolumeX className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!question.trim() || isLoading}
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center 
                        bg-gradient-to-br from-green-400 to-green-500 text-white 
                        border-4 border-green-600 shadow-lg hover:shadow-xl 
                        transition-all transform hover:scale-105 active:scale-95 
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
                        className={`transition-transform duration-200 ${!question.trim() || isLoading ? 'opacity-70' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`}
                      >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}
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
    </main>
  )
}
