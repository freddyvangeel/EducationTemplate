import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json(
        { 
          error: 'OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe aan je environment variables.',
          hint: 'Voor audio transcriptie is een OpenAI API key vereist',
          debug: 'Environment variable OPENAI_API_KEY is not set'
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

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 
      'audio/aac', 'audio/flac', 'audio/mp4', 'audio/webm'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|mp4|mpeg|mpga|webm)$/i)) {
      return NextResponse.json(
        { error: 'Niet ondersteund audio formaat. Ondersteunde formaten: MP3, WAV, OGG, M4A, AAC, FLAC, MP4, WEBM' },
        { status: 400 }
      )
    }

    // Check file size (OpenAI limit is 25MB)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio bestand te groot. Maximum grootte is 25MB.' },
        { status: 400 }
      )
    }

    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Create transcription using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'nl', // Dutch language hint, but Whisper auto-detects
        response_format: 'text',
      })

      return NextResponse.json({
        success: true,
        transcription: transcription,
        fileName: file.name,
        fileSize: file.size,
        message: 'Audio succesvol getranscribeerd'
      })

    } catch (transcriptionError: any) {
      console.error('OpenAI Whisper transcription error:', transcriptionError)
      
      // Handle specific OpenAI errors
      if (transcriptionError?.status === 400) {
        return NextResponse.json(
          { error: 'Audio bestand kan niet verwerkt worden. Controleer het formaat en probeer opnieuw.' },
          { status: 400 }
        )
      }
      
      if (transcriptionError?.status === 413) {
        return NextResponse.json(
          { error: 'Audio bestand te groot voor transcriptie.' },
          { status: 413 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Fout bij audio transcriptie',
          details: transcriptionError?.message || 'Onbekende fout bij OpenAI Whisper',
          hint: 'Controleer of het audio bestand geldig is'
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
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 