/**
 * Games Page - Learning OS game library
 * Uses existing GameContainer and useGameSession
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/ui/TabNavigation';
import { useGameSession } from '@/hooks/useGameSession';
import { GameContainer } from '@/components/games/GameContainer';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type GameType = 'pattern-recognition' | 'math-challenge' | 'memory-match' | 'word-builder' | 'science-experiment' | 'creative-challenge';

interface GameOption {
  id: string;
  type: GameType;
  title: string;
  description: string;
  emoji: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const GAME_OPTIONS: GameOption[] = [
  {
    id: 'pattern',
    type: 'pattern-recognition',
    title: 'Pattern Master',
    description: 'Find and complete patterns',
    emoji: '🧩',
    color: 'from-purple-400 to-pink-400',
    difficulty: 'easy'
  },
  {
    id: 'math',
    type: 'math-challenge',
    title: 'Math Challenge',
    description: 'Solve math problems',
    emoji: '🔢',
    color: 'from-blue-400 to-cyan-400',
    difficulty: 'medium'
  },
  {
    id: 'memory',
    type: 'memory-match',
    title: 'Memory Match',
    description: 'Match pairs and remember',
    emoji: '🎴',
    color: 'from-green-400 to-emerald-400',
    difficulty: 'easy'
  },
  {
    id: 'words',
    type: 'word-builder',
    title: 'Word Builder',
    description: 'Build and learn new words',
    emoji: '📝',
    color: 'from-yellow-400 to-orange-400',
    difficulty: 'easy'
  },
  {
    id: 'science',
    type: 'science-experiment',
    title: 'Science Lab',
    description: 'Fun science experiments',
    emoji: '🔬',
    color: 'from-indigo-400 to-purple-400',
    difficulty: 'medium'
  },
  {
    id: 'creative',
    type: 'creative-challenge',
    title: 'Creative Challenge',
    description: 'Express your creativity',
    emoji: '🎨',
    color: 'from-pink-400 to-rose-400',
    difficulty: 'easy'
  }
];

export default function GamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);

  // Get user
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Check for auto-start params from URL
  useEffect(() => {
    const gameType = searchParams.get('type');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');

    if (gameType && user) {
      const gameOption = GAME_OPTIONS.find(g => g.type === gameType);
      if (gameOption) {
        setSelectedGame(gameOption);
      }
    }
  }, [searchParams, user]);

  const {
    isGameActive,
    currentGame,
    startGame,
    endGame,
    getPerformanceSummary
  } = useGameSession(user?.id || 'guest');

  const handleStartGame = async (game: GameOption) => {
    const topic = searchParams.get('topic') || game.title.toLowerCase();
    const difficulty = searchParams.get('difficulty') || game.difficulty;

    console.log(`🎮 Starting game: ${game.type} on ${topic}`);

    const result = await startGame(
      topic,
      difficulty as 'easy' | 'medium' | 'hard',
      game.type
    );

    if (result.success) {
      setSelectedGame(game);
    } else {
      console.error('Failed to start game:', result.error);
    }
  };

  const handleGameComplete = (performance: any) => {
    console.log('🎉 Game completed!', performance);

    const summary = getPerformanceSummary();
    console.log('Performance summary:', summary);

    // TODO: Update student progress in database
    // updateSkillMastery(user.id, performance);

    // End game
    endGame();
    setSelectedGame(null);
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">☀️</div>
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show game if active
  if (isGameActive && currentGame && selectedGame) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back button */}
          <Button
            onClick={() => {
              endGame();
              setSelectedGame(null);
            }}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Game
          </Button>

          {/* Game Container */}
          <GameContainer
            studentId={user.id}
            topic={currentGame.config.topic}
            initialDifficulty={currentGame.config.difficulty}
            onComplete={handleGameComplete}
            onAdapt={(newDifficulty, reason) => {
              console.log(`Difficulty adjusted: ${newDifficulty} - ${reason}`);
            }}
          />
        </div>
      </AppShell>
    );
  }

  // Show game selection
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-5xl font-black mb-4">Game Time!</h1>
          <p className="text-xl text-gray-600">
            Choose a game and let's learn while having fun!
          </p>
        </motion.div>

        {/* Game Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAME_OPTIONS.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden cursor-pointer"
              onClick={() => handleStartGame(game)}
            >
              {/* Gradient Header */}
              <div className={`h-32 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                <div className="text-6xl">{game.emoji}</div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                <p className="text-gray-600 mb-4">{game.description}</p>

                {/* Difficulty Badge */}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold capitalize">
                    {game.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section (if user has played games) */}
        {user.gamesPlayed && user.gamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-8 bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Your Game Stats
            </h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-black text-blue-600">{user.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
              <div>
                <div className="text-4xl font-black text-green-600">{user.gamesWon || 0}</div>
                <div className="text-sm text-gray-600">Games Won</div>
              </div>
              <div>
                <div className="text-4xl font-black text-purple-600">{user.currentStreak || 0}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
