import { useState, useCallback, useEffect, useRef } from 'react';
import { useLearningSession } from '../contexts/LearningSessionContext';
import { Message, UserMessage, AssistantMessage, ChallengeMessage, FeedbackMessage, FeedbackContent, Challenge, StudentProfile } from '../types/chat';
import { Lesson, LessonContent, MediaContent, QuizQuestion, ContentType } from '../types/lesson';
import LessonRepository from '../lib/lessons/LessonRepository';
import intentParser, { Intent, IntentType } from '../lib/nlu/IntentParser';
import { v4 as uuidv4 } from 'uuid';
import { generateMiniChallenge, generateFeedback, generateAgenticSunnyResponse } from '../lib/sunny-ai';
import { globalAgentManager } from '../lib/agents';
// Safety imports
import { validateUserInput, getBlockedInputMessage, logSafetyIncident, detectPromptInjection } from '../lib/safety/input-validator';
import { validateAIResponse, addEmojisIfNeeded } from '../lib/safety/output-validator';
// Learning OS imports
import { interpretIntent, interpretCombined, type RoutingDecision } from '../lib/response-interpreter';
// Game system imports
import type { DifficultyLevel, GameType } from '../types/game';
// Learning Intelligence imports
import {
  analyzeMessage,
  analyzeConversation,
  calculateAdaptiveXP,
  shouldSuggestBreak,
  generateEncouragement,
  type ConversationContext,
  type MessageAnalysis
} from '../lib/learning-intelligence';

export const useLearningChat = (onNewMessage: (message: Message) => void, studentProfile: StudentProfile) => {
  const {
    currentLesson,
    startLesson,
    completeLesson,
    updateProgress,
    currentContentIndex,
    goToNextContent,
    goToPreviousContent,
    goToContent,
  } = useLearningSession();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLessonState, setCurrentLessonState] = useState<{
    lesson: Lesson;
    currentIndex: number;
    isComplete: boolean;
  } | null>(null);
  const [pendingRouting, setPendingRouting] = useState<RoutingDecision | null>(null);
  // Game integration state
  const [pendingGameRequest, setPendingGameRequest] = useState<{
    topic: string;
    difficulty?: DifficultyLevel;
    gameType?: GameType;
  } | null>(null);
  // Focus session integration state
  const [pendingFocusRequest, setPendingFocusRequest] = useState<{
    topic: string;
    duration?: number;
  } | null>(null);

  // 🧠 Learning Intelligence: Track conversation context
  const conversationContextRef = useRef<ConversationContext>({
    recentMessages: [],
    topicsDiscussed: new Map(),
    questionsAsked: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    sessionDuration: 0,
  });
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Sync with learning session context
  useEffect(() => {
    if (currentLesson) {
      setCurrentLessonState({
        lesson: currentLesson,
        currentIndex: currentContentIndex,
        isComplete: false,
      });
    } else {
      setCurrentLessonState(null);
    }
  }, [currentLesson, currentContentIndex]);

  // 🧠 Update session duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const durationMinutes = Math.floor((Date.now() - sessionStartTimeRef.current) / 60000);
      conversationContextRef.current.sessionDuration = durationMinutes;

      // Check if student needs a break
      if (shouldSuggestBreak(conversationContextRef.current)) {
        onNewMessage(createAssistantTextMessage(
          "You've been learning for a while! 🌟 How about taking a quick break? A little rest helps your brain process everything you've learned! 🧠✨"
        ));
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [onNewMessage]);

  const createAssistantTextMessage = (text: string): AssistantMessage => ({
    id: uuidv4(),
    role: 'assistant',
    type: 'assistant',
    content: text,
    timestamp: Date.now(),
    name: 'Sunny',
  });

  const createMessageFromContent = useCallback((contentItem: LessonContent, role: 'assistant' | 'system' = 'assistant') => {
    let content: string | Challenge = contentItem.content as string;
    if (contentItem.type === ContentType.Quiz || contentItem.type === ContentType.Challenge) {
      content = contentItem.content as Challenge;
      return {
        id: contentItem.id,
        role,
        type: 'challenge',
        content,
        timestamp: Number(Date.now()),
        name: 'Sunny',
      } as Message;
    }
    return {
      id: contentItem.id,
      role,
      type: 'assistant',
      content: contentItem.content as string,
      timestamp: Number(Date.now()),
      name: 'Sunny',
    } as Message;
  }, []);

  // Handle starting a new lesson
  const startNewLesson = useCallback((lessonId: string) => {
    const lesson = LessonRepository.getLesson(lessonId);
    if (!lesson) return;

    startLesson(lessonId);

    onNewMessage(createAssistantTextMessage(`Let's learn about ${lesson.title}! ${lesson.description}`));

    if (lesson.content && Array.isArray(lesson.content) && lesson.content.length > 0) {
      onNewMessage(createMessageFromContent(lesson.content[0]));
    }
  }, [onNewMessage, startLesson]);

  const handleNext = useCallback(() => {
    if (!currentLessonState || !currentLessonState.lesson.content || !Array.isArray(currentLessonState.lesson.content) || currentContentIndex >= currentLessonState.lesson.content.length - 1) {
      if (currentLessonState) {
        completeLesson();
        onNewMessage(createAssistantTextMessage("Great job completing the lesson! What would you like to learn about next?"));
      }
      return;
    }
    goToNextContent();
    const nextIndex = currentContentIndex + 1;
    if (currentLessonState.lesson.content[nextIndex]) {
      onNewMessage(createMessageFromContent(currentLessonState.lesson.content[nextIndex]));
    }
  }, [currentLessonState, currentContentIndex, completeLesson, goToNextContent, onNewMessage]);

  const handlePrevious = useCallback(() => {
    if (currentContentIndex > 0) {
      goToPreviousContent();
      const prevIndex = currentContentIndex - 1;
      if (currentLessonState?.lesson.content[prevIndex]) {
        onNewMessage(createMessageFromContent(currentLessonState.lesson.content[prevIndex]));
      }
    }
  }, [currentContentIndex, currentLessonState, goToPreviousContent, onNewMessage]);

  // Handle sending a message using the autonomous agent system
  const handleUserMessage = useCallback(async (message: string) => {
    // 🛡️ SAFETY CHECK 1: Validate user input
    console.log('🛡️ Validating user input for safety...');
    const inputValidation = await validateUserInput(message);

    // Check for prompt injection attempts
    if (detectPromptInjection(message)) {
      console.warn('⚠️ Prompt injection detected:', message);
      inputValidation.safe = false;
      inputValidation.flags.push('prompt_injection');
    }

    if (!inputValidation.safe) {
      console.warn('⚠️ Unsafe input detected:', inputValidation.flags);

      // Log safety incident
      await logSafetyIncident(
        studentProfile.name || 'unknown',
        message,
        inputValidation.flags
      );

      // Show blocked message to user
      const blockedMessage = createAssistantTextMessage(
        getBlockedInputMessage(inputValidation.flags)
      );
      onNewMessage(blockedMessage);
      return; // Block processing
    }

    // Use sanitized version of message
    const safeMessage = inputValidation.sanitized;

    const userMessage: UserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'user',
      content: safeMessage, // Use sanitized message
      timestamp: Date.now(),
      name: 'User',
    };
    onNewMessage(userMessage);

    // 🧠 Track message in conversation context
    conversationContextRef.current.recentMessages.push({
      role: 'user',
      content: safeMessage,
      timestamp: new Date(),
    });
    // Keep only last 20 messages
    if (conversationContextRef.current.recentMessages.length > 20) {
      conversationContextRef.current.recentMessages = conversationContextRef.current.recentMessages.slice(-20);
    }

    // 🧠 Analyze the message for intelligence
    const messageAnalysis = analyzeMessage(safeMessage, conversationContextRef.current);
    console.log('🧠 Message Analysis:', messageAnalysis);

    // Track topics
    if (messageAnalysis.topic) {
      const currentCount = conversationContextRef.current.topicsDiscussed.get(messageAnalysis.topic) || 0;
      conversationContextRef.current.topicsDiscussed.set(messageAnalysis.topic, currentCount + 1);
    }

    setIsProcessing(true);

    try {
      // Handle lesson navigation if in a lesson
      if (currentLessonState) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
          handleNext();
          setIsProcessing(false);
          return;
        } else if (lowerMessage.includes('previous') || lowerMessage.includes('go back')) {
          handlePrevious();
          setIsProcessing(false);
          return;
        }
      }

      // 🧠 USE THE AUTONOMOUS AGENT SYSTEM!
      console.log('🤖 Processing message through agent manager...');

      try {
        // Initialize agent manager if needed
        await globalAgentManager.initialize();

        // Process the message through the multi-agent system
        const agentResult = await globalAgentManager.processStudentMessage(
          studentProfile.name || 'student',
          message,
          studentProfile
        );

        console.log('🎯 Agent recommendations:', agentResult.actions);

        // 🛡️ SAFETY CHECK 2: Validate AI output
        console.log('🛡️ Validating AI response for safety...');
        const outputValidation = await validateAIResponse(agentResult.response);

        let safeResponse = agentResult.response;
        if (!outputValidation.safe && outputValidation.replacement) {
          console.warn('⚠️ Unsafe AI output detected, using replacement');
          safeResponse = outputValidation.replacement;
        } else if (outputValidation.safe) {
          // Add emojis if needed for engagement
          safeResponse = addEmojisIfNeeded(outputValidation.content);
        }

        // Create AI response from agent
        const aiResponse: AssistantMessage = {
          id: uuidv4(),
          role: 'assistant',
          type: 'assistant',
          content: safeResponse, // Use validated/safe response
          timestamp: Date.now(),
          name: 'Sunny',
          metadata: {
            teachingStrategy: 'agentic',
            knowledgeLevel: studentProfile.difficulty,
            topics: [message]
          }
        };

        onNewMessage(aiResponse);

        // 🧠 Award adaptive XP based on message quality
        const adaptiveXP = calculateAdaptiveXP(5, messageAnalysis, conversationContextRef.current);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sunny:xp', {
            detail: {
              amount: adaptiveXP.xp,
              reason: adaptiveXP.reason
            }
          }));
        }

        // 🧠 Handle smart learning actions from analysis
        for (const action of messageAnalysis.suggestedActions) {
          if (action.type === 'focus_session' && action.priority === 'high') {
            console.log('🎯 Auto-suggesting focus session:', action.reason);
            setTimeout(() => {
              onNewMessage(createAssistantTextMessage(
                `I noticed you might be finding ${action.data?.topic} a bit challenging. 🎯 How about we do a quick 20-minute focus session? It'll help you master this topic with fun practice! Want to try it?`
              ));
              if (action.data?.topic) {
                setPendingFocusRequest({
                  topic: action.data.topic,
                  duration: action.data.suggestedDuration || 1200,
                });
              }
            }, 1500);
          } else if (action.type === 'encouragement' && action.priority === 'high') {
            console.log('💪 Providing extra encouragement:', action.reason);
            setTimeout(() => {
              const encouragementMsg = generateEncouragement(conversationContextRef.current);
              onNewMessage(createAssistantTextMessage(encouragementMsg));
            }, 2000);
          } else if (action.type === 'game_suggestion' && action.priority === 'medium') {
            console.log('🎮 Suggesting game to boost engagement:', action.reason);
            setTimeout(() => {
              onNewMessage(createAssistantTextMessage(
                `Hey, let's make this more fun! 🎮 Would you like to play a ${action.data?.topic} game? It's a great way to learn while having a blast!`
              ));
            }, 1500);
          }
        }

        // 🚀 LEARNING OS: Check if intent should trigger app launch
        console.log('🎯 Checking for app routing...');
        const intent = await intentParser.parse(safeMessage);
        console.log('Detected intent:', intent.type, intent.app);

        // 🎮 Check for game requests
        if (intent.type === IntentType.game_time || message.toLowerCase().includes('play game') || message.toLowerCase().includes('game')) {
          console.log('🎮 Game request detected!');
          const topic = intent.entities.topic || 'math';
          const difficulty = intent.entities.difficulty as DifficultyLevel || studentProfile.difficulty || 'easy';

          setPendingGameRequest({
            topic,
            difficulty,
            gameType: undefined, // Let game system choose
          });
        }

        // 🎯 Check for focus session requests
        if (intent.type === IntentType.focus_session || message.toLowerCase().includes('focus session') || message.toLowerCase().includes('practice')) {
          console.log('🎯 Focus session request detected!');
          const topic = intent.entities.topic || 'math';

          setPendingFocusRequest({
            topic,
            duration: 1200, // 20 minutes
          });
        }

        if (intent.app?.shouldNavigate) {
          const routing = interpretIntent(intent);
          console.log('🚀 App launch detected:', routing);

          if (routing.shouldNavigate) {
            setPendingRouting(routing);
          }
        }

        // Handle agent-recommended actions
        for (const action of agentResult.actions) {
          if (action.includes('generate_quiz')) {
            // Generate a challenge based on the conversation
            setTimeout(async () => {
              const topic = message.toLowerCase();
              const difficulty = studentProfile.difficulty || 'easy';
              const learningStyle = studentProfile.learningStyle || 'visual';

              const newChallenge = await generateMiniChallenge(topic, difficulty, learningStyle);
              const challengeMessage: ChallengeMessage = {
                id: uuidv4(),
                role: 'assistant',
                type: 'challenge',
                content: newChallenge,
                timestamp: Date.now(),
                name: 'Sunny',
              };
              onNewMessage(challengeMessage);
            }, 2000);
          } else if (action.includes('adjust_difficulty')) {
            // Difficulty adjustment will be handled by student profile updates
            console.log('📊 Difficulty adjustment recommended:', action);
          }
        }

      } catch (agentError) {
        console.warn('⚠️ Agent processing failed, using fallback:', agentError);

        // Fallback to intent parser if agents fail
        const intent = await intentParser.parse(message);

        if (intent.type === 'learn' && intent.entities.topic) {
          const lessons = LessonRepository.findLessonsByTopic(intent.entities.topic);
          if (lessons.length > 0) {
            let targetLesson = lessons[0];
            if (intent.entities.difficulty && lessons.some(l => l.difficulty === intent.entities.difficulty)) {
              targetLesson = lessons.find(l => l.difficulty === intent.entities.difficulty) || targetLesson;
            }
            startNewLesson(targetLesson.id);
          } else {
            // Even in fallback, try to use AI to respond
            onNewMessage(createAssistantTextMessage(
              `I'd love to teach you about ${intent.entities.topic}! Let me create a personalized lesson for you. What specifically would you like to know?`
            ));
          }
        } else if (intent.type === 'quiz') {
          const topic = intent.entities.topic || 'general knowledge';
          const difficulty = studentProfile.difficulty || 'easy';
          const learningStyle = studentProfile.learningStyle || 'visual';

          const newChallenge = await generateMiniChallenge(topic, difficulty, learningStyle);
          const challengeMessage: ChallengeMessage = {
            id: uuidv4(),
            role: 'assistant',
            type: 'challenge',
            content: newChallenge,
            timestamp: Date.now(),
            name: 'Sunny',
          };
          onNewMessage(challengeMessage);
        } else {
          onNewMessage(createAssistantTextMessage(
            "I'm here to help you learn! What topic interests you today? 🌟"
          ));
        }
      }

    } catch (error) {
      console.error('❌ Error handling user message:', error);
      onNewMessage(createAssistantTextMessage(
        "Oops! I had a little hiccup. Let's try that again! What would you like to learn about? 😊"
      ));
    } finally {
      setIsProcessing(false);
    }
  }, [currentLessonState, onNewMessage, startNewLesson, goToContent, handleNext, handlePrevious, studentProfile]);

  const handleQuizAnswer = useCallback(async (isCorrect: boolean, questionId: string, challenge: Challenge, userAnswer: string | string[]) => {
    if (!currentLessonState) return;

    updateProgress(questionId, isCorrect);

    // 🧠 Track quiz performance in conversation context
    conversationContextRef.current.questionsAsked++;
    if (isCorrect) {
      conversationContextRef.current.correctAnswers++;
    } else {
      conversationContextRef.current.incorrectAnswers++;
    }

    // 🧠 Smart XP award based on performance patterns
    const baseXP = isCorrect ? 10 : 5;
    const successRate = conversationContextRef.current.questionsAsked > 0
      ? conversationContextRef.current.correctAnswers / conversationContextRef.current.questionsAsked
      : 0;

    let bonusMultiplier = 1.0;
    let bonusReason = '';

    // Streak bonus
    if (isCorrect && conversationContextRef.current.incorrectAnswers === 0 && conversationContextRef.current.correctAnswers >= 3) {
      bonusMultiplier = 1.5;
      bonusReason = ' (Perfect streak!)';
    }
    // Comeback bonus (correct after struggles)
    else if (isCorrect && successRate < 0.6 && conversationContextRef.current.questionsAsked >= 3) {
      bonusMultiplier = 1.3;
      bonusReason = ' (Great comeback!)';
    }
    // Consistency bonus
    else if (isCorrect && successRate >= 0.8 && conversationContextRef.current.questionsAsked >= 5) {
      bonusMultiplier = 1.2;
      bonusReason = ' (Consistent performance!)';
    }

    const finalXP = Math.round(baseXP * bonusMultiplier);

    // Auto-award XP for quiz answers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sunny:xp', {
        detail: {
          amount: finalXP,
          reason: (isCorrect ? 'Correct answer!' : 'Nice try!') + bonusReason
        }
      }));
    }

    const feedbackMessageContent = await generateFeedback(challenge, userAnswer, isCorrect, studentProfile);

    const feedbackContent: FeedbackContent = {
        isCorrect: isCorrect,
        message: feedbackMessageContent,
        explanation: challenge.explanation, // Use challenge's explanation
        nextSteps: isCorrect ? challenge.followUpQuestions || ['Great job!'] : ["Let's review this topic.", 'Try another challenge.'],
    };

    const feedbackMessage: FeedbackMessage = {
      id: uuidv4(),
      role: 'assistant',
      type: 'feedback',
      content: feedbackContent,
      timestamp: Date.now(),
      name: 'Sunny',
    };
    onNewMessage(feedbackMessage);

    setTimeout(() => handleNext(), 1500);
  }, [currentLessonState, updateProgress, handleNext, onNewMessage, studentProfile]);

  // Clear pending routing (called after navigation)
  const clearPendingRouting = useCallback(() => {
    setPendingRouting(null);
  }, []);

  // Clear pending game request (called after game starts)
  const clearPendingGameRequest = useCallback(() => {
    setPendingGameRequest(null);
  }, []);

  // Clear pending focus session request (called after session starts)
  const clearPendingFocusRequest = useCallback(() => {
    setPendingFocusRequest(null);
  }, []);

  return {
    isProcessing,
    handleUserMessage,
    handleNext,
    handlePrevious,
    handleQuizAnswer,
    startNewLesson,
    // Learning OS routing
    pendingRouting,
    clearPendingRouting,
    // Game integration
    pendingGameRequest,
    clearPendingGameRequest,
    // Focus session integration
    pendingFocusRequest,
    clearPendingFocusRequest,
  };
};
