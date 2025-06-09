'use client'

import { useState, useEffect, useRef } from 'react'

interface ResponseActionsProps {
  content: string
  isMarkdown?: boolean
  isStreaming?: boolean
  className?: string
}

export default function ResponseActions({ 
  content, 
  isMarkdown = true, 
  isStreaming = false,
  className = ""
}: ResponseActionsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'paused' | 'error' | 'waiting' | 'blocked'>('idle')
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [speechRate, setSpeechRate] = useState(1.0) // Default speech rate
  const [showSpeedControl, setShowSpeedControl] = useState(false)
  const [ttsAttempts, setTtsAttempts] = useState(0)
  const [ttsTimeoutId, setTtsTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  // Use ref to track speech state without causing re-renders
  const speechActiveRef = useRef(false)

  // Predefined speed options
  const speedOptions = [
    { label: '🐌 Langzaam', value: 0.75 },
    { label: '📚 Normaal', value: 1.0 },
    { label: '⚡ Snel', value: 1.5 },
    { label: '🚀 Allersnelst', value: 2.0 }
  ]

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('Loading voices:', voices.length, 'found')
      setAvailableVoices(voices)
      
      // Find the best available voice
      const bestVoice = findBestVoice(voices)
      setBestVoice(bestVoice)
      console.log('Best voice selected:', bestVoice?.name || 'none')
    }

    // Check if speech synthesis is available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices immediately
      loadVoices()
      
      // Also load when voices change (some browsers load async)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      // Fallback: try loading again after a short delay
      setTimeout(loadVoices, 100)
    } else {
      console.warn('Speech synthesis not supported in this browser')
    }
  }, [])

  // Smart voice selection - prefer high quality voices
  const findBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null

    // Priority order for better voices
    const priorities = [
      // Dutch voices (preferred)
      { lang: 'nl-NL', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'nl-BE', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'nl', quality: ['neural', 'premium', 'enhanced'] },
      
      // English voices (fallback)
      { lang: 'en-US', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'en-GB', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'en', quality: ['neural', 'premium', 'enhanced'] },
    ]

    // Try to find the best voice based on priorities
    for (const priority of priorities) {
      for (const qualityKeyword of priority.quality) {
        const voice = voices.find(v => 
          v.lang.toLowerCase().startsWith(priority.lang.toLowerCase()) &&
          (v.name.toLowerCase().includes(qualityKeyword) ||
           v.name.toLowerCase().includes('natural') ||
           v.name.toLowerCase().includes('wavenet') ||
           v.name.toLowerCase().includes('studio'))
        )
        if (voice) return voice
      }
      
      // If no premium voice found, try regular voices for this language
      const regularVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith(priority.lang.toLowerCase())
      )
      if (regularVoice) return regularVoice
    }

    // Final fallback - any voice
    return voices[0]
  }

  // Convert markdown to plain text for copying/speaking
  const convertMarkdownToPlainText = (markdown: string): string => {
    return markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  const handleCopy = async () => {
    if (isStreaming || !content.trim()) return

    setCopyStatus('copying')
    
    try {
      const textToCopy = isMarkdown ? convertMarkdownToPlainText(content) : content
      await navigator.clipboard.writeText(textToCopy)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  // Simplified and robust Text-to-Speech functionality
  const handleTextToSpeech = () => {
    if (isStreaming || !content.trim()) return

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      setTtsStatus('error')
      setTimeout(() => setTtsStatus('idle'), 3000)
      return
    }

    // If currently playing, pause/resume
    if (ttsStatus === 'playing') {
      window.speechSynthesis.pause()
      setTtsStatus('paused')
      return
    }

    // If paused, resume
    if (ttsStatus === 'paused') {
      window.speechSynthesis.resume()
      setTtsStatus('playing')
      return
    }

    // Start new speech - ALWAYS stop everything first
    startNewSpeech()
  }

  const startNewSpeech = () => {
    console.log('=== STARTING NEW SPEECH ===')
    
    // NUCLEAR OPTION: Stop everything and clear queue
    window.speechSynthesis.cancel()
    speechActiveRef.current = false
    
    // Clear any existing timeout
    if (ttsTimeoutId) {
      clearTimeout(ttsTimeoutId)
      setTtsTimeoutId(null)
    }

    // Wait a moment for queue to clear, then start fresh
    setTimeout(() => {
      const textToSpeak = isMarkdown ? convertMarkdownToPlainText(content) : content
      
      if (!textToSpeak.trim()) {
        console.warn('No text to speak')
        return
      }

      console.log('Text length:', textToSpeak.length, 'characters')
      console.log('Starting fresh speech with rate:', speechRate)

      setTtsStatus('waiting')

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      
      // Apply voice
      if (bestVoice) {
        utterance.voice = bestVoice
        utterance.lang = bestVoice.lang
      } else {
        utterance.lang = 'nl-NL'
      }

      // Apply settings
      utterance.rate = speechRate
      utterance.pitch = 1.1
      utterance.volume = 0.9

      // Simple event handlers
      utterance.onstart = () => {
        console.log('✅ Speech started successfully')
        speechActiveRef.current = true
        setTtsStatus('playing')
      }

      utterance.onend = () => {
        console.log('✅ Speech ended successfully')
        speechActiveRef.current = false
        setTtsStatus('idle')
        setCurrentUtterance(null)
      }

      utterance.onerror = (event) => {
        // "interrupted" is normal when we cancel speech to start new one
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.log('🔄 Speech was interrupted (normal behavior)')
          speechActiveRef.current = false
          // Don't set error status for interruptions - just go to idle
          setTtsStatus('idle')
          setCurrentUtterance(null)
        } else {
          // Only log real errors
          console.error('❌ Speech error:', event.error)
          speechActiveRef.current = false
          setTtsStatus('error')
          setTimeout(() => setTtsStatus('idle'), 3000)
          setCurrentUtterance(null)
        }
      }

      utterance.onpause = () => {
        setTtsStatus('paused')
      }

      utterance.onresume = () => {
        setTtsStatus('playing')
      }

      // Store and start
      setCurrentUtterance(utterance)
      window.speechSynthesis.speak(utterance)
      
      console.log('Speech queued and started')
    }, 200) // Wait 200ms for clean slate
  }

  const stopTextToSpeech = () => {
    console.log('🛑 Manually stopping all speech')
    
    // NUCLEAR STOP - clear everything
    window.speechSynthesis.cancel()
    speechActiveRef.current = false
    
    if (ttsTimeoutId) {
      clearTimeout(ttsTimeoutId)
      setTtsTimeoutId(null)
    }
    
    setTtsStatus('idle')
    setCurrentUtterance(null)
  }

  const changeSpeed = (newRate: number) => {
    setSpeechRate(newRate)
    
    // If currently playing, restart with new speed
    if (ttsStatus === 'playing') {
      console.log('🔄 Changing speed to', newRate, '- restarting speech')
      startNewSpeech()
    }
  }

  const toggleSpeedControl = () => {
    setShowSpeedControl(!showSpeedControl)
  }

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying': return '⏳ Kopiëren...'
      case 'success': return '✅ Gekopieerd!'
      case 'error': return '❌ Fout'
      default: return '📋 Kopiëren'
    }
  }

  const getCopyButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (copyStatus) {
      case 'success':
        return `${baseClass} bg-green-100 text-green-700 border border-green-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      case 'copying':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-200`
    }
  }

  const getTtsButtonText = () => {
    if (bestVoice) {
      switch (ttsStatus) {
        case 'playing': return '⏸️ Pauzeren'
        case 'paused': return '▶️ Hervatten'
        case 'waiting': return '⏳ Starten...'
        case 'error': return '❌ Fout'
        default: return `🔊 Uitspreken (${bestVoice.name.split(' ')[0]})`
      }
    } else {
      switch (ttsStatus) {
        case 'playing': return '⏸️ Pauzeren'
        case 'paused': return '▶️ Hervatten'
        case 'waiting': return '⏳ Starten...'
        case 'error': return '❌ Fout'
        default: return '🔊 Uitspreken'
      }
    }
  }

  const getTtsButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (ttsStatus) {
      case 'playing':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200 animate-pulse`
      case 'paused':
        return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200`
      case 'waiting':
        return `${baseClass} bg-orange-100 text-orange-700 border border-orange-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200`
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (ttsTimeoutId) {
        clearTimeout(ttsTimeoutId)
      }
      // Only cancel speech if component is unmounting, not on re-renders
    }
  }, [ttsTimeoutId])

  if (!content.trim()) return null

  return (
    <div className={`space-y-2 mt-3 ${className}`}>
      {/* Main Action Buttons */}
      <div className="flex items-center justify-end space-x-2">
        {/* Text-to-Speech Button */}
        <button
          onClick={handleTextToSpeech}
          onDoubleClick={toggleSpeedControl}
          disabled={isStreaming}
          className={getTtsButtonClass()}
          title={
            isStreaming ? "Wacht tot response compleet is" :
            ttsStatus === 'playing' ? "Pauzeer voorlezen (dubbelklik voor snelheid)" :
            ttsStatus === 'paused' ? "Hervat voorlezen (dubbelklik voor snelheid)" :
            ttsStatus === 'waiting' ? "Speech wordt gestart..." :
            ttsStatus === 'error' ? "Er is een fout opgetreden" :
            bestVoice ? `Lees response voor met ${bestVoice.name} (dubbelklik voor snelheid)` :
            "Lees response voor (dubbelklik voor snelheid)"
          }
        >
          <span>{getTtsButtonText()}</span>
        </button>

        {/* Speed Control Toggle - only show when TTS is available */}
        {!isStreaming && (
          <button
            onClick={toggleSpeedControl}
            className={`p-2 rounded-lg text-sm transition-all duration-200 ${
              showSpeedControl 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 border border-gray-200'
            }`}
            title="Spraaksnelheid aanpassen"
          >
            ⚙️
          </button>
        )}

        {/* Stop TTS Button - only show when playing or paused */}
        {(ttsStatus === 'playing' || ttsStatus === 'paused') && (
          <button
            onClick={stopTextToSpeech}
            className="flex items-center space-x-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
            title="Stop voorlezen"
          >
            <span>⏹️</span>
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={isStreaming || copyStatus === 'copying'}
          className={getCopyButtonClass()}
          title={isStreaming ? "Wacht tot response compleet is" : "Kopieer response naar klembord"}
        >
          <span>{getCopyButtonText()}</span>
        </button>
      </div>

      {/* Speed Control Panel */}
      {showSpeedControl && (
        <div className="flex items-center justify-end space-x-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-700 text-sm font-medium mr-2">Snelheid:</span>
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => changeSpeed(option.value)}
              className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                speechRate === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
              title={`Snelheid: ${option.value}x`}
            >
              {option.label}
            </button>
          ))}
          <div className="ml-3 text-blue-600 text-xs">
            Huidig: {speechRate}x
          </div>
        </div>
      )}
    </div>
  )
} 