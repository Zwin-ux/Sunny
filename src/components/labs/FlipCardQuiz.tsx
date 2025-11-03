// Placeholder FlipCardQuiz component
import React from 'react';

interface FlipCardQuizProps {
  onComplete: (score: number) => void;
}

export const FlipCardQuiz: React.FC<FlipCardQuizProps> = ({ onComplete }) => {
  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-black text-gray-900 mb-4">Flip Card Quiz</h2>
      <p className="text-gray-600 mb-6">This interactive lab is coming soon! 📚</p>
      <button
        onClick={() => onComplete(100)}
        className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform"
      >
        Complete Demo
      </button>
    </div>
  );
};