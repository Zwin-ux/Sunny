import React, { useState } from 'react';
import { Lesson, ContentType, MediaContent, QuizQuestion } from '@/types/lesson';
import { Challenge } from '@/types/chat'; // Import Challenge type
import Quiz from './Quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Image as ImageIcon, Info } from 'lucide-react';

interface ContentRendererProps {
  content: Lesson['content'][number];
  onAnswer?: (isCorrect: boolean, questionId: string, challenge: Challenge, userAnswer: string | string[]) => void; // Updated onAnswer prop
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showNavigation?: boolean;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  onAnswer,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  showNavigation = true,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const renderMedia = (media: MediaContent) => {
    switch (media.type) {
      case 'image':
        return (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img 
              src={media.url} 
              alt={media.altText || 'Lesson media'}
              className="w-full h-auto max-h-96 object-contain"
            />
            {media.caption && (
              <div className="p-3 bg-white border-t border-gray-100 text-sm text-gray-600">
                {media.caption}
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
            <iframe
              src={media.url}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={media.altText || 'Lesson video'}
            />
            {media.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm">
                {media.caption}
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <button className="p-3 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/3"></div>
                </div>
                {media.caption && (
                  <p className="mt-2 text-sm text-gray-600">{media.caption}</p>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{content.title}</h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              {typeof content.content === 'string' ? (
                <p>{content.content}</p>
              ) : (
                <p>Invalid content format</p>
              )}
            </div>
          </div>
        );
      case 'quiz':
        const challengeContent = content.content as Challenge; // Cast to Challenge
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quiz Time!</h2>
            <Quiz
              question={challengeContent}
              onAnswer={onAnswer || (() => {})}
              onNext={onNext}
              isLastQuestion={isLast}
            />
          </div>
        );
      case 'fact':
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Did You Know?</h3>
                <div className="mt-2 text-yellow-700">
                  <p>{content.content as string}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'video':
      case 'diagram':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
            {content.media && content.media.length > 0 ? (
              renderMedia(content.media[0])
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-3">
                  {content.type === 'video' ? (
                    <Play className="h-6 w-6 text-gray-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  {content.type === 'video' ? 'Video Content' : 'Diagram'}
                </h3>
                <p className="text-sm text-gray-500">
                  {content.type === 'video' 
                    ? 'This lesson includes a video explanation.'
                    : 'This lesson includes a helpful diagram.'}
                </p>
              </div>
            )}
            {content.content && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-blue-800">{content.content as string}</p>
              </div>
            )}
          </div>
        );
      default:
        return <p>Unsupported content type</p>;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={content.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          {renderContent()}
          
          {showNavigation && (
            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={onPrevious}
                disabled={isFirst}
                className={`px-4 py-2 rounded-lg border ${
                  isFirst
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-2">
                {content.type === 'quiz' || onNext ? null : (
                  <button
                    onClick={onNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLast ? 'Finish' : 'Next'}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {content.type === 'quiz' && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {showExplanation ? 'Hide explanation' : 'Need help with this question?'}
          </button>
          
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                <p className="text-left">
                  <span className="font-medium">Hint:</span> {
                    (content.content as Challenge).explanation || // Cast to Challenge
                    'Think carefully about the question and try to eliminate obviously wrong answers first.'
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ContentRenderer;
