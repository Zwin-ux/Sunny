import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
  dotClassName?: string;
}

export default function TypingIndicator({ 
  className = '',
  dotClassName = 'h-2 w-2 bg-gray-400 rounded-full' 
}: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={dotClassName}
          initial={{ y: 0 }}
          animate={{ y: ['0%', '-60%', '0%'] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
