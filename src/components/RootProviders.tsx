"use client";

import { ThemeProvider } from "./theme-provider";
import { LanguageProvider } from "../contexts/LanguageContext";
import { LearningSessionProvider } from "../contexts/LearningSessionContext";
import { XPProvider } from "../contexts/XPContext";
import { Toaster } from "sonner";
import { ReactNode } from "react";

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <LearningSessionProvider>
          <XPProvider>
            {children}
            <Toaster position="top-center" richColors />
          </XPProvider>
        </LearningSessionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
