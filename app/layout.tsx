import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NS Budget Chat',
  description:
    'Free AI chatbot for exploring the Nova Scotia Budget 2026–27. Ask questions, get cited answers. No signup required.',
  openGraph: {
    title: 'NS Budget Chat',
    description: 'Understand your provincial budget in plain language. Free, open-source, no signup.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NS Budget Chat',
    description: 'Understand your provincial budget in plain language.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
