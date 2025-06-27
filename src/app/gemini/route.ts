import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  const result = await model.generateContent(prompt)
  const response = result.response.text()
  return NextResponse.json({ response })
}
