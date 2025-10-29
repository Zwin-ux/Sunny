'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Image from 'next/image';
import { 
  Send, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Mic, 
  MicOff, 
  Smile, 
  Zap,
  Brain,
  Target,
  ArrowLeft,
  Volume2,
  VolumeX,
  Lightbulb,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartSuggestions from '@/components/chat/SmartSuggestions'
import { loadChatMessages, saveChatMessage } from '@/lib/chat-persistence'
import TypingIndicator from '@/components/typing-indicator'
import Quiz from '@/components/interactive/Quiz'
import { getProgressKey, setProgressKey } from '@/lib/persistence'
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
};

type Emotion = 'happy' | 'focused' | 'confused' | 'excited' | 'tired' | 'confident';

const EMOTIONS: { id: Emotion; emoji: string; label: string; color: string }[] = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-100 to-orange-100' },
  { id: 'focused', emoji: '🎯', label: 'Focused', color: 'from-blue-100 to-cyan-100' },
  { id: 'confused', emoji: '🤔', label: 'Confused', color: 'from-purple-100 to-pink-100' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'from-green-100 to-teal-100' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-gray-100 to-slate-100' },
  { id: 'confident', emoji: '💪', label: 'Confident', color: 'from-orange-100 to-red-100' },
];

function ChatPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [inlineQuizzes, setInlineQuizzes] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Load user stats from localStorage
    const savedXP = localStorage.getItem('userXP');
    const savedStreak = localStorage.getItem('userStreak');
    if (savedXP) setXp(parseInt(savedXP));
    if (savedStreak) setStreak(parseInt(savedStreak));

    // Load persisted chat history; if none, show welcome
    (async () => {
      const history = await loadChatMessages(50)
      if (history.length) {
        const restored = history.map((m: any, idx: number) => ({
          id: m.id || `db-${idx}`,
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content as string,
          timestamp: new Date(m.created_at || Date.now()),
        }))
        setMessages(restored)
      } else {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Hi ${currentUser.name || 'there'}! ☀️ I'm Sunny, your AI learning companion! How are you feeling today?`,
          timestamp: new Date(),
        }])
      }
    })()
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSlash = async (text: string) => {
    const parts = text.trim().slice(1).split(/\s+/)
    const cmd = parts[0]?.toLowerCase()
    const arg = parts.slice(1).join(' ')
    if (!cmd) return false
    const say = async (content: string) => {
      const m = { id: Date.now().toString(), role: 'assistant' as const, content, timestamp: new Date() }
      setMessages(prev => [...prev, m])
      await saveChatMessage('assistant', content)
    }
    switch (cmd) {
      case 'mission':
        await say('Starting a new mission! 🎯')
        router.push('/missions')
        return true
      case 'game':
        await say(`Launching a learning game${arg ? ` about ${arg}` : ''}! 🎮`)
        router.push(`/games${arg ? `?topic=${encodeURIComponent(arg)}` : ''}`)
        return true
      case 'progress':
        await say('Opening your progress dashboard 📈')
        router.push('/progress')
        return true
      case 'quiz': {
        setShowTyping(true)
        const res = await fetch('/api/chat/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: arg || 'math', difficulty: 'easy', learningStyle: 'visual', studentId: user?.id || user?.name || 'anon' }) })
        const json = await res.json().catch(() => ({}))
        setShowTyping(false)
        if (json?.challenge) {
          setInlineQuizzes(prev => [...prev, { id: `quiz-${Date.now()}`, challenge: { ...json.challenge, id: `q-${Date.now()}` } }])
          await say(`Here’s a quick quiz on ${arg || 'learning'}! ✨`)
        } else {
          await say('Hmm, I could not prepare a quiz right now. Try again!')
        }
        return true
      }
      case 'goal': {
        const keyUser = user?.id || user?.name
        if (!keyUser || !arg) { await say('Usage: /goal <what you want to achieve>'); return true }
        const existing = (await getProgressKey<any>(keyUser, 'goals')) || []
        const next = Array.isArray(existing) ? [...existing, { text: arg, at: new Date().toISOString() }] : [{ text: arg, at: new Date().toISOString() }]
        await setProgressKey(keyUser, 'goals', next)
        await say('Saved as a learning goal ⭐')
        return true
      }
      case 'confused': {
        const keyUser = user?.id || user?.name
        if (!keyUser || !arg) { await say('Usage: /confused <what is confusing>'); return true }
        const existing = (await getProgressKey<any>(keyUser, 'misunderstandings')) || []
        const next = Array.isArray(existing) ? [...existing, { text: arg, at: new Date().toISOString() }] : [{ text: arg, at: new Date().toISOString() }]
        await setProgressKey(keyUser, 'misunderstandings', next)
        await say("Thanks for telling me! I'll help you with that 🧠")
        return true
      }
      default:
        await say('Unknown command. Try /mission, /game, /quiz <topic>, /progress, /goal <text>, /confused <text>.')
        return true
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      emotion: selectedEmotion || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    // persist user message
    saveChatMessage('user', userMessage.content)
    setInput('');
    setIsLoading(true);
    setShowTyping(true);
    setMessagesCount(prev => prev + 1);

    // Slash commands
    if (userMessage.content.startsWith('/')) {
      try {
        await handleSlash(userMessage.content)
      } finally {
        setIsLoading(false)
        setShowTyping(false)
      }
      // persist user slash message
      saveChatMessage('user', userMessage.content)
      return;
    }
    // persist user message
    saveChatMessage('user', userMessage.content)

    try {
      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          emotion: selectedEmotion,
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content || 'I\'m here to help!',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      // persist assistant message
      saveChatMessage('assistant', assistantMessage.content)
      
      // Update XP
      const newXP = xp + 10;
      setXp(newXP);
      localStorage.setItem('userXP', newXP.toString());

      // Speak response if enabled
      if (isSpeaking && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(assistantMessage.content);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Oops! Something went wrong. Let\'s try again!');
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now, but I\'m still here to help! Can you try asking that again?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  };

  // Listen for XP events and surface in chat
  useEffect(() => {
    const onXP = (e: Event) => {
      const detail: any = (e as CustomEvent).detail || {}
      const msg: Message = {
        id: `xp-${Date.now()}`,
        role: 'assistant',
        content: `You earned +${detail.amount} XP${detail.reason ? ` — ${detail.reason}` : ''}! Great work!`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg])
      saveChatMessage('assistant', msg.content, 'chat', { kind: 'xp' })
    }
    window.addEventListener('sunny:xp' as any, onXP as any)
    return () => window.removeEventListener('sunny:xp' as any, onXP as any)
  }, [])

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... speak now!');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not hear you. Try again!');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const suggestedPrompts = [
    { icon: '🧮', text: 'Help me with math', color: 'from-blue-100 to-cyan-100' },
    { icon: '📖', text: 'Tell me a story', color: 'from-purple-100 to-pink-100' },
    { icon: '🔬', text: 'Teach me science', color: 'from-green-100 to-teal-100' },
    { icon: '🎨', text: 'Let\'s be creative', color: 'from-orange-100 to-red-100' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Image src="/sun.png" alt="Loading" width={100} height={100} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b-2 border-black px-4 md:px-6 py-4 sticky top-0 z-50 shadow-[0_4px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-2 border-black"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Image src="/sun.png" alt="Sunny" width={40} height={40} className="animate-pulse" />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900">Chat with Sunny ☀️</h1>
              <p className="text-xs md:text-sm text-gray-600">Your AI learning companion</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-gray-900">{xp} XP</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-gray-900">{streak} day streak</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSpeaking(!isSpeaking)}
              className="border-2 border-black"
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl w-full mx-auto px-4 md:px-6 py-6">
        {/* Emotion Selector */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-5 h-5 text-purple-600" />
              <p className="font-bold text-gray-900">How are you feeling?</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`p-3 rounded-xl border-2 border-black transition-all ${
                    selectedEmotion === emotion.id
                      ? `bg-gradient-to-br ${emotion.color} scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
                      : 'bg-white hover:scale-105'
                  }`}
                >
                  <div className="text-2xl mb-1">{emotion.emoji}</div>
                  <div className="text-xs font-semibold text-gray-700">{emotion.label}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Image src="/sun.png" alt="Sunny" width={24} height={24} />
                      <span className="font-bold text-sm">Sunny</span>
                    </div>
                  )}
                  {message.emotion && message.role === 'user' && (
                    <div className="text-xs opacity-80 mb-1">
                      Feeling: {EMOTIONS.find(e => e.id === message.emotion)?.emoji} {EMOTIONS.find(e => e.id === message.emotion)?.label}
                    </div>
                  )}
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Inline mini-quizzes */}
          {inlineQuizzes.map(({ id, challenge }) => (
            <div key={id} className="flex justify-start">
              <div className="max-w-[80%] md:max-w-[70%] bg-white text-gray-900 rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Quiz
                  question={challenge}
                  onAnswer={(isCorrect, qid, q, userAnswer) => {
                    const msg = isCorrect ? 'Great job! ✅' : 'Good try! Let\\'s review.'
                    const text = `${msg} ${q.explanation}`
                    setMessages(prev => [...prev, { id: `fb-${Date.now()}`, role: 'assistant', content: text, timestamp: new Date() }])
                    saveChatMessage('assistant', text, 'feedback', { quiz: { id: qid, topic: q.question, answer: userAnswer, correct: isCorrect } })
                  }}
                />
              </div>
            </div>
          ))}

          {showTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-3 border-2 border-black"><TypingIndicator /></div>
            </div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2">
                  <Image src="/sun.png" alt="Sunny" width={24} height={24} className="animate-spin" />
                  <span className="font-bold text-sm">Sunny is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6"
            >
              {suggestedPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  onClick={() => setInput(prompt.text)}
                  className={`bg-gradient-to-br ${prompt.color} rounded-xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform text-left`}
                >
                  <div className="text-3xl mb-2">{prompt.icon}</div>
                  <p className="font-bold text-gray-900">{prompt.text}</p>
                </motion.button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" className="border-2 border-black" onClick={async () => { await saveChatMessage('assistant', 'Starting a new mission! 🎯'); router.push('/missions') }}>🎯 Start Mission</Button>
          <Button variant="outline" className="border-2 border-black" onClick={async () => { await saveChatMessage('assistant', 'Launching a learning game! 🎮'); router.push('/games') }}>🎮 Play Game</Button>
          <Button variant="outline" className="border-2 border-black" onClick={async () => { await saveChatMessage('assistant', 'Reviewing recent mistakes 🧠'); router.push('/progress') }}>🧠 Review Mistakes</Button>
          <Button variant="outline" className="border-2 border-black" onClick={async () => { await saveChatMessage('assistant', 'Opening your progress 📈'); router.push('/progress') }}>📈 View Progress</Button>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all text-gray-900 placeholder-gray-500"
            />
            <Button
              onClick={toggleVoiceInput}
              variant="outline"
              size="icon"
              className={`border-2 border-black ${isListening ? 'bg-red-100 animate-pulse' : ''}`}
            >
              {isListening ? <MicOff className="w-5 h-5 text-red-600" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Tips */}
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
            <p>
              <strong>Tip:</strong> Tell me how you're feeling to get personalized help! I adapt to your emotions and learning style.
            </p>
          </div>
          <SmartSuggestions onPick={(text) => setInput(text)} />
        </div>
      </div>

      {/* Mobile Stats */}
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
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="border-2 border-black"
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
