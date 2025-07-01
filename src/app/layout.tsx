import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chat met Leermeter - Eenvoudige Nederlandse Chatbot',
  description: 'Stel vragen over de Leermeter in eenvoudig Nederlands. Krijg duidelijke antwoorden op B1 taalniveau.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-100 min-h-screen" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}