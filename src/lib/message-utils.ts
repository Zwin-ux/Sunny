import * as React from 'react';
import { Message, MessageType } from '../types/chat';

// Create a br element using React.createElement
const createBr = (key: number) => React.createElement('br', { key });

export function renderMessageContent(content: string): React.ReactNode {
  // Split content into paragraphs and process each one
  return content.split('\n').map((paragraph, i) => {
    if (!paragraph.trim()) return createBr(i);
    
    // Simple URL detection and conversion to links
    const elements: React.ReactNode[] = [];
    const words = paragraph.split(/(\s+)/);
    
    words.forEach((word, wordIndex) => {
      // Check if the word is a URL
      const isUrl = /^https?:\/\/[^\s]+$/.test(word);
      
      if (isUrl) {
        // Handle image URLs
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(word)) {
          elements.push(
            React.createElement(
              'div',
              { key: `img-${wordIndex}`, className: 'my-2' },
              React.createElement('img', {
                src: word,
                alt: 'Shared content',
                className: 'max-w-full h-auto rounded-lg border border-gray-200',
                onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder-image.svg';
                }
              })
            )
          );
        } else {
          // Handle regular links
          elements.push(
            React.createElement(
              'a',
              {
                key: `link-${wordIndex}`,
                href: word,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-blue-600 hover:underline break-all'
              },
              word
            )
          );
        }
      } else {
        // Regular text
        elements.push(word);
      }
      
      // Add space between words
      if (wordIndex < words.length - 1) {
        elements.push(' ');
      }
    });
    
    return React.createElement(
      'p',
      { 
        key: i, 
        className: 'text-gray-800 whitespace-pre-wrap break-words' 
      },
      elements
    );
  });
}

export function formatMessageTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getMessageSenderName(message: Message, currentUserName: string): string {
  if (message.type === 'user') {
    return currentUserName || 'You';
  }
  return message.name || 'Assistant';
}
