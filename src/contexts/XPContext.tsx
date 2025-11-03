'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface XPContextType {
  xp: number;
  level: number;
  streak: number;
  totalMissions: number;
  addXP: (amount: number, reason?: string) => void;
  incrementStreak: () => void;
  completeMission: () => void;
  getXPForNextLevel: () => number;
  getProgress: () => number;
  getXPHistory: () => any[];
  getXPBreakdown: () => Record<string, number>;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXP] = useState(1250);
  const [level, setLevel] = useState(5);
  const [streak, setStreak] = useState(7);
  const [totalMissions, setTotalMissions] = useState(12);

  // Calculate level based on XP
  useEffect(() => {
    const newLevel = calculateLevel(xp);
    setLevel(newLevel);
  }, [xp]);

  const addXP = (amount: number, reason?: string) => {
    setXP(prev => prev + amount);
  };

  const incrementStreak = () => {
    setStreak(prev => prev + 1);
  };

  const completeMission = () => {
    setTotalMissions(prev => prev + 1);
    addXP(50); // Award XP for completing mission
  };

  const getXPForNextLevel = () => {
    return calculateXPForNextLevel(xp);
  };

  const getProgress = () => {
    const currentLevelXP = (level - 1) * 250;
    const nextLevelXP = level * 250;
    return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
  };

  const getXPHistory = () => {
    // Mock history for now
    return [];
  };

  const getXPBreakdown = () => {
    // Mock breakdown for now
    return {
      'Missions': totalMissions * 50,
      'Daily Streak': streak * 10,
      'Bonus': Math.max(0, xp - (totalMissions * 50) - (streak * 10))
    };
  };

  return (
    <XPContext.Provider value={{
      xp,
      level,
      streak,
      totalMissions,
      addXP,
      incrementStreak,
      completeMission,
      getXPForNextLevel,
      getProgress,
      getXPHistory,
      getXPBreakdown
    }}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
}

// Utility functions
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 250) + 1;
}

export function calculateXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  return (currentLevel * 250) - currentXP;
}