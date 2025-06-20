'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface QuizProps {
  lessonId: string;
  onComplete?: (score: number) => void;
}

export function Quiz({ lessonId, onComplete }: QuizProps) {
  const { t, language } = useLanguage();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  const generateNewQuestion = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedOption(null);
      setIsCorrect(null);

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          language,
          difficulty: 'beginner', // You can make this dynamic based on user level
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate question');
      }

      const data = await response.json();
      setCurrentQuestion(data);
      setQuestionCount(prev => prev + 1);
    } catch (err) {
      console.error('Error generating question:', err);
      setError(t('quiz.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedOption || !currentQuestion) return;

    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    generateNewQuestion();
  };

  useEffect(() => {
    generateNewQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('quiz.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        {error}
        <Button onClick={generateNewQuestion} className="mt-4">
          {t('quiz.retry')}
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('quiz.title', { number: questionCount })}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-6">{currentQuestion.question}</p>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option: string, index: number) => (
            <Button
              key={index}
              variant={selectedOption === option ? 'default' : 'outline'}
              className={`w-full text-left justify-start ${
                isCorrect !== null && option === currentQuestion.correctAnswer
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : isCorrect === false && selectedOption === option
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : ''
              }`}
              onClick={() => !isCorrect && setSelectedOption(option)}
              disabled={isCorrect !== null}
            >
              {String.fromCharCode(65 + index)}. {option}
            </Button>
          ))}
        </div>

        {isCorrect !== null && (
          <div className={`mt-4 p-4 rounded-md ${
            isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {isCorrect ? (
              <p>{t('quiz.correct')}</p>
            ) : (
              <p>{t('quiz.incorrect', { answer: currentQuestion.correctAnswer })}</p>
            )}
            {currentQuestion.explanation && (
              <p className="mt-2 text-sm">{currentQuestion.explanation}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {t('quiz.score', { score, total: questionCount })}
        </div>
        {isCorrect === null ? (
          <Button onClick={handleSubmit} disabled={!selectedOption}>
            {t('quiz.submit')}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {t('quiz.next')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
