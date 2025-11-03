'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Quiz from '@/components/interactive/Quiz';
import type { GeneratedGame } from '@/lib/chat/game-generator';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
  game?: GeneratedGame;
}

interface ChatMessagesProps {
  messages: Message[];
  showTyping: boolean;
  inlineQuizzes?: any[];
  onQuizAnswer?: (isCorrect: boolean, qid: string, q: any, userAnswer: string | string[]) => void;
  showSuggestedPrompts?: boolean;
  suggestedPrompts?: Array<{
    text: string;
    icon: string;
    color: string;
  }>;
  onPromptClick?: (text: string) => void;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  {
    text: 'Help me with math homework',
    icon: '🔢',
    color: 'from-blue-100 to-cyan-100',
  },
  {
    text: 'Tell me a fun science fact',
    icon: '🔬',
    color: 'from-green-100 to-teal-100',
  },
  {
    text: 'Practice spelling words',
    icon: '📝',
    color: 'from-purple-100 to-pink-100',
  },
  {
    text: 'Read me a story',
    icon: '📚',
    color: 'from-orange-100 to-yellow-100',
  },
];

function GameSummaryCard({ game }: { game: GeneratedGame }) {
  return (
    <div className="mt-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-lg font-bold text-amber-700">{game.title}</h4>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase text-amber-800">
          {game.difficulty}
        </span>
      </div>
      <p className="text-sm text-amber-900">{game.overview}</p>
      <div className="mt-3 grid gap-2 text-sm text-amber-900 md:grid-cols-2">
        <div className="space-y-1">
          <h5 className="font-semibold text-amber-800">Setup</h5>
          <ul className="list-disc pl-5">
            {game.setup.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h5 className="font-semibold text-amber-800">Gameplay</h5>
          <ul className="list-disc pl-5">
            {game.gameplay.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-3 grid gap-3 text-sm text-amber-900 md:grid-cols-3">
        <div>
          <h5 className="font-semibold text-amber-800">Power Ups</h5>
          <ul className="list-disc pl-5">
            {game.powerUps.map((power) => (
              <li key={power}>{power}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-amber-800">Materials</h5>
          <ul className="list-disc pl-5">
            {game.materials.map((material) => (
              <li key={material}>{material}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h5 className="font-semibold text-amber-800">Quick Stats</h5>
          <p><span className="font-semibold">Goal:</span> {game.objective}</p>
          <p><span className="font-semibold">Time:</span> {game.estimatedTime}</p>
          <p><span className="font-semibold">Remix:</span> {game.remix}</p>
        </div>
      </div>
    </div>
  );
}

export function ChatMessages({
  messages,
  showTyping,
  inlineQuizzes = [],
  onQuizAnswer,
  showSuggestedPrompts = false,
  suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS,
  onPromptClick,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  return (
    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
      {/* Messages */}
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white'
                  : 'bg-white text-gray-900'
              }`}
            >
              {/* Assistant Header */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Image src="/sun.png" alt="Sunny" width={24} height={24} />
                  <span className="font-bold text-sm">Sunny</span>
                </div>
              )}

              {/* User Emotion */}
              {message.emotion && message.role === 'user' && (
                <div className="text-xs opacity-80 mb-1">Feeling: {message.emotion}</div>
              )}

              {/* Message Content */}
              <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {message.game && message.role === 'assistant' && <GameSummaryCard game={message.game} />}

              {/* Timestamp */}
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Inline Quizzes */}
      {inlineQuizzes.map(({ id, challenge }) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="max-w-[80%] md:max-w-[70%] bg-white text-gray-900 rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Quiz
              question={challenge}
              onAnswer={(isCorrect, qid, q, userAnswer) => {
                onQuizAnswer?.(isCorrect, qid, q, userAnswer);
              }}
            />
          </div>
        </motion.div>
      ))}

      {/* Typing Indicator */}
      {showTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex justify-start"
        >
          <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Image
                src="/sun.png"
                alt="Sunny"
                width={24}
                height={24}
                className="animate-spin"
              />
              <span className="font-bold text-sm">Sunny is thinking...</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggested Prompts (shown when only 1 message) */}
      {showSuggestedPrompts && messages.length === 1 && (
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
              onClick={() => onPromptClick?.(prompt.text)}
              className={`bg-gradient-to-br ${prompt.color} rounded-xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform text-left`}
            >
              <div className="text-3xl mb-2">{prompt.icon}</div>
              <p className="font-bold text-gray-900">{prompt.text}</p>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
