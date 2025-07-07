import { cn } from '../lib/utils';
import { motion } from "framer-motion";
import { UIMessage } from '../types/chat';
import TypingIndicator from "./typing-indicator";
import { formatMessageTimestamp } from '../lib/message-utils';
import { CheckCircle, HelpCircle } from "lucide-react";

interface ChatMessageProps {
  message: UIMessage;
  isUser: boolean;
  className?: string;
}

// --- Main Component ---

export default function ChatMessage({ message, isUser, className = '' }: ChatMessageProps) {
  const { content, name, timestamp, type, isLoading = false } = message;

  const senderName = name || (isUser ? 'You' : 'Sunny');

  const renderMessageContent = () => {
    if (isLoading) {
      return <TypingIndicator />;
    }
    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  const getMessageIcon = () => {
    switch (type) {
      case 'challenge':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case 'feedback':
        // For now, we'll just show a checkmark for simplicity
        return <CheckCircle className="w-4 h-4 text-green-500" />;
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
