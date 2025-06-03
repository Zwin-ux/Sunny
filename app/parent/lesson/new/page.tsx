"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Optional: for clayCard style

// CSS for claymation effects (copied for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
const clayInputBase = "rounded-xl border-4 bg-white py-3 px-4 text-base focus:ring-4 transition-all duration-200"; // Slightly adjusted from clayInput for general inputs
const clayInput = `${clayInputBase} border-purple-300 focus:border-yellow-400 focus:ring-yellow-200`;
const clayTextarea = `${clayInputBase} border-purple-300 focus:border-yellow-400 focus:ring-yellow-200 min-h-[100px]`; // Textarea specific
const clayLabel = "block text-lg font-semibold text-purple-700 mb-1 ml-1";
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;

export default function CreateLessonPlanPage() {
  const [lessonTitle, setLessonTitle] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [subject, setSubject] = useState("");
  // const [gradeLevel, setGradeLevel] = useState(""); // Example of another field

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // For now, just log the data. Later, this will be a POST request.
    const lessonData = {
      title: lessonTitle,
      objectives: learningObjectives,
      subject: subject,
      // gradeLevel: gradeLevel,
    };
    console.log("Lesson Plan Data:", lessonData);
    alert("Lesson plan data logged to console! (Placeholder action)");
    // TODO: Add POST request to /api/lesson/generate
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`${clayCard} border-purple-400 bg-purple-50 p-6 sm:p-10 w-full max-w-2xl transform -rotate-1`}>
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 drop-shadow-md transform rotate-1">
            Create New Lesson Plan
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="lessonTitle" className={clayLabel}>
              Lesson Title
            </label>
            <Input
              id="lessonTitle"
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g., Introduction to Algebra"
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
              placeholder="e.g., Students will be able to solve linear equations..."
              className={clayTextarea}
              required
              rows={4}
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
              placeholder="e.g., Math, Science, History"
              className={clayInput}
              required
            />
          </div>

          {/*
          // Example for another field like Grade Level:
          <div>
            <label htmlFor="gradeLevel" className={clayLabel}>
              Grade Level (Optional)
            </label>
            <Input
              id="gradeLevel"
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 5th Grade, High School"
              className={clayInput}
            />
          </div>
          */}

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              className={`${clayButton} bg-green-400 border-4 border-green-500 text-green-800 hover:bg-green-500`}
            >
              Generate Lesson Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
