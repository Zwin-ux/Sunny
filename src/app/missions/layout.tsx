import React from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Missions - Sunny AI Learning',
  description: 'Sunny AI Learning - Making education fun and personalized for kids.',
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
