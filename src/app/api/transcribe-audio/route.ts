import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { 
          error: 'Gemini API key niet geconfigureerd. Voeg GEMINI_API_KEY toe aan je environment variables.',
          hint: 'Voor audio transcriptie is een Gemini API key vereist',
          debug: 'Environment variable GEMINI_API_KEY is not set'
        }, 
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Geen audio bestand ontvangen' },
        { status: 400 }
      )
    }

    // Validate file type (Gemini supported formats)
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aiff', 'audio/aac', 
      'audio/ogg', 'audio/flac'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|aiff|aac|ogg|flac|mpeg|mpga)$/i)) {
      return NextResponse.json(
        { error: 'Niet ondersteund audio formaat. Ondersteunde formaten: MP3, WAV, AIFF, AAC, OGG, FLAC' },
        { status: 400 }
      )
    }

    // Check file size (Gemini limit is 20MB)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio bestand te groot. Maximum grootte is 20MB.' },
        { status: 400 }
      )
    }

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')

      console.log('🎵 Starting Gemini audio transcription...', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      })

      // Initialize Gemini model (2.5 Flash supports audio)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      // Create audio part for Gemini
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: file.type || 'audio/mpeg'
        }
      }

      // Create transcription request with Dutch language prompt
      const prompt = "Transcribeer deze audio naar Nederlandse tekst. Geef alleen de getranscribeerde tekst terug, zonder extra commentaar."
      
      const result = await model.generateContent([prompt, audioPart])
      const response = await result.response
      const transcription = response.text()

      console.log('✅ Gemini audio transcription successful', {
        transcriptionLength: transcription.length,
        fileName: file.name
      })

      return NextResponse.json({
        success: true,
        transcription: transcription,
        fileName: file.name,
        fileSize: file.size,
        engine: 'Gemini 2.5 Flash',
        message: 'Audio succesvol getranscribeerd met Gemini AI'
      })

    } catch (transcriptionError: any) {
      console.error('Gemini audio transcription error:', transcriptionError)
      
      // Handle specific Gemini errors
      if (transcriptionError?.message?.includes('quota')) {
        return NextResponse.json(
          { error: 'Gemini API quota overschreden. Probeer later opnieuw.' },
          { status: 429 }
        )
      }
      
      if (transcriptionError?.message?.includes('unsupported')) {
        return NextResponse.json(
          { error: 'Audio formaat niet ondersteund door Gemini. Probeer MP3, WAV of AAC.' },
          { status: 400 }
        )
      }

      if (transcriptionError?.message?.includes('size')) {
        return NextResponse.json(
          { error: 'Audio bestand te groot voor Gemini transcriptie (max 20MB).' },
          { status: 413 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Fout bij audio transcriptie',
          details: transcriptionError?.message || 'Onbekende fout bij Gemini audio transcriptie',
          hint: 'Controleer of het audio bestand geldig is en probeer een kleiner bestand'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Audio transcription API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verwerken van het audio bestand',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        engine: 'Gemini AI'
      },
      { status: 500 }
    )
  }
} 