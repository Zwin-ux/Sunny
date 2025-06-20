import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Message,
  Challenge,
  FeedbackContent,
  Flashcard,
  ChatMessageProps
} from "@/types/chat";
import TypingIndicator from "./typing-indicator";
import { formatMessageTimestamp, getMessageSenderName } from "@/lib/message-utils";
import { CheckCircle, XCircle, HelpCircle, BookOpen } from "lucide-react";
import { FlashcardSet } from "./flashcard";

// --- Type Guards ---

function isChallenge(content: any): content is Challenge {
  return (
    content !== null &&
    typeof content === 'object' &&
    'question' in content &&
    'explanation' in content &&
    'difficulty' in content
  );
}

function isFeedback(content: any): content is FeedbackContent {
  return (
    content !== null &&
    typeof content === 'object' &&
    'isCorrect' in content &&
    'message' in content &&
    'explanation' in content
  );
}

// --- Render Helpers ---

function renderChallengeContent(content: Challenge) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800">{content.question}</h4>
      {content.options && (
        <div className="space-y-2 mt-2">
          {content.options.map((option, i) => (
            <div key={i} className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              {option}
            </div>
          ))}
        </div>
      )}
      {content.explanation && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium">💡 Explanation:</p>
          <p>{content.explanation}</p>
        </div>
      )}
    </div>
  );
}

function renderFeedbackContent(content: FeedbackContent) {
  const Icon = content.isCorrect ? CheckCircle : XCircle;
  const iconColor = content.isCorrect ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`space-y-2 ${content.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="font-medium">{content.message}</span>
      </div>
      {content.explanation && (
        <div className="mt-2 p-3 bg-opacity-20 rounded-lg text-sm">
          <p className="font-medium">📝 {content.isCorrect ? 'Great job!' : 'Let\'s review:'}</p>
          <p>{content.explanation}</p>
        </div>
      )}
      {content.nextSteps && content.nextSteps.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-1">Next steps:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {content.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function isFlashcards(content: any): content is Flashcard[] {
  return (
    Array.isArray(content) &&
    content.length > 0 &&
    typeof content[0] === 'object' &&
    'front' in content[0] &&
    'back' in content[0]
  )
}

// --- Main Component ---

export default function ChatMessage(props: ChatMessageProps) {
  const {
    type,
    content,
    name,
    timestamp,
    role,
    isLoading = false,
    className = '',
  } = props;
  const isUser = role === 'user';

  // The props object is already a valid Message, so we can pass it directly
  const senderName = getMessageSenderName(props, name || 'User');

  const renderMessageContent = () => {
    if (isLoading) {
      return <TypingIndicator />;
    }
    if (isChallenge(content)) {
      return renderChallengeContent(content);
    }
    if (isFeedback(content)) {
      return renderFeedbackContent(content);
    }
    if (isFlashcards(content)) {
      return <FlashcardSet cards={content} />;
    }
    if (typeof content === 'string') {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
    // Fallback for unknown content types
    return <div className="whitespace-pre-wrap">{JSON.stringify(content)}</div>;
  };

  const getMessageIcon = () => {
    switch (type) {
      case 'challenge':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case 'feedback':
        if (isFeedback(content)) {
          return content.isCorrect
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <XCircle className="w-4 h-4 text-red-500" />;
        }
        return null;
      case 'flashcards':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("group flex my-2", isUser ? "justify-end" : "justify-start", className)}
      data-message-type={type}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl p-4 relative shadow-sm",
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-white border border-gray-200 rounded-bl-none"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {!isUser && getMessageIcon()}
          <span className={cn(
            "font-semibold text-sm",
            isUser ? "text-blue-50" : "text-gray-800"
          )}>
            {senderName}
          </span>
          <span className={cn(
            "text-xs",
            isUser ? "text-blue-100" : "text-gray-500"
          )}>
            {formatMessageTimestamp(timestamp)}
          </span>
        </div>

        <div className={cn(
          "prose prose-sm max-w-none",
          isUser ? "text-white" : "text-gray-700"
        )}>
          {renderMessageContent()}
        </div>
      </div>
    </motion.div>
  );
}
