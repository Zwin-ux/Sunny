import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ReactNode } from "react"
import { RootProviders } from "../components/RootProviders"

const inter = Inter({ subsets: ["latin"] })

const description =
  "Autonomous AI teacher that adapts to your child's learning style. Personalized lessons, real-time support, and fun gamification for kids aged 6-10."

export const metadata: Metadata = {
  title: "Sunny AI - Your Child's AI Learning Companion",
  description,
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}