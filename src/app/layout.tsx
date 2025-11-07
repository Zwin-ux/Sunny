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
