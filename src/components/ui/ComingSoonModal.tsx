/**
 * ComingSoonModal Component
 * 
 * Displays a friendly "Coming Soon" message for features under development.
 * Provides context and sets expectations for users.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Calendar, Bell } from 'lucide-react';
import { Button } from './button';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
  expectedDate?: string;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  featureName,
  description,
  expectedDate,
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url(/background.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-xl border-b-4 border-black">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-purple-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Coming Soon!</h2>
                <p className="text-purple-100 text-sm">We're working on it</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-black text-gray-900 mb-3">{featureName}</h3>
            
            {description && (
              <p className="text-gray-700 mb-4 leading-relaxed">
                {description}
              </p>
            )}

            {expectedDate && (
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-200 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Expected Launch</p>
                  <p className="text-sm text-blue-700">{expectedDate}</p>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-4">
              <div className="flex items-start gap-2">
                <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-900 mb-1">Want to be notified?</p>
                  <p className="text-xs text-yellow-700">
                    This feature is in active development. Check back soon or contact us for updates!
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Got it!
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  // Navigate to demo or contact
                  window.location.href = '/demo';
                }}
                variant="outline"
                className="flex-1 border-2 border-black font-bold"
              >
                Try Demo Instead
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for easy usage
export function useComingSoon() {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    featureName: string;
    description?: string;
    expectedDate?: string;
  }>({
    isOpen: false,
    featureName: '',
  });

  const showComingSoon = (
    featureName: string,
    description?: string,
    expectedDate?: string
  ) => {
    setModalState({
      isOpen: true,
      featureName,
      description,
      expectedDate,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    showComingSoon,
    closeModal,
    ComingSoonModal: () => (
      <ComingSoonModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        featureName={modalState.featureName}
        description={modalState.description}
        expectedDate={modalState.expectedDate}
      />
    ),
  };
}
