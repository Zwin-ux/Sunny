"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// CSS for claymation effects (copied for consistency)
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]";
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]`;
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`;
const clayInputBase = "rounded-xl border-4 bg-white py-3 px-4 text-base focus:ring-4 transition-all duration-200";
const clayInput = `${clayInputBase} ${clayShadow} border-orange-300 focus:border-yellow-400 focus:ring-yellow-200 w-full`;
const claySelectTrigger = `${clayInputBase} ${clayShadow} border-orange-300 focus:border-yellow-400 focus:ring-yellow-200 w-full h-auto text-left`; // Ensure text-left for select
const clayLabel = "block text-lg font-semibold text-orange-700 mb-2";

export default function LearningPreferencesPage() {
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [interests, setInterests] = useState<string>(""); // Comma-separated
  const [teachingStyle, setTeachingStyle] = useState<string>(""); // Default empty or a specific style

  const teachingStyleOptions = [
    { value: "visual", label: "Visual (Graphs, Images)" },
    { value: "kinesthetic", label: "Kinesthetic (Hands-on Activities)" },
    { value: "auditory", label: "Auditory (Listening, Speaking)" },
    { value: "reading_writing", label: "Reading/Writing (Texts, Notes)" },
    { value: "mixed", label: "Mixed/Balanced Approach" },
  ];

  const handleSavePreferences = () => {
    const preferences = {
      gradeLevel,
      interests: interests.split(",").map(interest => interest.trim()).filter(interest => interest !== ""),
      teachingStyle,
    };
    console.log("Learning Preferences:", preferences);
    alert("Learning preferences saved! (Placeholder action - check console)");
    // TODO: Implement actual save logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`${clayCard} border-orange-400 bg-orange-50 p-6 sm:p-10 w-full max-w-xl transform rotate-1`}>
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-700 drop-shadow-md transform -rotate-1">
            Learning Preferences
          </h1>
        </header>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div>
            <label htmlFor="gradeLevel" className={clayLabel}>
              Child’s Grade Level
            </label>
            <Input
              id="gradeLevel"
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 3rd Grade, Kindergarten"
              className={clayInput}
            />
          </div>

          <div>
            <label htmlFor="interests" className={clayLabel}>
              Interests (comma-separated)
            </label>
            <Input
              id="interests"
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g., Dinosaurs, Space, Art, Coding"
              className={clayInput}
            />
          </div>

          <div>
            <label htmlFor="teachingStyle" className={clayLabel}>
              Preferred Teaching Style
            </label>
            <Select
              value={teachingStyle}
              onValueChange={(value) => setTeachingStyle(value)}
            >
              <SelectTrigger id="teachingStyle" className={claySelectTrigger}>
                <SelectValue placeholder="Select a teaching style" />
              </SelectTrigger>
              <SelectContent
                className="bg-white rounded-xl border-4 border-orange-300 shadow-lg"
                position="popper"
              >
                {teachingStyleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-orange-700 hover:bg-orange-100 focus:bg-orange-100 p-3 cursor-pointer">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSavePreferences}
              className={`${clayButton} bg-red-400 border-4 border-red-500 text-red-800 hover:bg-red-500`}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
