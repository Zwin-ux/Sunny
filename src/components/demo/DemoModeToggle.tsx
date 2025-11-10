/**
 * DemoModeToggle Component
 * 
 * Toggle for enabling demo mode with pre-populated data and enhanced visuals.
 * Perfect for presentations and demos.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Presentation, Eye, EyeOff } from 'lucide-react';

export function DemoModeToggle() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if demo mode is enabled
    const demoMode = localStorage.getItem('DEMO_MODE') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  const toggleDemoMode = () => {
    const newMode = !isDemoMode;
    setIsDemoMode(newMode);
    localStorage.setItem('DEMO_MODE', newMode.toString());
    
    // Reload to apply changes
    window.location.reload();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-50"
        title="Show demo controls"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-white rounded-xl border-2 border-black shadow-lg p-4 z-50 max-w-xs"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-black text-gray-900">Demo Controls</h3>
        </div>
        <button
          onClick={toggleVisibility}
          className="text-gray-500 hover:text-gray-700"
          title="Hide demo controls"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Demo Mode</p>
            <p className="text-xs text-gray-600">Enhanced visuals & data</p>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDemoMode ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDemoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Status */}
        <div className={`p-2 rounded-lg border ${
          isDemoMode
            ? 'bg-purple-50 border-purple-300'
            : 'bg-gray-50 border-gray-300'
        }`}>
          <p className="text-xs font-semibold text-center">
            {isDemoMode ? '🎬 Demo Mode Active' : '💼 Production Mode'}
          </p>
        </div>

        {/* Quick Actions */}
        {isDemoMode && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-700">Quick Actions:</p>
            <button
              onClick={() => {
                localStorage.setItem('SHOW_AGENT_ACTIVITY', 'true');
                window.location.reload();
              }}
              className="w-full text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-3 rounded-lg border border-blue-300 transition-colors"
            >
              Show Agent Activity
            </button>
            <button
              onClick={() => {
                localStorage.setItem('POPULATE_DEMO_DATA', 'true');
                window.location.reload();
              }}
              className="w-full text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2 px-3 rounded-lg border border-green-300 transition-colors"
            >
              Load Demo Data
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">D</kbd> to toggle
        </p>
      </div>
    </motion.div>
  );
}

// Keyboard shortcut handler
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' && e.ctrlKey) {
      e.preventDefault();
      const currentMode = localStorage.getItem('DEMO_MODE') === 'true';
      localStorage.setItem('DEMO_MODE', (!currentMode).toString());
      window.location.reload();
    }
  });
}
