"use client";

import React, { useState } from "react";
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
// Adapting clayInput style for the SelectTrigger
const claySelectTrigger = `rounded-xl border-4 bg-white py-3 px-4 text-base focus:ring-4 transition-all duration-200 ${clayShadow} border-sky-300 focus:border-yellow-400 focus:ring-yellow-200 w-full max-w-xs h-auto`;
const clayLabel = "block text-lg font-semibold text-sky-700 mb-2";

export default function AISettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>("openai"); // Default value

  const handleSavePreference = () => {
    console.log("Selected AI Provider:", selectedProvider);
    alert(`AI Provider preference (${selectedProvider}) saved! (Placeholder action)`);
    // TODO: Implement actual save logic (e.g., API call to save user preference)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-100 to-teal-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`${clayCard} border-sky-400 bg-sky-50 p-6 sm:p-10 w-full max-w-lg transform -rotate-1`}>
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-700 drop-shadow-md transform rotate-1">
            AI Settings
          </h1>
        </header>

        <div className="space-y-6">
          <div>
            <label htmlFor="aiProvider" className={clayLabel}>
              Choose AI Provider
            </label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value)}
            >
              <SelectTrigger id="aiProvider" className={claySelectTrigger}>
                <SelectValue placeholder="Select AI Provider" />
              </SelectTrigger>
              <SelectContent
                className="bg-white rounded-xl border-4 border-sky-300 shadow-lg" // Basic styling for content dropdown
                position="popper" // Ensures it drops correctly
              >
                <SelectItem value="openai" className="text-sky-700 hover:bg-sky-100 focus:bg-sky-100 p-3 cursor-pointer">OpenAI</SelectItem>
                <SelectItem value="gemini" className="text-sky-700 hover:bg-sky-100 focus:bg-sky-100 p-3 cursor-pointer">Gemini</SelectItem>
                <SelectItem value="claude" className="text-sky-700 hover:bg-sky-100 focus:bg-sky-100 p-3 cursor-pointer">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSavePreference}
              className={`${clayButton} bg-teal-400 border-4 border-teal-500 text-teal-800 hover:bg-teal-500`}
            >
              Save AI Preference
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
