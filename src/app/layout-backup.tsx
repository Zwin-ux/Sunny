import React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "../components/theme-provider"
import { LanguageProvider } from "../contexts/LanguageContext"
import { LearningSessionProvider } from "../contexts/LearningSessionContext"
import { XPProvider } from "../contexts/XPContext"
import { Toaster } from "sonner"
import type { Metadata } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Sunny AI - Your Child\'s AI Learning Companion',
  description: 'Autonomous AI teacher that adapts to your child\'s learning style. Personalized lessons, real-time support, and fun gamification for kids aged 6-10.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}