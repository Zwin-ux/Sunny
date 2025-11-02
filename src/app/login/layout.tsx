import React from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Sunny AI Learning',
  description: 'Sign in to your Sunny AI learning account.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}