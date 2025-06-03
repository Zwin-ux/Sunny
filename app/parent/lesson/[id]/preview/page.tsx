"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // For navigation button

// CSS for claymation effects (copied for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;
const claySubheading = "text-2xl font-bold text-gray-700 mb-3 drop-shadow-sm";

export default function PreviewLessonPlanPage() {
  const params = useParams();
  const id = params.id as string;

  const placeholderActivities = [
    "Warm-up: Quick recap quiz on previous related topics.",
    "Introduction: Short video explaining the core concept.",
    "Main Activity: Interactive simulation or group-based problem solving.",
    "Discussion: Class discussion on findings and challenges.",
    "Wrap-up: Creative summary task (e.g., draw a concept map, write a short poem).",
    "Assessment: Brief formative quiz or exit ticket.",
  ];

  const placeholderGeneratedContent = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

    Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Nullam id dolor id nibh ultricies vehicula ut id elit.
    Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
    Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
  `;

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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex flex-col items-center p-4 sm:p-8 space-y-8">
      <header className="text-center mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 drop-shadow-lg">
          Preview Lesson Plan
        </h1>
        <p className="text-sm text-purple-600 mt-1">Previewing AI Generated Plan for ID: {id}</p>
      </header>

      <div className={`${clayCard} border-pink-400 bg-pink-50 p-6 sm:p-8 w-full max-w-3xl transform rotate-1`}>
        <h2 className={`${claySubheading} text-pink-700`}>Suggested Lesson Activities</h2>
        <ul className="list-decimal list-inside space-y-2 text-gray-700 pl-2">
          {placeholderActivities.map((activity, index) => (
            <li key={index} className="text-base">{activity}</li>
          ))}
        </ul>
      </div>

      <div className={`${clayCard} border-orange-400 bg-orange-50 p-6 sm:p-8 w-full max-w-3xl transform -rotate-1`}>
        <h2 className={`${claySubheading} text-orange-700`}>Generated Lesson Content Snippet</h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
          <p>{placeholderGeneratedContent.trim()}</p>
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <Link href={`/parent/lesson/${id}`} passHref>
          <Button asChild className={`${clayButton} bg-gray-400 border-4 border-gray-500 text-gray-800 hover:bg-gray-500`}>
            <span>Back to Details</span>
          </Button>
        </Link>
        <Link href={`/parent/lesson/${id}/edit`} passHref>
            <Button
              asChild
              className={`${clayButton} bg-yellow-400 border-4 border-yellow-500 text-yellow-800 hover:bg-yellow-500`}
            >
              <span>Edit This Plan</span>
            </Button>
          </Link>
      </div>
    </div>
  );
}
