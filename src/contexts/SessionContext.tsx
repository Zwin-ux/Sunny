'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ActivityPayload } from '@/types/activity';

interface SessionHistoryEntry {
  activity: ActivityPayload;
  answer?: string;
  wasCorrect?: boolean | null;
  timestamp: string;
}

interface SessionState {
  sessionId?: string;
  ageBracket?: string;
  goal?: string;
  history: SessionHistoryEntry[];
}

interface SessionContextValue {
  state: SessionState;
  startSession: (payload: { sessionId: string; ageBracket: string; goal: string }) => void;
  addHistoryEntry: (entry: { activity: ActivityPayload; answer?: string; wasCorrect?: boolean | null }) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const initialState: SessionState = {
  history: [],
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);

  const startSession = useCallback((payload: { sessionId: string; ageBracket: string; goal: string }) => {
    setState({
      sessionId: payload.sessionId,
      ageBracket: payload.ageBracket,
      goal: payload.goal,
      history: [],
    });
  }, []);

  const addHistoryEntry = useCallback((entry: { activity: ActivityPayload; answer?: string; wasCorrect?: boolean | null }) => {
    setState(prev => ({
      ...prev,
      history: [
        ...prev.history,
        {
          activity: entry.activity,
          answer: entry.answer,
          wasCorrect: entry.wasCorrect ?? null,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo(
    () => ({
      state,
      startSession,
      addHistoryEntry,
      reset,
    }),
    [state, startSession, addHistoryEntry, reset]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
