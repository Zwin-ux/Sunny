'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Folder, 
  FileText, 
  Trophy, 
  MessageSquare,
  ChevronRight,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Answer } from '@/types/demo';

interface LearningPortfolioProps {
  answers: Answer[];
  badges: number;
  worlds: number;
  xp: number;
}

interface PortfolioItem {
  type: 'folder' | 'file';
  name: string;
  icon: any;
  items?: PortfolioItem[];
  date?: string;
  preview?: string;
}

export function LearningPortfolio({ answers, badges, worlds, xp }: LearningPortfolioProps) {
  const correctAnswers = answers.filter(a => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0;

  const portfolio: PortfolioItem[] = [
    {
      type: 'folder',
      name: 'Progress Reports',
      icon: TrendingUp,
      items: [
        {
          type: 'file',
          name: 'Demo Session Results',
          icon: FileText,
          date: 'Today',
          preview: `${correctAnswers}/${answers.length} correct (${accuracy}%)`,
        },
      ],
    },
    {
      type: 'folder',
      name: 'Achievements',
      icon: Trophy,
      items: [
        {
          type: 'file',
          name: 'Badges Earned',
          icon: Trophy,
          date: 'Today',
          preview: `${badges} badges unlocked`,
        },
        {
          type: 'file',
          name: 'Worlds Unlocked',
          icon: Trophy,
          date: 'Today',
          preview: `${worlds} worlds explored`,
        },
      ],
    },
    {
      type: 'folder',
      name: 'Reflections',
      icon: MessageSquare,
      items: [
        {
          type: 'file',
          name: 'What I Learned Today',
          icon: FileText,
          date: 'Today',
          preview: 'Demo experience completed!',
        },
      ],
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Folder className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Learning Portfolio</h2>
          <p className="text-sm text-gray-600">Your learning journey</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{xp}</div>
          <div className="text-xs text-blue-700">Total XP</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{badges}</div>
          <div className="text-xs text-purple-700">Badges</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
          <div className="text-xs text-green-700">Accuracy</div>
        </div>
      </div>

      {/* File System */}
      <div className="space-y-2">
        {portfolio.map((item, index) => (
          <FolderItem key={index} item={item} depth={0} />
        ))}
      </div>

      {/* Coming Soon */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-800">
          <span className="font-semibold">Full portfolio coming soon!</span> Track projects, reflections, and growth over time.
        </p>
      </div>
    </Card>
  );
}

function FolderItem({ item, depth }: { item: PortfolioItem; depth: number }) {
  const Icon = item.icon;
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left
          ${depth > 0 ? 'ml-6' : ''}
        `}
        whileHover={{ x: 2 }}
      >
        {item.type === 'folder' && (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        )}
        <Icon className={`w-5 h-5 ${item.type === 'folder' ? 'text-blue-600' : 'text-gray-600'}`} />
        <span className="flex-1 font-medium text-gray-900">{item.name}</span>
        {item.date && (
          <span className="text-xs text-gray-500">{item.date}</span>
        )}
      </motion.button>

      {item.preview && (
        <div className="ml-12 text-sm text-gray-600 mb-1">
          {item.preview}
        </div>
      )}

      {item.items && isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1"
        >
          {item.items.map((subItem, index) => (
            <FolderItem key={index} item={subItem} depth={depth + 1} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Add React import at the top
import React from 'react';
