'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isDemoMode } from '@/lib/demo-mode';

export function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in demo mode
    if (isDemoMode() && !isDismissed) {
      setIsVisible(true);
    }
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 border-b-4 border-black shadow-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-gray-900 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm md:text-base font-bold text-gray-900">
                  🌟 Demo Mode Active
                </p>
                <p className="text-xs md:text-sm text-gray-800">
                  You're using Sunny with sample content. Add your OPENAI_API_KEY for full AI-powered features!
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="ml-4 p-1 hover:bg-black/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
