'use client'

import DocChatBot from '@/components/DocChatBot'

export default function ChatLeermeter() {
  return (
    <main className="min-h-screen bg-white text-gray-800 p-10">
      <h1 className="text-3xl font-bold mb-4">Stel hier je vragen over de Leermeter</h1>
      <DocChatBot docName="Leermeter.docx" />
    </main>
  )
}