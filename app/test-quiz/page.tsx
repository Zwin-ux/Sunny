'use client';

import { Quiz } from '@/components/quiz/Quiz';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function TestQuizPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sunny AI Quiz</h1>
        <LanguageSelector />
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Quiz lessonId="math-patterns-001" />
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">How it works:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Select your preferred language from the top-right dropdown</li>
          <li>Answer the quiz questions that are generated based on the lesson</li>
          <li>Get instant feedback on your answers</li>
          <li>Learn from the explanations provided</li>
        </ul>
      </div>
    </div>
  );
}
