import React, { useState } from 'react';
import { Lesson, ContentType, MediaContent, QuizQuestion } from '@/types/lesson';
import { Challenge } from '@/types/chat'; // Import Challenge type
import Quiz from './Quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Image as ImageIcon, Info, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';

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
      case ContentType.Text:
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
      case ContentType.Quiz:
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
      case ContentType.Fact:
        return (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-50 relative overflow-hidden max-h-36 fact-background">
            <div className="font-medium mb-1 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-300" />
              Did You Know?
            </div>
            <div className="overflow-hidden relative max-h-24">{content.content}</div>
          </div>
        );
      case ContentType.Interactive:
        return (
          <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="font-medium mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Interactive Content
            </div>
            <div>{renderInteractiveContent(content.content)}</div>
          </div>
        );
      case ContentType.Challenge:
        return <p>Unsupported content type</p>;
      case ContentType.Video:
      case ContentType.Image:
        return (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            {!content.media || content.media.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-3">
                  {content.type === ContentType.Video ? (
                    <Play className="h-6 w-6 text-gray-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  {content.type === ContentType.Video ? 'Video Content' : 'Diagram'}
                </h3>
                <p className="text-sm text-gray-500">
                  {content.type === ContentType.Video 
                    ? 'This lesson includes a video explanation.'
                    : 'This lesson includes a helpful diagram.'}
                </p>
              </div>
            ) : (
              renderMedia(content.media[0])
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

  const renderInteractiveContent = (content: any) => {
    // Add implementation for rendering interactive content
    return <p>Interactive content is not implemented yet.</p>;
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
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={isFirst}
                aria-label="Previous content"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-2">
                {content.type === ContentType.Quiz || onNext ? null : (
                  <button
                    onClick={onNext}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    disabled={isLast || !showNavigation}
                    aria-label="Next content"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {content.type === ContentType.Quiz && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowExplanation(!showExplanation)}
            className="mt-2 px-3 py-1 bg-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-300 transition-colors"
            title="Toggle explanation"
          >
            {showExplanation ? 'Hide explanation' : 'Need help with this question?'}
          </motion.button>
          
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
