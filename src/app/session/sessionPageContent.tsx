'use client';

import { FormEvent, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { LearningSession } from '@/components/LearningSession';
import { ActivityPayload } from '@/types/activity';

const AGE_BRACKETS = ['6-8', '9-11', '12+'] as const;
const GOALS = [
  { value: 'fractions', label: 'Fractions (Math)' },
  { value: 'reading', label: 'Reading Focus' },
  { value: 'space', label: 'Space & Planets' },
];

interface StartResponse {
  sessionId: string;
  introMessage: string;
  activity: ActivityPayload;
  goal: string;
  ageBracket: string;
}

export function SessionPageContent() {
  const { startSession } = useSession();
  const [ageBracket, setAgeBracket] = useState<(typeof AGE_BRACKETS)[number]>('6-8');
  const [goal, setGoal] = useState('fractions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<StartResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ageBracket, goal }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error ?? 'Failed to start session');
      }

      const data: StartResponse = await response.json();
      setSessionData(data);
      startSession({ sessionId: data.sessionId, ageBracket: data.ageBracket, goal: data.goal });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-purple-700">Start a Sunny Learning Session</h1>
        <p className="mt-2 text-purple-500">
          Pick who you are and what you want to explore. Sunny will craft a tiny adventure for you!
        </p>
      </header>

      {!sessionData && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl border border-purple-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-purple-700">Your age range</label>
            <div className="mt-3 flex flex-wrap gap-3">
              {AGE_BRACKETS.map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setAgeBracket(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    ageBracket === option
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {option} years
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-700">What should Sunny help with?</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {GOALS.map(option => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setGoal(option.value)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    goal === option.value
                      ? 'border-purple-500 bg-purple-100 text-purple-800 shadow'
                      : 'border-purple-200 text-purple-600 hover:border-purple-400'
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs text-purple-500">Sunny has a mini-lesson ready!</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Loading Sunny magic...' : 'Start learning'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      )}

      {sessionData && (
        <section className="mt-8">
          <LearningSession
            initialSession={{
              sessionId: sessionData.sessionId,
              ageBracket: sessionData.ageBracket,
              goal: sessionData.goal,
              introMessage: sessionData.introMessage,
              activity: sessionData.activity,
            }}
          />
        </section>
      )}
    </main>
  );
}
