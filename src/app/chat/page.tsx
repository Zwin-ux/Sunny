'use client';

import { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { loadChatMessages, saveChatMessage } from '@/lib/chat-persistence';
import { getProgressKey, setProgressKey } from '@/lib/persistence';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// New modular components
import { ChatHeader } from './components/ChatHeader';
import { EmotionSelector, type Emotion } from './components/EmotionSelector';
import { ChatMessages, type Message } from './components/ChatMessages';
import type { GeneratedGame } from '@/lib/chat/game-generator';
import { QuickActions } from './components/QuickActions';
import { ChatInput } from './components/ChatInput';
import { MobileStats } from './components/MobileStats';

// Agent integration components
import { AgenticChatInterface } from './components/AgenticChatInterface';
import { StudentProfile } from '@/types/chat';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v2';

function ChatPageContent() {
  const router = useRouter();

  // State
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
  const [useAgenticSystem, setUseAgenticSystem] = useState(true); // Toggle for agent system
  const [agentActions, setAgentActions] = useState<string[]>([]);

  // Initialize user and load chat history
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
      const history = await loadChatMessages(50);
      if (history.length) {
        const restored = history.map((m: any, idx: number) => ({
          id: m.id || `db-${idx}`,
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content as string,
          timestamp: new Date(m.created_at || Date.now()),
        }));
        setMessages(restored);
      } else {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Hi ${currentUser.name || 'there'}! ☀️ I'm Sunny, your AI learning companion! How are you feeling today?`,
            timestamp: new Date(),
          },
        ]);
      }
    })();
  }, [router]);

  // Listen for XP events and surface in chat
  useEffect(() => {
    const onXP = (e: Event) => {
      const detail: any = (e as CustomEvent).detail || {};
      const msg: Message = {
        id: `xp-${Date.now()}`,
        role: 'assistant',
        content: `You earned +${detail.amount} XP${detail.reason ? ` — ${detail.reason}` : ''}! Great work!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      saveChatMessage('assistant', msg.content, 'chat', { kind: 'xp' });
    };
    window.addEventListener('sunny:xp' as any, onXP as any);
    return () => window.removeEventListener('sunny:xp' as any, onXP as any);
  }, []);

  // Slash command handler
  const handleSlash = async (text: string) => {
    const parts = text.trim().slice(1).split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(' ');
    if (!cmd) return false;

    const say = async (content: string) => {
      const m = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, m]);
      await saveChatMessage('assistant', content);
    };

    switch (cmd) {
      case 'mission':
        await say('Starting a new mission! 🎯');
        router.push('/missions');
        return true;
      case 'game':
        await say(`Launching a learning game${arg ? ` about ${arg}` : ''}! 🎮`);
        router.push(`/games${arg ? `?topic=${encodeURIComponent(arg)}` : ''}`);
        return true;
      case 'progress':
        await say('Opening your progress dashboard 📈');
        router.push('/progress');
        return true;
      case 'quiz': {
        setShowTyping(true);
        const res = await fetch('/api/chat/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: arg || 'math',
            difficulty: 'easy',
            learningStyle: 'visual',
            studentId: user?.id || user?.name || 'anon',
          }),
        });
        const json = await res.json().catch(() => ({}));
        setShowTyping(false);
        if (json?.challenge) {
          setInlineQuizzes((prev) => [
            ...prev,
            { id: `quiz-${Date.now()}`, challenge: { ...json.challenge, id: `q-${Date.now()}` } },
          ]);
          await say(`Here's a quick quiz on ${arg || 'learning'}! ✨`);
        } else {
          await say('Hmm, I could not prepare a quiz right now. Try again!');
        }
        return true;
      }
      case 'goal': {
        const keyUser = user?.id || user?.name;
        if (!keyUser || !arg) {
          await say('Usage: /goal <what you want to achieve>');
          return true;
        }
        const existing = (await getProgressKey<any>(keyUser, 'goals')) || [];
        const next = Array.isArray(existing)
          ? [...existing, { text: arg, at: new Date().toISOString() }]
          : [{ text: arg, at: new Date().toISOString() }];
        await setProgressKey(keyUser, 'goals', next);
        await say('Saved as a learning goal ⭐');
        return true;
      }
      case 'confused': {
        const keyUser = user?.id || user?.name;
        if (!keyUser || !arg) {
          await say('Usage: /confused <what is confusing>');
          return true;
        }
        const existing = (await getProgressKey<any>(keyUser, 'misunderstandings')) || [];
        const next = Array.isArray(existing)
          ? [...existing, { text: arg, at: new Date().toISOString() }]
          : [{ text: arg, at: new Date().toISOString() }];
        await setProgressKey(keyUser, 'misunderstandings', next);
        await say("Thanks for telling me! I'll help you with that 🧠");
        return true;
      }
      default:
        await say(
          'Unknown command. Try /mission, /game, /quiz <topic>, /progress, /goal <text>, /confused <text>.'
        );
        return true;
    }
  };

  // Main send message handler
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      emotion: selectedEmotion || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    saveChatMessage('user', userMessage.content);
    setInput('');
    setIsLoading(true);
    setShowTyping(true);
    setMessagesCount((prev) => prev + 1);

    // Slash commands
    if (userMessage.content.startsWith('/')) {
      try {
        await handleSlash(userMessage.content);
      } finally {
        setIsLoading(false);
        setShowTyping(false);
      }
      return;
    }

    try {
      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          emotion: selectedEmotion,
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = (await response.json()) as {
        kind?: 'text' | 'game';
        message?: string;
        content?: string;
        game?: GeneratedGame;
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content || "I'm here to help!",
        timestamp: new Date(),
        game: data.game,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      const messageType = data.kind === 'game' ? 'game' : 'chat';
      saveChatMessage('assistant', assistantMessage.content, messageType, data.kind === 'game'
        ? { gameId: data.game?.id, topic: data.game?.topic, difficulty: data.game?.difficulty }
        : undefined);

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
      toast.error("Oops! Something went wrong. Let's try again!");

      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now, but I'm still here to help! Can you try asking that again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  };

  // Voice input handler
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

  // Quiz answer handler
  const handleQuizAnswer = (isCorrect: boolean, qid: string, q: any, userAnswer: string | string[]) => {
    const msg = isCorrect ? 'Great job! ✅' : "Good try! Let's review.";
    const text = `${msg} ${q.explanation}`;
    setMessages((prev) => [
      ...prev,
      { id: `fb-${Date.now()}`, role: 'assistant', content: text, timestamp: new Date() },
    ]);
    saveChatMessage('assistant', text, 'feedback', {
      quiz: { id: qid, topic: q.question, answer: userAnswer, correct: isCorrect },
    });
  };

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
      <ChatHeader
        xp={xp}
        streak={streak}
        isSpeaking={isSpeaking}
        onToggleSpeaking={() => setIsSpeaking(!isSpeaking)}
        appVersion={APP_VERSION}
      />

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl w-full mx-auto px-4 md:px-6 py-6">
        {/* Agent Integration Interface */}
        {useAgenticSystem && user && (
          <AgenticChatInterface
            studentId={user.id || user.name || 'default'}
            studentProfile={{
              name: user.name || 'Student',
              level: user.level || 1,
              points: xp,
              completedLessons: [],
              emotion: selectedEmotion || 'neutral',
              learningStyle: user.learningStyle || 'visual',
              difficulty: user.difficulty || 'medium',
            } as StudentProfile}
            onAgentResponse={(response, actions) => {
              setAgentActions(actions);
            }}
            showProgress={true}
            className="mb-4"
          />
        )}

        {/* Emotion Selector */}
        <EmotionSelector
          selectedEmotion={selectedEmotion}
          onEmotionChange={setSelectedEmotion}
          collapsed={true} // Starts collapsed to save space
        />

        {/* Messages */}
        <ChatMessages
          messages={messages}
          showTyping={showTyping || isLoading}
          inlineQuizzes={inlineQuizzes}
          onQuizAnswer={handleQuizAnswer}
          showSuggestedPrompts={messages.length === 1}
          onPromptClick={setInput}
        />

        {/* Quick Actions */}
        <QuickActions visible={true} />

        {/* Input Area */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onVoiceToggle={toggleVoiceInput}
          isListening={isListening}
          isLoading={isLoading}
          showSmartSuggestions={true}
        />
      </div>

      {/* Mobile Stats */}
      <MobileStats
        xp={xp}
        streak={streak}
        messagesCount={messagesCount}
        isSpeaking={isSpeaking}
        onToggleSpeaking={() => setIsSpeaking(!isSpeaking)}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">Loading...</div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
