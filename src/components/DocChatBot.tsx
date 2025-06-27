'use client'

import { useState } from 'react'
import mammoth from 'mammoth'

type Props = {
  docName: string
}

export default function DocChatBot({ docName }: Props) {
  const [docText, setDocText] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileLoad = async () => {
    const res = await fetch(`/documents/${docName}`)
    const blob = await res.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    setDocText(result.value)
  }

  const askGemini = async () => {
    setLoading(true)
    const prompt = `Beantwoord de volgende vraag op basis van dit document: "${docText}".\nVraag: ${question}`
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    setAnswer(data.response)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <button onClick={handleFileLoad} className="bg-indigo-600 text-white px-4 py-2 rounded">
        📄 Laad Leermeter.docx
      </button>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Stel je vraag over de Leermeter"
        className="w-full p-2 border rounded"
      />
      <button onClick={askGemini} className="bg-purple-600 text-white px-4 py-2 rounded">
        🤖 Vraag het aan Gemini
      </button>
      {loading && <p>Even geduld...</p>}
      {answer && <div className="p-4 bg-gray-100 rounded">{answer}</div>}
    </div>
  )
}
