'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth'
import { appendActivityDay, recordXP } from '@/lib/persistence'

interface XPContextType {
  xp: number;
  level: number;
  streak: number;
  totalMissions: number;
  addXP: (amount: number, reason?: string) => void;
  setStreak: (days: number) => void;
  incrementMissions: () => void;
  getXPForNextLevel: () => number;
  getProgress: () => number;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

const XP_PER_LEVEL = 100; // XP needed per level
const LEVEL_MULTIPLIER = 1.5; // Each level requires 50% more XP

function calculateLevel(xp: number): number {
  let level = 1;
  let xpNeeded = XP_PER_LEVEL;
  let totalXP = 0;

  while (totalXP + xpNeeded <= xp) {
    totalXP += xpNeeded;
    level++;
    xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }

  return level;
}

function calculateXPForNextLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

function calculateCurrentLevelXP(xp: number, level: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, i - 1));
  }
  return xp - totalXP;
}

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreakState] = useState(0);
  const [totalMissions, setTotalMissions] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    // init broadcast channel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcRef.current = new BroadcastChannel('sunny-xp')
        bcRef.current.onmessage = (e: MessageEvent) => {
          const { type, payload } = e.data || {}
          if (type === 'xp-sync') {
            const { xp: nXP, level: nLevel, streak: nStreak, totalMissions: nM } = payload || {}
            setXP(nXP)
            setLevel(nLevel)
            setStreakState(nStreak)
            setTotalMissions(nM)
          }
          if (type === 'xp-add' && document.hidden) {
            // lightweight notification when backgrounded
            if ('Notification' in window && Notification.permission === 'granted') {
              try { new Notification(`+${payload?.amount || 0} XP`, { body: payload?.reason || 'Progress updated' }) } catch {}
            }
          }
        }
      }
    } catch {}

    const savedXP = localStorage.getItem('userXP');
    const savedStreak = localStorage.getItem('userStreak');
    const savedMissions = localStorage.getItem('totalMissions');
    const lastActive = localStorage.getItem('lastActiveDate');

    if (savedXP) {
      const xpValue = parseInt(savedXP);
      setXP(xpValue);
      setLevel(calculateLevel(xpValue));
    }

    if (savedStreak) {
      const streakValue = parseInt(savedStreak);
      // Check if streak should be reset (more than 1 day since last active)
      if (lastActive) {
        const lastDate = new Date(lastActive);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          setStreakState(0);
          localStorage.setItem('userStreak', '0');
        } else if (diffDays === 1) {
          // Continue streak
          setStreakState(streakValue);
        } else {
          // Same day
          setStreakState(streakValue);
        }
      } else {
        setStreakState(streakValue);
      }
    }

    if (savedMissions) {
      setTotalMissions(parseInt(savedMissions));
    }

    // Update last active date and persist activity day
    const todayIso = new Date().toISOString().slice(0,10)
    localStorage.setItem('lastActiveDate', new Date().toISOString());
    try {
      const u = getCurrentUser()
      if (u) appendActivityDay(u.id || u.name, todayIso)
    } catch {}
    setIsInitialized(true);

    // ask notification permission lazily
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    } catch {}

    return () => {
      try { bcRef.current?.close() } catch {}
    }
  }, []);

  // Sync to localStorage whenever values change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('userXP', xp.toString());
      localStorage.setItem('userStreak', streak.toString());
      localStorage.setItem('totalMissions', totalMissions.toString());
      try { bcRef.current?.postMessage({ type: 'xp-sync', payload: { xp, level, streak, totalMissions } }) } catch {}
    }
  }, [xp, streak, totalMissions, isInitialized]);

  const celebrateLevelUp = useCallback((newLevel: number) => {
    // Lightweight confetti fallback (no dependency)
    try {
      const duration = 1500
      const count = 60
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '0'
      container.style.top = '0'
      container.style.width = '100%'
      container.style.height = '0'
      container.style.pointerEvents = 'none'
      container.style.zIndex = '9999'
      document.body.appendChild(container)

      // create keyframes once
      const styleId = 'sunny-confetti-style'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `@keyframes sunnyFall { 0% { transform: translateY(-20px) rotate(0); opacity: 1 } 100% { transform: translateY(80vh) rotate(720deg); opacity: 0 } }`
        document.head.appendChild(style)
      }

      for (let i = 0; i < count; i++) {
        const el = document.createElement('div')
        el.textContent = ['✨','⭐','💫','🌟','🎉'][Math.floor(Math.random()*5)]
        el.style.position = 'absolute'
        el.style.left = Math.random()*100 + 'vw'
        el.style.top = (Math.random()*10) + 'vh'
        el.style.fontSize = (12 + Math.random()*18) + 'px'
        el.style.animation = `sunnyFall ${1 + Math.random()*1.2}s ease-out forwards`
        container.appendChild(el)
        setTimeout(() => { try { el.remove() } catch {} }, duration + 500)
      }
      setTimeout(() => { try { container.remove() } catch {} }, duration + 800)
    } catch {}

    // Toast notification
    toast.success(`🎉 Level Up! You're now Level ${newLevel}!`, {
      duration: 5000,
      style: {
        background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
        color: '#000',
        fontWeight: 'bold',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    });

    // Play sound (optional)
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('/sounds/level-up.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio errors
        });
      } catch (e) {
        // Ignore if audio not available
      }
    }
  }, []);

  const addXP = useCallback((amount: number, reason?: string) => {
    setXP(prevXP => {
      const newXP = prevXP + amount;
      const oldLevel = calculateLevel(prevXP);
      const newLevel = calculateLevel(newXP);

      // Check for level up
      if (newLevel > oldLevel) {
        setLevel(newLevel);
        celebrateLevelUp(newLevel);
      }

      // Show XP gain toast
      const message = reason ? `+${amount} XP - ${reason}` : `+${amount} XP`;
      toast.success(message, {
        duration: 2000,
        style: {
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          color: '#fff',
          fontWeight: 'bold',
          border: '2px solid #000',
          boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        },
      });

      // cross-tab notify
      try { bcRef.current?.postMessage({ type: 'xp-add', payload: { amount, reason } }) } catch {}

      // persist to server (best-effort)
      try { const u = getCurrentUser(); if (u) recordXP(u.id || u.name, amount, reason) } catch {}

      // emit browser event for chat integration
      try { window.dispatchEvent(new CustomEvent('sunny:xp', { detail: { amount, reason } })) } catch {}

      return newXP;
    });
  }, [celebrateLevelUp]);

  const setStreak = useCallback((days: number) => {
    setStreakState(days);
  }, []);

  const incrementMissions = useCallback(() => {
    setTotalMissions(prev => prev + 1);
  }, []);

  const getXPForNextLevel = useCallback(() => {
    return calculateXPForNextLevel(level);
  }, [level]);

  const getProgress = useCallback(() => {
    const currentLevelXP = calculateCurrentLevelXP(xp, level);
    const xpNeeded = getXPForNextLevel();
    return (currentLevelXP / xpNeeded) * 100;
  }, [xp, level, getXPForNextLevel]);

  return (
    <XPContext.Provider
      value={{
        xp,
        level,
        streak,
        totalMissions,
        addXP,
        setStreak,
        incrementMissions,
        getXPForNextLevel,
        getProgress,
      }}
    >
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
