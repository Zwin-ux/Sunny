"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// CSS for claymation effects (copied for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
const clayInputBase = "rounded-xl border-4 bg-white py-3 px-4 text-base focus:ring-4 transition-all duration-200";
const clayInput = `${clayInputBase} border-green-300 focus:border-yellow-400 focus:ring-yellow-200`;
const clayTextarea = `${clayInputBase} border-green-300 focus:border-yellow-400 focus:ring-yellow-200 min-h-[100px]`;
const clayLabel = "block text-lg font-semibold text-green-700 mb-1 ml-1";
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;

export default function EditLessonPlanPage() {
  const params = useParams();
  const id = params.id as string;

  // Placeholder data - in a real app, fetch existing lesson data using 'id'
  const [lessonTitle, setLessonTitle] = useState("Placeholder: Fun with Fractions");
  const [subject, setSubject] = useState("Placeholder: Mathematics");
  const [learningObjectives, setLearningObjectives] = useState(
    "1. Students will understand what a fraction is.\n2. Students will be able to add simple fractions.\n3. Students will be able to identify equivalent fractions."
  );

  // Effect to simulate fetching data if needed, or could be used if props were passed
  useEffect(() => {
    if (id) {
      // In a real app, you would fetch lesson data based on 'id' here
      // and then setLessonTitle, setSubject, setLearningObjectives
      console.log("Fetching or setting up data for lesson ID:", id);
    }
  }, [id]);

  const handleSaveChanges = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedLessonData = {
      id: id,
      title: lessonTitle,
      subject: subject,
      objectives: learningObjectives,
    };
    console.log("Updated Lesson Plan Data:", updatedLessonData);
    alert("Changes saved! (Placeholder action - check console)");
    // TODO: Implement actual save logic (e.g., API call)
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className={`${clayCard} border-red-400 bg-red-50 p-6 sm:p-10 w-full max-w-lg text-center`}>
          <h1 className="text-2xl font-bold text-red-700">Error: Lesson ID not found.</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`${clayCard} border-green-400 bg-green-50 p-6 sm:p-10 w-full max-w-2xl transform -rotate-1`}>
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-green-700 drop-shadow-md transform rotate-1">
            Edit Lesson Plan
          </h1>
          <p className="text-sm text-green-600 mt-1">Editing Lesson ID: {id}</p>
        </header>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div>
            <label htmlFor="lessonTitle" className={clayLabel}>
              Lesson Title
            </label>
            <Input
              id="lessonTitle"
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className={clayInput}
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className={clayLabel}>
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={clayInput}
              required
            />
          </div>

          <div>
            <label htmlFor="learningObjectives" className={clayLabel}>
              Learning Objectives
            </label>
            <Textarea
              id="learningObjectives"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className={clayTextarea}
              required
              rows={5}
            />
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              className={`${clayButton} bg-blue-400 border-4 border-blue-500 text-blue-800 hover:bg-blue-500`}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
