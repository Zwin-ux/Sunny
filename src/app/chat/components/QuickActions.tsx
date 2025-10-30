'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Target, Gamepad2, Brain, TrendingUp } from 'lucide-react';
import { saveChatMessage } from '@/lib/chat-persistence';

interface QuickActionsProps {
  visible?: boolean;
  onActionClick?: (action: string) => void;
}

const QUICK_ACTIONS = [
  {
    id: 'mission',
    label: 'Start Mission',
    icon: Target,
    route: '/missions',
    message: 'Starting a new mission! 🎯',
    color: 'text-blue-600',
    emoji: '🎯',
  },
  {
    id: 'game',
    label: 'Play Game',
    icon: Gamepad2,
    route: '/games',
    message: 'Launching a learning game! 🎮',
    color: 'text-green-600',
    emoji: '🎮',
  },
  {
    id: 'review',
    label: 'Review Mistakes',
    icon: Brain,
    route: '/progress',
    message: 'Reviewing recent mistakes 🧠',
    color: 'text-purple-600',
    emoji: '🧠',
  },
  {
    id: 'progress',
    label: 'View Progress',
    icon: TrendingUp,
    route: '/progress',
    message: 'Opening your progress 📈',
    color: 'text-orange-600',
    emoji: '📈',
  },
];

export function QuickActions({ visible = true, onActionClick }: QuickActionsProps) {
  const router = useRouter();

  if (!visible) return null;

  const handleActionClick = async (action: typeof QUICK_ACTIONS[0]) => {
    // Notify parent component
    onActionClick?.(action.id);

    // Save to chat history
    await saveChatMessage('assistant', action.message);

    // Navigate to route
    router.push(action.route);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2"
    >
      {QUICK_ACTIONS.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant="outline"
            className="w-full border-2 border-black hover:scale-105 transition-transform flex items-center gap-2"
            onClick={() => handleActionClick(action)}
          >
            <span className="text-lg">{action.emoji}</span>
            <span className="hidden md:inline">{action.label}</span>
            <span className="md:hidden text-xs font-bold">
              {action.label.split(' ')[0]}
            </span>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
