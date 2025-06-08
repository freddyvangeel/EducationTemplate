import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialiseer de Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Helper functie om base64 naar buffer te converteren
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

export async function POST(request: NextRequest) {
  try {
    // Betere error handling voor Netlify
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { 
          error: 'API configuratie ontbreekt. Check Netlify Environment Variables.',
          hint: 'Voeg GEMINI_API_KEY toe in Netlify Site Settings → Environment Variables',
          debug: 'Environment variable GEMINI_API_KEY is not set'
        }, 
        { status: 500 }
      )
    }

    // Haal de bericht data op uit de request
    const { message, image } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Bericht is vereist' },
        { status: 400 }
      )
    }

    // Input validatie en sanitization
    if (typeof message !== 'string' || message.length > 4000) {
      return NextResponse.json(
        { error: 'Bericht moet een string zijn van maximaal 4000 karakters' },
        { status: 400 }
      )
    }

    // Haal het Gemini model op - gebruik het nieuwste model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })

    let result;
    
    if (image) {
      // Als er een afbeelding is, stuur zowel tekst als afbeelding
      const imageBuffer = base64ToBuffer(image)
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      }
      
      result = await model.generateContent([message, imagePart])
    } else {
      // Alleen tekst
      result = await model.generateContent(message)
    }

    const response = await result.response
    const text = response.text()

    return NextResponse.json({ 
      response: text,
      success: true 
    })

  } catch (error) {
    console.error('Fout bij het aanroepen van Gemini API:', error)
    
    // Betere error information voor debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verwerken van je bericht',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        hint: 'Check Netlify Function logs voor meer details'
      },
      { status: 500 }
    )
  }
} 