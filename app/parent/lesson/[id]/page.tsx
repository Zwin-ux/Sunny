"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// CSS for claymation effects (copied for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;
const clayLabel = "font-semibold text-purple-600"; // For labeling placeholder data

export default function LessonDetailPage() {
  const params = useParams();
  const id = params.id as string; // params.id can be string | string[]

  // Placeholder lesson data - in a real app, this would be fetched based on ID
  const lessonDetails = {
    title: "Placeholder Title: Understanding Photosynthesis",
    subject: "Placeholder Subject: Science",
    objectives: [
      "Students will be able to define photosynthesis.",
      "Students will be able to identify the reactants and products of photosynthesis.",
      "Students will be able to explain the importance of photosynthesis for life on Earth.",
    ],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`${clayCard} border-indigo-400 bg-indigo-50 p-6 sm:p-10 w-full max-w-2xl transform rotate-1`}>
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 drop-shadow-md transform -rotate-1">
            Lesson Details
          </h1>
          <p className="text-sm text-indigo-500 mt-1">Displaying details for Lesson ID: {id}</p>
        </header>

        <div className="space-y-4 mb-8">
          <div>
            <span className={clayLabel}>Title:</span>
            <p className="text-gray-800 text-lg">{lessonDetails.title}</p>
          </div>
          <div>
            <span className={clayLabel}>Subject:</span>
            <p className="text-gray-800 text-lg">{lessonDetails.subject}</p>
          </div>
          <div>
            <span className={clayLabel}>Learning Objectives:</span>
            <ul className="list-disc list-inside text-gray-800 space-y-1 pl-2">
              {lessonDetails.objectives.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>

        <nav className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link href={`/parent/lesson/${id}/edit`} passHref>
            <Button
              asChild
              className={`${clayButton} bg-yellow-400 border-4 border-yellow-500 text-yellow-800 hover:bg-yellow-500`}
            >
              <span>Edit Plan</span>
            </Button>
          </Link>
          <Link href={`/parent/lesson/${id}/preview`} passHref>
            <Button
              asChild
              className={`${clayButton} bg-green-400 border-4 border-green-500 text-green-800 hover:bg-green-500`}
            >
              <span>Preview Plan</span>
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}
