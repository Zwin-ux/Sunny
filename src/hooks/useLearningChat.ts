import { useState, useCallback, useEffect } from 'react';
import { useLearningSession } from '../contexts/LearningSessionContext';
import { Message, UserMessage, AssistantMessage, ChallengeMessage, FeedbackMessage, FeedbackContent, Challenge, StudentProfile } from '../types/chat';
import { Lesson, LessonContent, MediaContent, QuizQuestion } from '../types/lesson';
import LessonRepository from '../lib/lessons/LessonRepository';
import intentParser, { Intent } from '../lib/nlu/IntentParser';
import { v4 as uuidv4 } from 'uuid';
import { generateMiniChallenge, generateFeedback } from '../lib/sunny-ai';

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

  const createAssistantTextMessage = (text: string): AssistantMessage => ({
    id: uuidv4(),
    role: 'assistant',
    type: 'assistant',
    content: text,
    timestamp: Date.now(),
    name: 'Sunny',
  });

  const createMessageFromContent = (content: LessonContent): Message => {
    if (content.type === 'quiz') {
      // Assuming content.content is already a Challenge object due to previous type updates
      const challenge = content.content as Challenge;
      return {
        id: uuidv4(),
        role: 'assistant',
        type: 'challenge',
        content: challenge,
        timestamp: Date.now(),
        name: 'Sunny',
      };
    }

    let textContent = '';
    if (content.type === 'text') {
      textContent = content.content as string;
    } else if (content.type === 'video') {
      const mediaContent = content.content as MediaContent;
      textContent = `Here's a video about "${content.title}": ${mediaContent.url}`;
    } else {
      textContent = `Next up: ${content.title}`;
    }

    return createAssistantTextMessage(textContent);
  };

  // Handle starting a new lesson
  const startNewLesson = useCallback((lessonId: string) => {
    const lesson = LessonRepository.getLesson(lessonId);
    if (!lesson) return;

    startLesson(lessonId);

    onNewMessage(createAssistantTextMessage(`Let's learn about ${lesson.title}! ${lesson.description}`));

    if (lesson.content.length > 0) {
      onNewMessage(createMessageFromContent(lesson.content[0]));
    }
  }, [onNewMessage, startLesson]);

  const handleNext = useCallback(() => {
    if (!currentLessonState || currentContentIndex >= currentLessonState.lesson.content.length - 1) {
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

  // Handle sending a message that might be a learning intent
  const handleUserMessage = useCallback(async (message: string) => {
    const userMessage: UserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'user',
      content: message,
      timestamp: Date.now(),
      name: 'User',
    };
    onNewMessage(userMessage);

    setIsProcessing(true);

    try {
      if (currentLessonState) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
          handleNext();
        } else if (lowerMessage.includes('previous') || lowerMessage.includes('go back')) {
          handlePrevious();
        } else {
          onNewMessage(createAssistantTextMessage("You can say 'next' or 'previous' to navigate the lesson."));
        }
        setIsProcessing(false);
        return;
      }

      const intent = await intentParser.parse(message);

      if (intent.type === 'learn' && intent.entities.topic) {
        const lessons = LessonRepository.findLessonsByTopic(intent.entities.topic);
        if (lessons.length > 0) {
          let targetLesson = lessons[0];
          if (intent.entities.difficulty && lessons.some(l => l.difficulty === intent.entities.difficulty)) {
            targetLesson = lessons.find(l => l.difficulty === intent.entities.difficulty) || targetLesson;
          }
          startNewLesson(targetLesson.id);
          if (intent.entities.contentType) {
            const contentIndex = targetLesson.content.findIndex((c: LessonContent) => c.type === intent.entities.contentType);
            if (contentIndex >= 0) {
              setTimeout(() => goToContent(targetLesson.content[contentIndex].id), 500);
            }
          }
        } else {
          const availableTopics = intentParser.getAvailableTopics().slice(0, 3).join(', ');
          onNewMessage(createAssistantTextMessage(`I don't have a lesson about "${intent.entities.topic}" yet. Would you like to learn about ${availableTopics} instead?`));
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
      } else if (intent.type === 'help') {
        onNewMessage(createAssistantTextMessage(intentParser.getHelpResponse()));
      } else {
        onNewMessage(createAssistantTextMessage(intentParser.getClarificationPrompt()));
      }
    } catch (error) {
      console.error('Error handling user message:', error);
      onNewMessage(createAssistantTextMessage("I'm having trouble understanding that right now. Could you try asking in a different way?"));
    } finally {
      setIsProcessing(false);
    }
  }, [currentLessonState, onNewMessage, startNewLesson, goToContent, handleNext, handlePrevious]);

  const handleQuizAnswer = useCallback(async (isCorrect: boolean, questionId: string, challenge: Challenge, userAnswer: string | string[]) => {
    if (!currentLessonState) return;

    updateProgress(questionId, isCorrect);

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

  return {
    isProcessing,
    handleUserMessage,
    handleNext,
    handlePrevious,
    handleQuizAnswer,
    startNewLesson,
  };
};
