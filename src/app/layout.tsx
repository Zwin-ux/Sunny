'use client';

import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "../components/theme-provider"
import { LanguageProvider } from "../contexts/LanguageContext"
import { LearningSessionProvider } from "../contexts/LearningSessionContext"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>Sunny AI - Your Child's AI Learning Companion</title>
        <meta name="description" content="Autonomous AI teacher that adapts to your child's learning style. Personalized lessons, real-time support, and fun gamification for kids aged 6-10." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <LearningSessionProvider>
              {children}
              <Toaster position="top-center" richColors />
            </LearningSessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}