import { useState, useCallback, useEffect } from 'react';
import { useLearningSession } from '../contexts/LearningSessionContext';
import { Message } from '../types/chat';
import { Lesson, ContentType } from '../types/lesson';
import LessonRepository from '../lib/lessons/LessonRepository';
import intentParser, { Intent } from '../lib/nlu/IntentParser';
import { v4 as uuidv4 } from 'uuid';

export const useLearningChat = (onNewMessage: (message: Message) => void) => {
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

  // Handle starting a new lesson
  const startNewLesson = useCallback((lessonId: string) => {
    const lesson = LessonRepository.getLesson(lessonId);
    if (!lesson) return;

    startLesson(lessonId);
    
    // Send welcome message
    onNewMessage({
      id: uuidv4(),
      role: 'assistant',
      content: {
        type: 'text',
        title: `Let's learn about ${lesson.title}!`,
        content: lesson.description,
      },
      timestamp: Date.now(),
    } as Message);

    // Send first content item
    if (lesson.content.length > 0) {
      onNewMessage({
        id: uuidv4(),
        role: 'assistant',
        content: lesson.content[0],
        timestamp: Date.now(),
      } as Message);
    }
  }, [onNewMessage, startLesson]);

  // Handle sending a message that might be a learning intent
  const handleUserMessage = useCallback(async (message: string) => {
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      type: 'text',
    };
    onNewMessage(userMessage);
    
    // Set processing state while we handle the message
    setIsProcessing(true);

    try {
      // If we're in a lesson, handle navigation or answers
      if (currentLessonState) {
        const currentContent = currentLessonState.lesson.content[currentContentIndex];
        
        // Handle quiz answers
        if (currentContent.type === 'quiz') {
          // This is handled by the Quiz component directly
          setIsProcessing(false);
          return;
        }
        
        // Handle navigation commands
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('next') || lowerMessage.includes('continue')) {
          handleNext();
        } else if (lowerMessage.includes('previous') || lowerMessage.includes('go back')) {
          handlePrevious();
        } else {
          // Default behavior: move to next content
          handleNext();
        }
        setIsProcessing(false);
        return;
      }

      // Handle learning intents with enhanced parser
      const intent = await parseLearningIntent(message);
      
      if (intent.type === 'learn' && intent.topic) {
        // Find lessons that match the topic
        const lessons = LessonRepository.findLessonsByTopic(intent.topic);
        
        if (lessons.length > 0) {
          // Filter by difficulty if specified
          let targetLesson = lessons[0];
          if (intent.difficulty && lessons.some(l => l.difficulty === intent.difficulty)) {
            targetLesson = lessons.find(l => l.difficulty === intent.difficulty) || targetLesson;
          }
          
          // Start the matching lesson
          startNewLesson(targetLesson.id);
          
          // If a specific content type was requested, try to navigate to it
          if (intent.contentType) {
            const contentIndex = targetLesson.content.findIndex((c: {type: ContentType, id: string}) => c.type === intent.contentType);
            if (contentIndex >= 0) {
              setTimeout(() => {
                goToContent(targetLesson.content[contentIndex].id);
              }, 500);
            }
          }
        } else {
          // No lesson found for topic
          const availableTopics = intentParser.getAvailableTopics().slice(0, 3).join(', ');
          onNewMessage({
            id: uuidv4(),
            role: 'assistant',
            content: `I don't have a lesson about "${intent.topic}" yet. Would you like to learn about ${availableTopics} instead?`,
            timestamp: Date.now(),
            type: 'text',
          } as Message);
        }
      } else if (intent.type === 'quiz') {
        // Handle quiz intent
        const topic = intent.topic;
        if (topic) {
          const lessons = LessonRepository.findLessonsByTopic(topic);
          if (lessons.length > 0) {
            // Find quiz content in the lesson
            const lesson = lessons[0];
            const quizContent = lesson.content.find((c: {type: ContentType, id: string}) => c.type === 'quiz');
            
            if (quizContent) {
              startNewLesson(lesson.id);
              // Navigate to the quiz content
              setTimeout(() => {
                goToContent(quizContent.id);
              }, 500);
            } else {
              onNewMessage({
                id: uuidv4(),
                role: 'assistant',
                content: `I don't have a quiz about ${topic} yet. Would you like to learn about it instead?`,
                timestamp: Date.now(),
                type: 'text',
              } as Message);
            }
          } else {
            onNewMessage({
              id: uuidv4(),
              role: 'assistant',
              content: `I don't have any quizzes about ${topic} yet. Would you like to learn about something else?`,
              timestamp: Date.now(),
              type: 'text',
            } as Message);
          }
        } else {
          // Generic quiz request without a specific topic
          const allLessons = LessonRepository.getAllLessons();
          const lessonsWithQuizzes = allLessons.filter((l: Lesson) => 
            l.content.some((c: {type: ContentType}) => c.type === 'quiz')
          );
          
          if (lessonsWithQuizzes.length > 0) {
            const randomLesson = lessonsWithQuizzes[Math.floor(Math.random() * lessonsWithQuizzes.length)];
            const quizContent = randomLesson.content.find((c: {type: ContentType, id: string}) => c.type === 'quiz');
            
            onNewMessage({
              id: uuidv4(),
              role: 'assistant',
              content: `Let's test your knowledge about ${randomLesson.title}!`,
              timestamp: Date.now(),
              type: 'text',
            } as Message);
            
            startNewLesson(randomLesson.id);
            if (quizContent) {
              setTimeout(() => {
                goToContent(quizContent.id);
              }, 500);
            }
          } else {
            onNewMessage({
              id: uuidv4(),
              role: 'assistant',
              content: "I don't have any quizzes available yet. Would you like to learn about a topic instead?",
              timestamp: Date.now(),
              type: 'text',
            } as Message);
          }
        }
      } else if (intent.type === 'help') {
        // Show help message using the enhanced help response
        onNewMessage({
          id: uuidv4(),
          role: 'assistant',
          content: intentParser.getHelpResponse(),
          timestamp: Date.now(),
          type: 'text',
        } as Message);
      } else {
        // Default response for unknown intents using the clarification prompt
        onNewMessage({
          id: uuidv4(),
          role: 'assistant',
          content: intentParser.getClarificationPrompt(),
          timestamp: Date.now(),
          type: 'text',
        } as Message);
      }
    } catch (error) {
      console.error('Error handling user message:', error);
      onNewMessage({
        id: uuidv4(),
        role: 'assistant',
        content: "I'm having trouble understanding that right now. Could you try asking in a different way?",
        timestamp: Date.now(),
        type: 'text',
      } as Message);
    } finally {
      setIsProcessing(false);
    }
  }, [currentLessonState, currentContentIndex, onNewMessage, startNewLesson, goToContent]);

  // Handle moving to next content in lesson
  const handleNext = useCallback(() => {
    if (!currentLessonState || currentContentIndex >= currentLessonState.lesson.content.length - 1) {
      // End of lesson
      if (currentLessonState) {
        completeLesson();
        onNewMessage({
          id: uuidv4(),
          role: 'assistant',
          content: "Great job completing the lesson! What would you like to learn about next?",
          timestamp: Date.now(),
          type: 'text',
        } as Message);
      }
      return;
    }

    goToNextContent();
    
    // Add next content to chat
    const nextIndex = currentContentIndex + 1;
    if (currentLessonState.lesson.content[nextIndex]) {
      onNewMessage({
        id: uuidv4(),
        role: 'assistant',
        content: currentLessonState.lesson.content[nextIndex],
        timestamp: Date.now(),
      } as Message);
    }
  }, [currentLessonState, currentContentIndex, completeLesson, goToNextContent, onNewMessage]);

  // Handle moving to previous content in lesson
  const handlePrevious = useCallback(() => {
    if (currentContentIndex > 0) {
      goToPreviousContent();
      
      // Update chat to show previous content
      const prevIndex = currentContentIndex - 1;
      if (currentLessonState?.lesson.content[prevIndex]) {
        onNewMessage({
          id: uuidv4(),
          role: 'assistant',
          content: currentLessonState.lesson.content[prevIndex],
          timestamp: Date.now(),
        } as Message);
      }
    }
  }, [currentContentIndex, currentLessonState, goToPreviousContent, onNewMessage]);

  // Handle quiz answer
  const handleQuizAnswer = useCallback((isCorrect: boolean, questionId: string) => {
    if (!currentLessonState) return;
    
    // Update progress
    updateProgress(questionId, isCorrect);
    
    // Provide feedback
    const feedback = isCorrect 
      ? "That's correct! Great job! 🎉"
      : "Not quite right, but that's okay! Let's keep learning!";
    
    onNewMessage({
      id: uuidv4(),
      role: 'assistant',
      content: feedback,
      timestamp: Date.now(),
      type: 'text',
    } as Message);
    
    // Auto-advance after a short delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  }, [currentLessonState, updateProgress, handleNext, onNewMessage]);

  // Enhanced intent parsing using the IntentParser
  const parseLearningIntent = async (message: string): Promise<{
    type: 'learn' | 'quiz' | 'help' | 'unknown';
    topic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    contentType?: ContentType;
  }> => {
    // Use the enhanced IntentParser for more robust topic detection
    const intent: Intent = await intentParser.parse(message);
    
    // Map the intent to the expected return format
    return {
      type: intent.type === 'repeat' || intent.type === 'clarify' || intent.type === 'change_topic' 
        ? 'unknown' 
        : intent.type,
      topic: intent.entities.topic,
      difficulty: intent.entities.difficulty,
      contentType: intent.entities.contentType
    };
  };

  return {
    isInLesson: !!currentLessonState,
    currentLesson: currentLessonState?.lesson || null,
    currentContentIndex,
    processMessage: handleUserMessage,
    isProcessing,
    handleNext,
    handlePrevious,
    handleQuizAnswer,
    startNewLesson,
  };
};

export default useLearningChat;
