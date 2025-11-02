'use client';

import { useState, useEffect } from 'react';

export interface BrainModeSettings {
  showThinking: boolean;
  showAdaptation: boolean;
  showPatterns: boolean;
  adaptiveSpeed: 'instant' | 'gradual' | 'conservative';
  interventionLevel: 'high' | 'medium' | 'low';
}

const DEFAULT_SETTINGS: BrainModeSettings = {
  showThinking: true,
  showAdaptation: true,
  showPatterns: true,
  adaptiveSpeed: 'gradual',
  interventionLevel: 'medium'
};

export function useBrainMode() {
  const [settings, setSettings] = useState<BrainModeSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('settings_brain');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load brain mode settings:', error);
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<BrainModeSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem('settings_brain', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save brain mode settings:', error);
    }
  };

  return {
    settings,
    updateSettings,
    isLoaded
  };
}
