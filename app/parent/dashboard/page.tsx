"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button"; // Using Button component
import React from "react";

// CSS for claymation effects (copied from app/page.tsx for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
// const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;

export default function ParentDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 flex flex-col items-center justify-center p-4 sm:p-8 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-700 drop-shadow-lg">
          Parent Dashboard
        </h1>
      </header>

      <nav className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        {/* My Lessons Button - Placeholder action for now */}
        <Button
          className={`${clayButton} bg-pink-400 border-4 border-pink-500 text-pink-800 hover:bg-pink-500`}
          onClick={() => alert("My Lessons clicked!")} // Placeholder action
        >
          My Lessons
        </Button>

        {/* Generate New Plan Button */}
        <Link href="/parent/lesson/new" passHref>
          <Button
            asChild // Important for Link wrapping Button
            className={`${clayButton} bg-yellow-400 border-4 border-yellow-500 text-yellow-800 hover:bg-yellow-500`}
          >
            <span>Generate New Plan</span>
          </Button>
        </Link>
      </nav>

      {/* Optional: Add a simple card for visual structure if desired in future */}
      {/* <div className={`${clayCard} border-purple-300 bg-white p-8 mt-8 w-full max-w-md text-center`}>
        <p className="text-lg text-gray-700">Welcome to your dashboard. Manage lessons and plans here.</p>
      </div> */}
    </div>
  );
}
