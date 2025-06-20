import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { 
  ChatMessageProps, 
  MessageType,
  ChallengeMessage,
  FeedbackMessage,
  AssistantMessage,
  UserMessage
} from "@/types/chat"
import TypingIndicator from "./typing-indicator"
import { formatMessageTimestamp, getMessageSenderName } from "@/lib/message-utils"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"

// Type guard to check if content is a string
function isString(content: unknown): content is string {
  return typeof content === 'string';
}

// Type guard to check if content is a challenge
function isChallengeContent(content: unknown): content is ChallengeMessage['content'] {
  return (
    content !== null &&
    typeof content === 'object' &&
    'type' in content &&
    'question' in content &&
    'explanation' in content &&
    'difficulty' in content &&
    'learningStyle' in content
  );
}

// Type guard to check if content is feedback
function isFeedbackContent(content: unknown): content is FeedbackMessage['content'] {
  return (
    content !== null &&
    typeof content === 'object' &&
    'isCorrect' in content &&
    'message' in content &&
    'explanation' in content &&
    'nextSteps' in content
  );
}

// Type guard to check if content is a message with content field
function isContentObject(content: unknown): content is { content: string; metadata?: any } {
  return (
    content !== null &&
    typeof content === 'object' &&
    'content' in content &&
    typeof (content as any).content === 'string'
  );
}

// Helper to get content string from message
function getContentString(content: ChatMessageProps['content']): string {
  if (isString(content)) return content;
  if ('content' in content) return content.content;
  return '';
}

// Helper to render challenge content
function renderChallengeContent(content: ChallengeMessage['content']) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800">{content.question}</h4>
      
      {content.options && (
        <div className="space-y-2 mt-2">
          {content.options.map((option, i) => (
            <div 
              key={i} 
              className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
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

// Helper to render feedback content
function renderFeedbackContent(content: FeedbackMessage['content']) {
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
            {content.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({
  id,
  type,
  content: rawContent,
  name,
  timestamp,
  isLoading = false,
  className = '',
  metadata
}: ChatMessageProps) {
  // Ensure content is properly typed
  const content = rawContent as 
    | string 
    | { content: string; metadata?: any } 
    | ChallengeMessage['content'] 
    | FeedbackMessage['content'];
  const isUser = type === 'user';
  
  // Get the content string for sender name
  const getContentForSender = (msgContent: typeof content): string => {
    if (isString(msgContent)) {
      return msgContent;
    }
    if (isContentObject(msgContent)) {
      return msgContent.content;
    }
    if (isChallengeContent(msgContent)) {
      return msgContent.question;
    }
    if (isFeedbackContent(msgContent)) {
      return msgContent.message;
    }
    return '';
  };

  const senderName = getMessageSenderName({ 
    id, 
    type, 
    content: getContentForSender(content),
    name: name || 'User', 
    timestamp 
  } as const, name || 'User');

  // Determine message content based on type
  let messageContent: React.ReactNode = null;
  
  if (isLoading) {
    messageContent = <TypingIndicator />;
  } else if (type === 'challenge' && isChallengeContent(content)) {
    messageContent = renderChallengeContent(content);
  } else if (type === 'feedback' && isFeedbackContent(content)) {
    messageContent = renderFeedbackContent(content);
  } else {
    // Handle text-based messages
    const textContent = getContentString(content);
    messageContent = (
      <div className="whitespace-pre-wrap">
        {typeof textContent === 'string' ? textContent : JSON.stringify(textContent)}
      </div>
    );
  }

  // Get appropriate icon based on message type
  const getMessageIcon = () => {
    switch (type) {
      case 'challenge':
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case 'feedback':
        if (typeof content !== 'string' && content && 'isCorrect' in content) {
          return content.isCorrect 
            ? <CheckCircle className="w-4 h-4 text-green-500" /> 
            : <XCircle className="w-4 h-4 text-red-500" />;
        }
        return null;
      default:
        return null;
    }
  }

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
        
        {isLoading ? (
          <div className={cn(
            "flex items-center gap-2",
            isUser ? "text-blue-100" : "text-gray-600"
          )}>
            <TypingIndicator 
              className="mr-2" 
              dotClassName={cn(
                "h-2 w-2 rounded-full",
                isUser ? "bg-blue-200" : "bg-gray-400"
              )} 
            />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "text-white" : "text-gray-700"
          )}>
            {renderMessageContent(content)}
          </div>
        )}
      </div>
    </motion.div>
  )
}
