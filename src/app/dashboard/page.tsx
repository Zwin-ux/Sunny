'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/user';
import { Emotion } from '@/types/chat'; // Import Emotion type

// For MVP, we'll use a hardcoded user ID. In a real app, this would come from auth.
const MOCK_USER_ID = 'user-123';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newInterest, setNewInterest] = useState('');
  const [learningPlan, setLearningPlan] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<any | null>(null); // Type this more strictly later
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | 'neutral'>('neutral');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/user?id=${MOCK_USER_ID}`);
        if (res.ok) {
          const userData: UserProfile = await res.json();
          setUser(userData);
        } else if (res.status === 404) {
          // Create a mock user if not found for MVP
          const newUser: UserProfile = {
            id: MOCK_USER_ID,
            name: 'Mock Student',
            email: 'student@example.com',
            passwordHash: '',
            progress: {},
            chatHistory: [],
            learningInterests: [],
            quizProgress: {},
          };
          await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
          });
          setUser(newUser);
        } else {
          console.error('Failed to fetch user', await res.text());
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleAddInterest = async () => {
    if (newInterest.trim() && user) {
      const updatedUser = {
        ...user,
        learningInterests: [...user.learningInterests, newInterest.trim()],
      };
      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
        if (res.ok) {
          setUser(updatedUser);
          setNewInterest('');
        } else {
          console.error('Failed to update user interests', await res.text());
        }
      } catch (error) {
        console.error('Error updating user interests:', error);
      }
    }
  };

  const handleGeneratePlan = async () => {
    if (!user) return;
    setLearningPlan(null);
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'plan',
          topic: user.learningInterests.length > 0 ? user.learningInterests[0] : 'general knowledge', // Use first interest or default
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLearningPlan(data.plan);
      } else {
        console.error('Failed to generate plan', await res.text());
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!user) return;
    setQuiz(null);
    try {
      // For MVP, we'll use a dummy lesson structure for quiz generation
      // In a real app, this would come from a selected lesson or generated plan
      const dummyLesson = {
        title: user.learningInterests.length > 0 ? user.learningInterests[0] : 'general knowledge',
        content: { description: `A brief overview of ${user.learningInterests.length > 0 ? user.learningInterests[0] : 'general knowledge'}.` },
      };

      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'quiz',
          lesson: dummyLesson,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
      } else {
        console.error('Failed to generate quiz', await res.text());
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    }
  };

  const handleMarkQuizCorrect = async () => {
    if (!user || !quiz) return;

    const updatedQuizProgress = {
      ...(user.quizProgress || {}),
      [quiz.title]: {
        correct: ((user.quizProgress?.[quiz.title]?.correct || 0) + 1),
        total: ((user.quizProgress?.[quiz.title]?.total || 0) + 1),
      },
    };

    const updatedUser = {
      ...user,
      quizProgress: updatedQuizProgress,
    };

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        setUser(updatedUser);
        alert('Quiz progress updated!');
      } else {
        console.error('Failed to update quiz progress', await res.text());
      }
    } catch (error) {
      console.error('Error updating quiz progress:', error);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !user) return;

    const newUserMessage = { role: 'user', content: chatInput.trim() };
    const updatedChatMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedChatMessages);
    setChatInput('');

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'chat',
          chatHistory: updatedChatMessages, // Send current chat history for context
          emotion: selectedEmotion, // Send selected emotion
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        console.error('Failed to get chat response', await res.text());
      }
    } catch (error) {
      console.error('Error getting chat response:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  // For MVP, we'll assume a student role. A real app would have role-based rendering.
  const isTeacher = false; // Placeholder

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Sunny AI Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Image src="/sunny.png" alt="Sunny AI Logo" width={50} height={50} />
          <span className="text-lg font-medium text-gray-700">{user?.name || 'Guest'}</span>
        </div>
      </header>

      {isTeacher ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Teacher Dashboard (MVP)</h2>
          <p className="text-gray-600">This section will provide tools for managing students, lessons, and progress tracking.</p>
          <Image src="/robot.png" alt="Teacher Robot" width={150} height={150} className="mt-4 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Interests Section */}
          <section className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Learning Interests</h2>
            <div className="flex mb-4">
              <input
                type="text"
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Add a new interest (e.g., 'Quantum Physics')"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInterest();
                  }
                }}
              />
              <button
                onClick={handleAddInterest}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <ul className="space-y-2">
              {user?.learningInterests.length === 0 ? (
                <li className="text-gray-500 italic">No interests added yet.</li>
              ) : (
                user?.learningInterests.map((interest, index) => (
                  <li key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm inline-block mr-2 mb-2">
                    {interest}
                  </li>
                ))
              )}
            </ul>
            <div className="mt-6 text-center">
              <Image src="/bulb.png" alt="Idea Bulb" width={100} height={100} className="mx-auto" />
              <p className="text-gray-600 mt-2">Tell Sunny what you want to learn!</p>
            </div>
          </section>

          {/* Learning Plan Section */}
          <section className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personalized Learning Plan</h2>
            <button
              onClick={handleGeneratePlan}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold mb-4"
            >
              Generate My Learning Plan
            </button>
            {learningPlan ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-medium text-gray-700 mb-2">Your Plan:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{learningPlan}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Click "Generate My Learning Plan" to get started!</p>
            )}
            <div className="mt-6 text-center">
              <Image src="/quiz.png" alt="Learning Plan" width={150} height={150} className="mx-auto" />
            </div>
          </section>

          {/* Quiz Section */}
          <section className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Quiz</h2>
            <button
              onClick={handleGenerateQuiz}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors text-lg font-semibold mb-4"
            >
              Generate a Quiz Question
            </button>
            {quiz ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-xl font-medium text-gray-700 mb-2">Question: {quiz.question}</h3>
                <ul className="list-disc list-inside ml-4">
                  {quiz.options.map((option: string, index: number) => (
                    <li key={index} className="text-gray-600">{option}</li>
                  ))}
                </ul>
                <p className="mt-4 text-green-700 font-semibold">Correct Answer: {quiz.correctAnswer}</p>
                <p className="text-gray-700 mt-2">Explanation: {quiz.explanation}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Click "Generate a Quiz Question" to test your knowledge!</p>
            )}
            <div className="mt-6 text-center">
              <Image src="/sunny.png" alt="Quiz" width={100} height={100} className="mx-auto" />
            </div>
          </section>

          {/* Quiz Section */}
          <section className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Quiz</h2>
            <button
              onClick={handleGenerateQuiz}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors text-lg font-semibold mb-4"
            >
              Generate a Quiz Question
            </button>
            {quiz ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-xl font-medium text-gray-700 mb-2">Question: {quiz.question}</h3>
                <ul className="list-disc list-inside ml-4">
                  {quiz.options.map((option: string, index: number) => (
                    <li key={index} className="text-gray-600">{option}</li>
                  ))}
                </ul>
                <p className="mt-4 text-green-700 font-semibold">Correct Answer: {quiz.correctAnswer}</p>
                <p className="text-gray-700 mt-2">Explanation: {quiz.explanation}</p>
                <button
                  onClick={handleMarkQuizCorrect}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Mark as Correct (for demo)
                </button>
              </div>
            ) : (
              <p className="text-gray-500 italic">Click "Generate a Quiz Question" to test your knowledge!</p>
            )}
            <div className="mt-6 text-center">
              <Image src="/sunny.png" alt="Quiz" width={100} height={100} className="mx-auto" />
            </div>
          </section>

          {/* Chat Section */}
          <section className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chat with Sunny</h2>
            <div className="flex flex-col h-80 bg-gray-50 p-4 rounded-md border border-gray-200 overflow-y-auto mb-4">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 italic">Start a conversation with Sunny!</p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex">
              <input
                type="text"
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ask Sunny a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleChatSubmit();
                  }
                }}
              />
              <select
                className="p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedEmotion}
                onChange={(e) => setSelectedEmotion(e.target.value as Emotion)}
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="confused">Confused</option>
                <option value="encouraging">Encouraging</option>
                <option value="curious">Curious</option>
              </select>
              <button
                onClick={handleChatSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
            <div className="mt-6 text-center">
              <Image src="/robot.png" alt="Chat with Sunny" width={100} height={100} className="mx-auto" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
