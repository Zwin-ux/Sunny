/**
 * Tab Navigation - Learning OS app switcher
 * Shows tabs for Chat, Games, Stories, Lab, Progress
 */

'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, Gamepad2, BookOpen, FlaskConical, TrendingUp, Target, Settings } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
}

const TABS: Tab[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCircle className="w-5 h-5" />,
    route: '/chat'
  },
  {
    id: 'games',
    label: 'Games',
    icon: <Gamepad2 className="w-5 h-5" />,
    route: '/games'
  },
  {
    id: 'stories',
    label: 'Stories',
    icon: <BookOpen className="w-5 h-5" />,
    route: '/stories'
  },
  {
    id: 'missions',
    label: 'Missions',
    icon: <Target className="w-5 h-5" />,
    route: '/missions'
  },
  {
    id: 'focus',
    label: 'Practice',
    icon: <FlaskConical className="w-5 h-5" />,
    route: '/focus'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: <TrendingUp className="w-5 h-5" />,
    route: '/progress'
  }
  ,
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    route: '/settings'
  }
];

export function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = TABS.find(tab => pathname.startsWith(tab.route))?.id || 'chat';

  return (
    <div className="border-b-2 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-1" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.route)}
                className={`
                  relative px-6 py-4 flex items-center gap-2 font-bold text-sm
                  transition-all duration-200
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
              >
                {tab.icon}
                <span>{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/**
 * App Shell - Wrapper for all app pages with navigation
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex flex-col">
      <TabNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
