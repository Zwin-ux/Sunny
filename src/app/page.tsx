"use client";

import { useState, useEffect, useRef, useCallback, Suspense, Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from '@/components/chat-message';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Award, Mic, MicOff, Settings, Lightbulb, BookOpen, XCircle } from 'lucide-react';

// Hooks
import { useLearningChat } from '@/hooks/useLearningChat';
import { useLearningSession } from '@/contexts/LearningSessionContext';


// Utils
import { cn } from "@/lib/utils";
import { mockChatHistory, mockLessons, mockTopics } from "@/lib/demo-mode";

// #region --- TYPE DEFINITIONS ---

import { Message, UserMessage, AssistantMessage, ChallengeMessage, FeedbackMessage, FeedbackContent, Challenge, StudentProfile, UIMessage, MessageType } from '@/types/chat';


// type ChatMessage = Message; // Redundant, use Message directly

type Lesson = {
  id: string;
  title: string;
  description: string;
  content: any[];
  completed?: boolean;
  // Extended properties for demo mode
  subject?: string;
  duration?: string;
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

const EmotionSelector = dynamic(() => import('../components/emotion-selector').then(mod => mod.default as React.FC<EmotionSelectorProps>), { ssr: false });
const SunnyCharacter = dynamic(() => import('../components/sunny-character').then(mod => mod.default as React.FC<SunnyCharacterProps>), { ssr: false });
const ContentRenderer = dynamic(() => import('../components/interactive/ContentRenderer'), { ssr: false });

// #endregion

// #region --- UI STYLES ---

const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-lg border-2 border-black px-6 py-2 font-bold transition-all duration-200 ${clayShadow} hover:shadow-md hover:translate-y-[-2px]`;
const clayInput = `rounded-lg border-2 border-black w-full p-2 bg-white text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 shadow-sm ${clayShadow} hover:shadow-md`;

// #endregion

// #region --- HELPER FUNCTIONS ---

// Convert Message to UIMessage for ChatMessage component
const convertToUIMessage = (message: Message): UIMessage => {
  let content = '';
  
  if (typeof message.content === 'string') {
    content = message.content;
  } else if (message.type === 'challenge') {
    const challenge = message.content as Challenge;
    content = challenge.question;
  } else if (message.type === 'feedback') {
    const feedback = message.content as FeedbackContent;
    content = feedback.message;
  }

  return {
    id: message.id,
    role: message.role || 'assistant',
    content,
    name: message.name,
    timestamp: message.timestamp,
    type: message.type,
    isLoading: message.isLoading
  };
};

// #endregion

function Chat() {
  const { 
    currentLesson, 
    currentContentIndex: currentStep, 
    isLessonInProgress: isInLesson, 
    goToNextContent: nextStep, 
    goToPreviousContent: previousStep 
  } = useLearningSession();

  // State for tracking demo mode in the UI
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: 'Alex', level: 5, completedLessons: [], points: 150,
    emotion: 'happy', learningStyle: 'visual', difficulty: 'easy',
    preferredLearningStyle: 'visual', knownConcepts: [], knowledgeGaps: [],
    conversationHistory: [],
  });
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>('happy');
  
  // State for recommended lessons in demo mode
  const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (speechSynthesisRef.current && voiceMode) {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current.speak(utterance);
    }
  }, [voiceMode]);



  const onNewMessage = useCallback((message: Message) => {
    let chatMessage: Message;

    if (message.type === 'challenge') {
      chatMessage = message;
    } else if (message.type === 'feedback') {
      chatMessage = message;
    } else {
      chatMessage = message;
    }

    setMessages(prev => [...prev, chatMessage]);

    // If voice mode is on, speak the message
    if (voiceMode && typeof message.content === 'string') {
      speak(message.content);
    }
  }, [speak]);
  
  // Use the learning chat hook
  const { handleUserMessage, isProcessing } = useLearningChat(onNewMessage, studentProfile);

  useEffect(() => {
    if (typeof window === 'undefined' || !voiceMode) return;

    speechSynthesisRef.current = window.speechSynthesis;
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setVoiceError("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionImpl();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const results = event.results;
        if (results && results.length > 0) {
          const transcript = Array.from(results).map((r: any) => r[0]?.transcript || '').join('');
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceError(`Speech error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (isDemoMode) {
        handleDemoMessage(input);
      } else {
        handleUserMessage(input);
      }
      setInput('');
    }
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
  const handleQuizAnswer = (isCorrect: boolean, questionId: string, challenge: Challenge, userAnswer: string | string[]) => {
    // handleChatQuizAnswer(isCorrect, questionId, challenge, userAnswer);
  };

  // Initialize demo mode with mock data
  const initializeDemoMode = useCallback(() => {
    // Convert mock chat history to Message objects
    // Use type assertions to ensure compatibility with Message type
    const initialMessages = mockChatHistory.map((msg, index) => {
      const baseMsg = {
        id: `demo-${index}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: Date.now() - (mockChatHistory.length - index) * 60000,
        name: msg.role === 'assistant' ? 'Sunny' : ''
      };
      
      // Create properly typed messages based on role
      if (msg.role === 'user') {
        return {
          ...baseMsg,
          type: 'user',
          role: 'user'
        } as UserMessage;
      } else {
        return {
          ...baseMsg,
          type: 'assistant',
          role: 'assistant'
        } as AssistantMessage;
      }
    });
    
    setMessages(initialMessages);
    // Cast mockLessons to match the Lesson type structure
    const typedLessons = mockLessons.map(lesson => {
      // Convert the complex content object to an array as required by Lesson type
      // Add proper null checks to avoid 'Cannot read properties of undefined (reading 'length')' error
      const contentArray = [];
      
      if (lesson && lesson.content) {
        // Add text content if available
        if (lesson.content.description) {
          contentArray.push({
            type: 'text',
            value: lesson.content.description
          });
        }
        
        // Add objectives if available
        if (Array.isArray(lesson.content.objectives)) {
          contentArray.push({
            type: 'objectives',
            value: lesson.content.objectives
          });
        }
        
        // Add activities if available
        if (Array.isArray(lesson.content.activities)) {
          lesson.content.activities.forEach(activity => {
            if (activity) {
              contentArray.push({
                type: 'activity',
                value: activity
              });
            }
          });
        }
      }
      
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.subject || '', // Use subject as description with fallback
        content: contentArray,
        subject: lesson.subject,
        duration: lesson.duration,
        completed: false // Add required property
      } as Lesson;
    });
    setRecommendedLessons(typedLessons);
    setIsDemoMode(true);
    
    toast.info('Demo mode active - using sample content', {
      duration: 5000,
      position: 'top-center',
    });
  }, []);

  // Handle demo mode messages with mock responses
  const handleDemoMessage = useCallback((text: string) => {
    // Create a properly typed UserMessage
    const userMessage: UserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'user',
      name: ''
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response with a delay
    // Create a properly typed AssistantMessage
    const loadingMessage: AssistantMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      type: 'assistant',
      isLoading: true,
      name: 'Sunny'
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    // Generate a demo response based on user input
    setTimeout(() => {
      const demoResponses: Record<string, string> = {
        'teach me about bees': "Bees are amazing insects that live in colonies! They're super important because they pollinate plants, which helps our food grow. A beehive has three types of bees: the queen bee who lays all the eggs, worker bees who collect nectar and make honey, and drone bees. Would you like to learn about how bees make honey?",
        'quiz me': "I'd love to quiz you! Let's try a fun science question: What gas do plants give off that humans and animals breathe in? A) Oxygen B) Carbon Dioxide C) Nitrogen D) Hydrogen",
        'what can you teach me?': "I can teach you about lots of fun topics! I know about science things like animals, plants, and space. I can help with math problems and puzzles. We can explore history, learn about different countries, or even talk about technology and how things work. What sounds interesting to you?"
      };
      
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMessage.id));
      
      // Find a matching response or generate a generic one
      let responseContent = demoResponses[text.toLowerCase()];
      
      if (!responseContent) {
        if (text.toLowerCase().includes('robot')) {
          responseContent = "Robots are amazing machines that can be programmed to do all sorts of tasks! Some robots look like humans, while others might look like animals or just have arms to help in factories. Would you like to learn about how robots work or see some cool robot examples?"; 
        } else if (text.toLowerCase().includes('space')) {
          responseContent = "Space is so vast and fascinating! Our solar system has 8 planets orbiting around the Sun. Earth is the third planet from the Sun and the only one we know has life. Would you like to learn about the other planets, stars, or maybe black holes?"; 
        } else if (text.toLowerCase().includes('math')) {
          responseContent = "Math is like a super power that helps us solve all kinds of problems! We can use it to count things, measure sizes, or even understand patterns. What kind of math are you interested in learning about?"; 
        } else if (text.toLowerCase().includes('pattern game')) {
          responseContent = "The Pattern Game helps you learn to identify and create patterns using numbers and shapes. You'll start by recognizing repeating patterns, then create your own, and finally solve pattern-based puzzles. It's a fun way to build your math skills!"; 
        } else if (text.toLowerCase().includes('robot fun')) {
          responseContent = "In Robot Fun, you'll learn how robots work and program simple commands. We'll explore robot components, basic programming concepts, and you'll even get to control a virtual robot! It's perfect for young engineers and programmers."; 
        } else if (text.toLowerCase().includes('space adventure')) {
          responseContent = "Space Adventure takes you on a journey through our solar system! You'll learn about planets, stars, and space travel. The interactive tour lets you explore each planet, and there's a fun quiz at the end to test your new knowledge about space!"; 
        } else {
          responseContent = `That's an interesting question about "${text}"! I'd love to explore this topic with you. What specific part would you like to learn about first?`;
        }
      }
      
      // Create a properly typed AssistantMessage
      const aiResponse: AssistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        type: 'assistant',
        name: 'Sunny'
      };
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  }, []);

  useEffect(() => {
    // Initialize with a welcome message or demo content
    const checkApiStatus = async () => {
      try {
        // Try to fetch user profile to check if API is working
        const response = await fetch('/api/user?id=demo-check');
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if we're in demo mode based on response
          if (data.demo === true) {
            initializeDemoMode();
          } else {
            // Normal initialization with welcome message
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: "Hi there! I'm Sunny! What would you like to learn about today?",
                timestamp: Date.now(),
                type: 'assistant',
                name: 'Sunny'
              } as AssistantMessage
            ]);
            
            // Fetch recommended lessons
            fetchRecommendedLessons();
          }
        } else {
          // API error, use demo mode
          initializeDemoMode();
        }
      } catch (error) {
        console.error('Error checking API status:', error);
        initializeDemoMode();
      }
    };
    
    checkApiStatus();
  }, [initializeDemoMode]);
  
  // Fetch recommended lessons from API
  const fetchRecommendedLessons = async () => {
    try {
      // This would typically come from an API
      // For now, we'll just set some placeholder lessons
      setRecommendedLessons([
        {
          id: 'math-patterns',
          title: 'Pattern Game',
          description: 'Learn to identify patterns',
          content: [],
        },
        {
          id: 'robot-fun',
          title: 'Robot Fun',
          description: 'Learn about robots',
          content: [],
        },
        {
          id: 'space-adventure',
          title: 'Space Adventure',
          description: 'Explore the solar system',
          content: [],
        },
      ]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      // Use mock lessons as fallback
      // Convert mock lessons to proper Lesson type
      setRecommendedLessons(mockLessons.map(lesson => {
        // Convert the complex content object to an array as required by Lesson type
        // Add proper null checks to avoid 'Cannot read properties of undefined (reading 'length')' error
        const contentArray = [];
        
        if (lesson && lesson.content) {
          // Add text content if available
          if (lesson.content.description) {
            contentArray.push({
              type: 'text',
              value: lesson.content.description
            });
          }
          
          // Add objectives if available
          if (Array.isArray(lesson.content.objectives)) {
            contentArray.push({
              type: 'objectives',
              value: lesson.content.objectives
            });
          }
          
          // Add activities if available
          if (Array.isArray(lesson.content.activities)) {
            lesson.content.activities.forEach(activity => {
              if (activity) {
                contentArray.push({
                  type: 'activity',
                  value: activity
                });
              }
            });
          }
        }
        
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.subject || '',
          content: contentArray,
          subject: lesson.subject,
          duration: lesson.duration,
          completed: false
        } as Lesson;
      }));
    }
  };

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
            <div className="flex justify-between items-center"><Badge>Level {studentProfile.level}</Badge><span className="font-semibold">{studentProfile.points} pts</span></div>
            <div className="flex flex-wrap gap-2">
              {studentProfile.completedLessons.map((lesson, index) => <Badge key={index}> <Award className="w-4 h-4 mr-1"/> {lesson.title}</Badge>)}
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-lg mb-2">Fun Lessons for You!</h3>
          <div className="space-y-2">
            {recommendedLessons.map((lesson, index) => {
              // Assign different background colors based on index
              const bgColors = ['bg-green-100 hover:bg-green-200', 'bg-blue-100 hover:bg-blue-200', 'bg-purple-100 hover:bg-purple-200'];
              const bgColor = bgColors[index % bgColors.length];
              
              return (
                <div 
                  key={lesson.id}
                  className={`${bgColor} p-3 rounded-lg border-2 border-black shadow-md cursor-pointer transition-colors`}
                  onClick={() => {
                    // Handle lesson selection
                    toast.success(`Selected lesson: ${lesson.title}`, { duration: 2000 });
                    if (isDemoMode) {
                      handleDemoMessage(`Tell me about ${lesson.title}`);
                    } else {
                      handleUserMessage(`Tell me about ${lesson.title}`);
                    }
                  }}
                >
                  <div className="font-bold">{lesson.title}</div>
                  <div className="text-sm">{lesson.subject || 'Learning'} • {lesson.duration || '15 min'}</div>
                </div>
              );
            })}
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
              <ChatMessage
                key={message.id}
                message={convertToUIMessage(message)}
                isUser={message.role === 'user'}
              />
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
            <button onClick={() => setVoiceMode(!voiceMode)} className={cn(clayButton, voiceMode ? 'bg-green-400' : 'bg-gray-200', 'p-2')} title={voiceMode ? 'Disable Voice Mode' : 'Enable Voice Mode'}>
              {voiceMode ? <Mic className="w-5 h-5"/> : <MicOff className="w-5 h-5"/>}
            </button>
            <Button type="submit" className={`${clayButton} bg-blue-500 text-white hover:bg-blue-600`} disabled={!input.trim() || isProcessing}>Send</Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {["Teach me about bees", "Quiz me", "What can you teach me?"].map((suggestion) => (
              <button 
                key={suggestion} 
                onClick={() => isDemoMode ? handleDemoMessage(suggestion) : handleUserMessage(suggestion)} 
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors border border-gray-300"
              >
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
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-bounce mb-4">
          <span className="text-6xl">☀️</span>
        </div>
        <div className="text-2xl font-bold">Loading Sunny...</div>
        <div className="mt-2 text-gray-600">Your friendly AI tutor is getting ready!</div>
      </div>
    }>
      <Chat />
    </Suspense>
  );
}