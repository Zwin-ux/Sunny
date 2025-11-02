// Custom hook for managing game sessions in chat interface

import { useState, useCallback } from 'react';
import { gameEngine } from '@/lib/games/game-engine';
import { gameGenerator } from '@/lib/games/game-generator';
import {
  GameConfig,
  GameState,
  GameQuestion,
  GamePerformance,
  DifficultyLevel,
  GameType
} from '@/types/game';

export function useGameSession(studentId: string) {
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentGame, setCurrentGame] = useState<{
    config: GameConfig;
    questions: GameQuestion[];
    state: GameState;
  } | null>(null);

  /**
   * Start a new game session
   */
  const startGame = useCallback(async (
    topic: string,
    difficulty: DifficultyLevel = 'easy',
    gameType?: GameType
  ) => {
    try {
      // Create session
      const session = gameEngine.startSession(studentId, difficulty);
      
      // Generate game
      const game = await gameGenerator.generateGame({
        studentId,
        topic,
        difficulty,
        gameType,
        learningObjectives: [
          `Learn about ${topic}`,
          'Practice problem-solving',
          'Build confidence'
        ]
      });

      // Initialize game state
      const state = gameEngine.initializeGame(session.sessionId, game.config);

      setCurrentGame({
        config: game.config,
        questions: game.questions,
        state
      });
      setIsGameActive(true);

      return { success: true, game };
    } catch (error) {
      console.error('Failed to start game:', error);
      return { success: false, error };
    }
  }, [studentId]);

  /**
   * End current game session
   */
  const endGame = useCallback(() => {
    setIsGameActive(false);
    setCurrentGame(null);
  }, []);

  /**
   * Get game performance summary
   */
  const getPerformanceSummary = useCallback((): GamePerformance | null => {
    if (!currentGame) return null;

    // Get session and find latest performance
    const sessions = Array.from((gameEngine as any).sessions.values());
    const currentSession = sessions.find((s: any) => 
      s.games.some((g: any) => g.gameId === currentGame.config.id)
    );

    if (!currentSession) return null;

    return currentSession.performance[currentSession.performance.length - 1] || null;
  }, [currentGame]);

  return {
    isGameActive,
    currentGame,
    startGame,
    endGame,
    getPerformanceSummary
  };
}
