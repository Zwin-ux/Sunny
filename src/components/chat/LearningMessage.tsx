import React from 'react';
import { Message as ChatMessage } from '../types/chat';
import ContentRenderer from '../interactive/ContentRenderer';
import { Lesson, ContentType } from '../types/lesson';
import { motion } from 'framer-motion';

interface LearningMessageProps {
  message: ChatMessage & { content: any };
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  onAnswer?: (isCorrect: boolean) => void;
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
  const isLearningContent = message.content?.type && [
    'text', 'video', 'quiz', 'diagram', 'fact'
  ].includes(message.content.type);

  if (!isLearningContent) {
    return (
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`max-w-3/4 px-4 py-2 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.content}
        </div>
      </div>
    );
  }

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
              content={message.content}
              onAnswer={onAnswer}
              onNext={onNext}
              onPrevious={onPrevious}
              isFirst={isFirst}
              isLast={isLast}
              showNavigation={showNavigation}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LearningMessage;
