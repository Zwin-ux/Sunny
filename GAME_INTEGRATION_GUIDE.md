# 🎮 Game System Integration Guide

## Quick Start - Add Games to Chat Interface

### Step 1: Import the Hook and Component

```tsx
// In src/app/chat/page.tsx or your chat component

import { useGameSession } from '@/hooks/useGameSession';
import { GameContainer } from '@/components/games/GameContainer';
```

### Step 2: Add Hook to Your Component

```tsx
export default function ChatPage() {
  // Existing state...
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({...});
  
  // Add game session hook
  const { 
    isGameActive, 
    currentGame, 
    startGame, 
    endGame,
    getPerformanceSummary 
  } = useGameSession(studentProfile.id);

  // ... rest of component
}
```

### Step 3: Detect Game Requests from Agent

```tsx
// In your message handler (useLearningChat or similar)

const handleAgentResponse = async (agentResult: any) => {
  // Check if agent recommends starting a game
  if (agentResult.actions.includes('start_game')) {
    const gameData = agentResult.metadata;
    
    // Start the game
    const result = await startGame(
      gameData.topic || 'general learning',
      gameData.difficulty || 'easy',
      gameData.gameType
    );
    
    if (result.success) {
      // Add message to chat
      onNewMessage({
        role: 'assistant',
        content: `Let's play a ${gameData.gameType} game about ${gameData.topic}! 🎮`,
        timestamp: Date.now()
      });
    }
  }
};
```

### Step 4: Render Game in Chat UI

```tsx
return (
  <div className="chat-container">
    {/* Existing chat messages */}
    <div className="messages">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>

    {/* Game Container - Shows when game is active */}
    {isGameActive && currentGame && (
      <div className="game-overlay">
        <GameContainer
          studentId={studentProfile.id}
          topic={currentGame.config.topic}
          initialDifficulty={currentGame.config.difficulty}
          onComplete={(performance) => {
            // Game finished!
            console.log('Game completed:', performance);
            
            // Get summary
            const summary = getPerformanceSummary();
            
            // Generate response based on performance
            if (performance.accuracy >= 0.85) {
              onNewMessage({
                role: 'assistant',
                content: `🌟 Amazing! You got ${(performance.accuracy * 100).toFixed(0)}% correct! You're really mastering ${currentGame.config.topic}!`,
                timestamp: Date.now()
              });
            } else if (performance.accuracy >= 0.70) {
              onNewMessage({
                role: 'assistant',
                content: `Great job! You got ${(performance.accuracy * 100).toFixed(0)}% correct. Want to try another round?`,
                timestamp: Date.now()
              });
            } else if (performance.frustrationLevel > 0.6) {
              onNewMessage({
                role: 'assistant',
                content: `You did your best! Let's take a break and try something different. What else would you like to learn about?`,
                timestamp: Date.now()
              });
            } else {
              onNewMessage({
                role: 'assistant',
                content: `Good effort! You got ${(performance.accuracy * 100).toFixed(0)}% correct. Let's review ${performance.knowledgeGaps.join(', ')} together.`,
                timestamp: Date.now()
              });
            }
            
            // Update agent system with results
            globalAgentManager.updateStudentProgress(
              studentProfile.id,
              'game_completed',
              performance
            );
            
            // Close game
            endGame();
          }}
          onAdapt={(newDifficulty, reason) => {
            // Difficulty adjusted during game
            onNewMessage({
              role: 'assistant',
              content: `I'm adjusting to ${newDifficulty} difficulty - ${reason}`,
              timestamp: Date.now()
            });
          }}
        />
      </div>
    )}

    {/* Chat input */}
    <div className="chat-input">
      <input 
        type="text" 
        placeholder="Type your message..."
        disabled={isGameActive} // Disable input during game
      />
    </div>
  </div>
);
```

### Step 5: Add Manual Game Triggers (Optional)

```tsx
// Add quick action buttons
<div className="quick-actions">
  <button onClick={() => startGame('math', 'easy', 'math-challenge')}>
    🔢 Math Game
  </button>
  <button onClick={() => startGame('patterns', 'easy', 'pattern-recognition')}>
    🧩 Pattern Game
  </button>
  <button onClick={() => startGame('words', 'easy', 'word-builder')}>
    📝 Word Game
  </button>
  <button onClick={() => startGame('science', 'medium', 'science-experiment')}>
    🔬 Science Game
  </button>
</div>
```

## Advanced Usage

### Custom Game Configuration

```tsx
// Create custom game with specific settings
const customGame = await gameGenerator.generateGame({
  studentId: 'student-123',
  topic: 'multiplication tables',
  difficulty: 'medium',
  gameType: 'math-challenge',
  previousPerformance: lastGamePerformance, // Adapt based on history
  learningObjectives: [
    'Master 5x and 6x tables',
    'Apply to word problems',
    'Build speed and accuracy'
  ],
  timeAvailable: 10 // 10 minutes
});
```

### Listen to Game Events

```tsx
// Track game progress in real-time
useEffect(() => {
  if (currentGame) {
    // Update UI based on game state
    console.log('Current question:', currentGame.state.currentQuestion);
    console.log('Score:', currentGame.state.correctAnswers);
    console.log('Streak:', currentGame.state.currentStreak);
  }
}, [currentGame]);
```

### Integrate with Agent System

```tsx
// The GameAgent automatically monitors and recommends games
// You can also manually trigger game recommendations

const checkForGameRecommendation = async () => {
  const learningState = globalAgentManager.getLearningState(studentProfile.id);
  
  if (learningState) {
    // Check engagement level
    if (learningState.engagementMetrics.currentLevel < 0.6) {
      // Low engagement - start a game
      await startGame('general', 'easy');
      
      onNewMessage({
        role: 'assistant',
        content: "Let's make learning more fun with a game! 🎮",
        timestamp: Date.now()
      });
    }
  }
};
```

## Styling the Game Overlay

```css
/* Add to your CSS */
.game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Make game container responsive */
.game-overlay > div {
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}
```

## Example: Complete Integration

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { GameContainer } from '@/components/games/GameContainer';
import { useLearningChat } from '@/hooks/useLearningChat';
import { globalAgentManager } from '@/lib/agents';

export default function ChatWithGames() {
  const [studentProfile] = useState({
    id: 'student-123',
    name: 'Alex',
    level: 5,
    // ... other profile data
  });

  const { 
    isGameActive, 
    currentGame, 
    startGame, 
    endGame,
    getPerformanceSummary 
  } = useGameSession(studentProfile.id);

  const { messages, sendMessage } = useLearningChat(
    (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    },
    studentProfile
  );

  const handleSendMessage = useCallback(async (text: string) => {
    // Send to agent system
    const result = await globalAgentManager.processStudentMessage(
      studentProfile.id,
      text,
      studentProfile
    );

    // Check for game recommendation
    if (result.actions.includes('start_game')) {
      const gameData = result.metadata;
      await startGame(
        gameData.topic || 'learning',
        gameData.difficulty || 'easy',
        gameData.gameType
      );
    }

    // Send regular message
    await sendMessage(text);
  }, [studentProfile, startGame, sendMessage]);

  return (
    <div className="chat-page">
      {/* Messages */}
      <div className="messages-container">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Game Overlay */}
      {isGameActive && currentGame && (
        <div className="game-overlay">
          <GameContainer
            studentId={studentProfile.id}
            topic={currentGame.config.topic}
            initialDifficulty={currentGame.config.difficulty}
            onComplete={(performance) => {
              // Handle completion
              const accuracy = (performance.accuracy * 100).toFixed(0);
              
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Great job! You scored ${accuracy}%! 🎉`,
                timestamp: Date.now()
              }]);

              // Update agent system
              globalAgentManager.updateStudentProgress(
                studentProfile.id,
                'game_completed',
                performance
              );

              endGame();
            }}
            onAdapt={(newDifficulty, reason) => {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Adjusting to ${newDifficulty} - ${reason}`,
                timestamp: Date.now()
              }]);
            }}
          />
        </div>
      )}

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder={isGameActive ? "Game in progress..." : "Type a message..."}
          disabled={isGameActive}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              handleSendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}
```

## Testing Checklist

- [ ] Game starts when agent recommends it
- [ ] Questions display correctly
- [ ] Answers can be selected and submitted
- [ ] Hints work properly
- [ ] Feedback shows after each answer
- [ ] Progress bar updates
- [ ] Streak counter increments
- [ ] Difficulty adjusts based on performance
- [ ] Game completes and shows summary
- [ ] Chat resumes after game ends
- [ ] Performance data sent to agent system

## Troubleshooting

**Game doesn't start:**
- Check that OpenAI API key is set
- Verify student profile has valid ID
- Check console for errors

**Questions not generating:**
- Falls back to demo questions if API fails
- Check network connectivity
- Verify API key permissions

**Performance not tracking:**
- Ensure gameEngine.recordResult() is called
- Check that session was initialized
- Verify student ID matches

**Difficulty not adapting:**
- Check adaptiveScaling is true in config
- Verify performance thresholds
- Review game state updates

---

**You're all set!** The games system is fully integrated and ready to provide adaptive, engaging learning experiences. 🎮✨
