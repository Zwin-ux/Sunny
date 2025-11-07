'use client';

import { useState } from 'react';
import { DemoWelcome } from '@/components/demo/DemoWelcome';
import { DemoQuickCheck } from '@/components/demo/DemoQuickCheck';
import { DemoMission } from '@/components/demo/DemoMission';
import { DemoResults } from '@/components/demo/DemoResults';
import { DemoWaitlistCTA } from '@/components/demo/DemoWaitlistCTA';
import { CloudGardenStage } from '@/components/stages/CloudGardenStage';
import { DemoStep, DifficultyLevel, Answer } from '@/types/demo';

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>('welcome');
  const [level, setLevel] = useState<DifficultyLevel>('easy');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [playerId] = useState(() => `demo_${Date.now()}`);
  const [playgroundCompleted, setPlaygroundCompleted] = useState(false);

  const handleQuickCheckComplete = (determinedLevel: DifficultyLevel) => {
    setLevel(determinedLevel);
    setStep('mission');
  };

  const handleMissionComplete = (missionAnswers: Answer[]) => {
    setAnswers(missionAnswers);
    setStep('results');
  };

  return (
    <>
      {step === 'welcome' && (
        <DemoWelcome onStart={() => setStep('check')} />
      )}

      {step === 'check' && (
        <DemoQuickCheck onComplete={handleQuickCheckComplete} />
      )}

      {step === 'mission' && (
        <DemoMission 
          initialLevel={level}
          onComplete={handleMissionComplete}
        />
      )}

      {step === 'results' && (
        <DemoResults
          answers={answers}
          onContinue={() => setStep('waitlist')}
          onPlayground={() => setStep('playground')}
        />
      )}

      {step === 'playground' && (
        <CloudGardenStage
          playerId={playerId}
          onComplete={() => {
            setPlaygroundCompleted(true);
            setStep('waitlist');
          }}
        />
      )}

      {step === 'waitlist' && (
        <DemoWaitlistCTA playgroundCompleted={playgroundCompleted} />
      )}
    </>
  );
}
