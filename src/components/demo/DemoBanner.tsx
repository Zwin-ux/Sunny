/**
 * DemoBanner Component
 * 
 * Displays a banner when in demo mode to indicate enhanced features are active.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Presentation, X } from 'lucide-react';

export function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const demoMode = localStorage.getItem('DEMO_MODE') === 'true';
    setIsDemoMode(demoMode);

    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem('demo_banner_dismissed') === 'true';
    setIsVisible(!dismissed);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('demo_banner_dismissed', 'true');
  };

  if (!isDemoMode || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Demo Mode Active</p>
                <p className="text-xs text-purple-100">
                  Enhanced visuals and pre-populated data for presentations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold">All Systems Ready</span>
              </div>

              <button
                onClick={handleDismiss}
                className="text-white hover:text-purple-200 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
