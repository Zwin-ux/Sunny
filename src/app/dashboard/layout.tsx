import React from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Sunny AI Learning',
  description: 'Your personalized learning dashboard with progress tracking and learning apps.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}