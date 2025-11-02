import React from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intelligent Dashboard - Sunny AI',
  description: 'Advanced learning analytics and AI-powered insights.',
}

export default function IntelligentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}