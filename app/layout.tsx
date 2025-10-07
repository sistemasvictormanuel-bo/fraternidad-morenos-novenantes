import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Script from 'next/script'

import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "Fraternidad Morenada Novenantes - Sistema de Gestión",
  description: "Sistema de gestión para la Fraternidad Morenada Novenantes",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <SidebarProvider>{children}</SidebarProvider>

      </body>
    
    </html>
  )
}
