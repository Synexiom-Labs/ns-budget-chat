import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-sora' })

export const metadata: Metadata = {
  title: 'NS Budget Chat — Nova Scotia Budget 2026–27',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${sora.variable} font-sans h-full bg-white text-gray-900 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
