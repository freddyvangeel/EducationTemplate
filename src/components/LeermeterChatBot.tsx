'use client'

import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function LeermeterChatBot() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [leermeterContent, setLeermeterContent] = useState('')
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load Leermeter document on component mount
  useEffect(() => {
    loadLeermeterDocument()
  }, [])

  const loadLeermeterDocument = async () => {
    try {
      console.log('Loading Leermeter document...')
      
      // Try to fetch the document from the public folder
      const response = await fetch('/documents/Leermeter.docx')
      
      if (!response.ok) {
        throw new Error(`Document not found: ${response.status}`)
      }

      const blob = await response.blob()
      const formData = new FormData()
      formData.append('file', blob, 'Leermeter.docx')

      // Process the document through our API
      const uploadResponse = await fetch('/api/upload-docx', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Failed to process document')
      }

      const data = await uploadResponse.json()
      setLeermeterContent(data.content)
      setIsDocumentLoaded(true)
      
      console.log('Leermeter document loaded successfully')
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: `Hallo! 👋 

Ik ben je helper voor de Leermeter. Ik heb het document gelezen en kan al je vragen beantwoorden.

**Wat wil je weten over de Leermeter?**

Je kunt bijvoorbeeld vragen:
- Wat is de Leermeter?
- Hoe werkt het?
- Wat zijn de voordelen?
- Hoe gebruik ik het?

Stel gerust je vraag! 😊`,
        timestamp: new Date()
      }
      
      setMessages([welcomeMessage])
      
    } catch (error) {
      console.error('Error loading Leermeter document:', error)
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: `Sorry! 😔 

Ik kan het Leermeter document niet laden. 

**Mogelijke oorzaken:**
- Het bestand staat niet op de juiste plek
- Er is een probleem met het lezen van het bestand

Probeer het later nog eens of neem contact op met de beheerder.`,
        timestamp: new Date()
      }
      
      setMessages([errorMessage])
    }
  }

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const sendMessage = async () => {
    if (!message.trim() || isLoading || !isDocumentLoaded) return

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      // Create a prompt that focuses on simple Dutch and the Leermeter content
      const prompt = `Je bent een vriendelijke helper die vragen beantwoordt over de Leermeter. 

BELANGRIJKE REGELS:
1. Antwoord ALLEEN in het Nederlands
2. Gebruik eenvoudige woorden (taalniveau B1)
3. Maak korte, duidelijke zinnen
4. Gebruik geen moeilijke vakwoorden
5. Leg dingen uit alsof je praat tegen iemand die nog leert
6. Gebruik vriendelijke emoji's 😊
7. Baseer je antwoord ALLEEN op de informatie uit het Leermeter document hieronder

LEERMETER DOCUMENT:
${leermeterContent}

GEBRUIKER VRAAG: ${userMessage.content}

Geef een kort, duidelijk antwoord in eenvoudig Nederlands. Als de vraag niet over de Leermeter gaat, leg dan vriendelijk uit dat je alleen over de Leermeter kunt praten.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart' // Use Gemini 2.5 Flash for good balance
        }),
      })

      if (!response.ok) {
        throw new Error('Er ging iets mis bij het versturen van je vraag')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: `Sorry! 😔 Er ging iets mis. 

Probeer het nog een keer. Als het probleem blijft, neem dan contact op met de beheerder.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    loadLeermeterDocument() // Reload welcome message
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Chat met Leermeter</h2>
              <p className="text-blue-100 text-sm">
                {isDocumentLoaded ? '✅ Document geladen' : '⏳ Document laden...'}
              </p>
            </div>
          </div>
          
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
              title="Nieuw gesprek starten"
            >
              🔄 Nieuw gesprek
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.type === 'assistant' ? (
                <div>
                  <MarkdownRenderer content={msg.content} className="text-sm" />
                  <ResponseActions 
                    content={msg.content}
                    isMarkdown={true}
                    className="mt-2"
                  />
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              
              <p className={`text-xs mt-2 ${
                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {msg.timestamp.toLocaleTimeString('nl-NL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">Ik denk na...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isDocumentLoaded 
                  ? "Stel je vraag over de Leermeter..." 
                  : "Even geduld, document wordt geladen..."
              }
              className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading || !isDocumentLoaded}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !message.trim() || !isDocumentLoaded}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Bezig...</span>
              </>
            ) : (
              <>
                <span>Verstuur</span>
                <span>📤</span>
              </>
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Tip: Druk op Enter om je vraag te versturen
        </p>
      </div>
    </div>
  )
}