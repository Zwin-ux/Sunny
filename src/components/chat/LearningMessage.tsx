import React from 'react';
import { Message as ChatMessage, Challenge, FeedbackContent } from '@/types/chat';
import ContentRenderer from '@/components/interactive/ContentRenderer';
import { Lesson } from '@/types/lesson';
import { motion } from 'framer-motion';

interface LearningMessageProps {
  message: ChatMessage;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  onAnswer?: (isCorrect: boolean, questionId: string, challenge: Challenge, userAnswer: string | string[]) => void;
  showNavigation?: boolean;
}

const LearningMessage: React.FC<LearningMessageProps> = ({
  message,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  onAnswer,
  showNavigation = true,
}) => {
  // Check if this is a learning content message
  if (message.type === 'challenge') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`w-full max-w-3xl ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`p-4 rounded-xl ${
            message.role === 'user'
              ? 'bg-blue-50 border border-blue-100'
              : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="mb-2 text-sm font-medium text-gray-500">
              {message.role === 'assistant' ? 'Sunny' : 'You'}
            </div>
            
            <div className="mt-2">
              <ContentRenderer
                content={{
                  id: message.id,
                  type: 'quiz',
                  title: 'Challenge',
                  content: message.content as Challenge,
                  difficulty: (message.content as Challenge).difficulty || 'easy',
                  estimatedDuration: 5
                }}
                onNext={onNext}
                onPrevious={onPrevious}
                onAnswer={onAnswer}
                isFirst={isFirst}
                isLast={isLast}
                showNavigation={showNavigation}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  } else if (message.type === 'feedback') {
    const feedbackContent = message.content as FeedbackContent;
    return (
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`max-w-3/4 px-4 py-2 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p>{feedbackContent.message}</p>
          <p className="text-sm text-gray-600">{feedbackContent.explanation}</p>
          {feedbackContent.nextSteps.length > 0 && (
            <p className="text-xs text-gray-500">Next: {feedbackContent.nextSteps.join(', ')}</p>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`max-w-3/4 px-4 py-2 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.content as string}
        </div>
      </div>
    );
  }
};
