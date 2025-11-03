import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import { RootProviders } from "../components/RootProviders"

const inter = Inter({ subsets: ["latin"] })

const description =
  "Sunny helps kids build confidence in math and reading with short, adaptive practice sessions designed alongside teachers."

export const metadata: Metadata = {
  title: "Sunny Learning — Adaptive practice for kids",
  description,
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
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
}: Readonly<{
  children: ReactNode
}>) {
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
