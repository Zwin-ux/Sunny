'use client';

import { useState } from 'react';
import { ActivityPayload } from '@/types/activity';
import { useSession } from '@/contexts/SessionContext';

export interface InitialSessionData {
  sessionId: string;
  ageBracket: string;
  goal: string;
  introMessage: string;
  activity: ActivityPayload;
}

interface LearningSessionProps {
  initialSession: InitialSessionData;
}

export function LearningSession({ initialSession }: LearningSessionProps) {
  const { state, addHistoryEntry } = useSession();
  const [currentActivity, setCurrentActivity] = useState<ActivityPayload>(initialSession.activity);
  const [introMessage, setIntroMessage] = useState(initialSession.introMessage);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = currentActivity.steps[currentStepIndex] ?? currentActivity.steps[0];

  const sendAnswer = async (answer: string) => {
    setIsSubmitting(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const response = await fetch('/api/session/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId ?? initialSession.sessionId,
          ageBracket: initialSession.ageBracket,
          goal: initialSession.goal,
          previousAnswer: answer,
          activity: currentActivity,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error ?? 'Failed to continue session');
      }

      const data: { feedbackMessage: string; activity: ActivityPayload; previousCorrect?: boolean | null } = await response.json();

      addHistoryEntry({ activity: currentActivity, answer, wasCorrect: data.previousCorrect ?? null });
      setFeedbackMessage(data.feedbackMessage);
      setCurrentActivity(data.activity);
      setCurrentStepIndex(0);
      setSelectedChoice(null);
      setTextAnswer('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChoiceSelect = async (choice: string) => {
    setSelectedChoice(choice);
    await sendAnswer(choice);
  };

  const handleTextSubmit = async () => {
    if (!textAnswer) {
      setError('Please enter an answer to continue.');
      return;
    }

    await sendAnswer(textAnswer);
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
        <h2 className="text-lg font-semibold">Sunny says:</h2>
        <p>{introMessage}</p>
      </section>

      <section className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h3 className="text-xl font-bold text-purple-700">Activity: {currentActivity.topic}</h3>
          <p className="text-sm text-purple-500">Goal: {currentActivity.goal}</p>
        </header>

        {feedbackMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-green-800">
            {feedbackMessage}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-md bg-purple-50 p-4">
            <h4 className="font-semibold">Step {currentStepIndex + 1}</h4>
            <p className="mt-2 text-purple-900">{activeStep.prompt}</p>

            {activeStep.hint && (
              <p className="mt-2 text-sm text-purple-600">Hint: {activeStep.hint}</p>
            )}

            {activeStep.choices && activeStep.choices.length > 0 ? (
              <div className="mt-4 space-y-2">
                {activeStep.choices.map(choice => (
                  <label
                    key={choice}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition hover:bg-purple-100 ${
                      selectedChoice === choice ? 'border-purple-500 bg-purple-100' : 'border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activity-choice"
                      value={choice}
                      checked={selectedChoice === choice}
                      onChange={() => handleChoiceSelect(choice)}
                      disabled={isSubmitting}
                    />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={event => setTextAnswer(event.target.value)}
                  placeholder="Type your answer"
                  className="flex-1 rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  Submit answer
                </button>
              </div>
            )}
          </div>

          {currentActivity.steps.slice(1).length > 0 && (
            <div className="rounded-md bg-purple-100 p-3 text-sm text-purple-700">
              <p className="font-semibold">Up next:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {currentActivity.steps.slice(1).map((step, index) => (
                  <li key={`preview-${index}`}>{step.prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {isSubmitting && <p className="mt-4 text-sm text-purple-500">Sunny is thinking of the next activity...</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
