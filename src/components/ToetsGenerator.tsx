'use client'

import { useState, useRef } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'
import CameraCapture from './CameraCapture'

interface ToetsConfig {
  vraagType: string
  aantalVragen: number
  onderwijsNiveau: string
  bloomNiveaus: string[]
  metCasus: boolean
  onderwerp: string
  contextTekst: string
}

interface UploadedFile {
  id: string
  name: string
  type: 'image' | 'document' | 'data' | 'audio'
  preview: string | null
  content: string
  size: number
  uploadedAt: Date
  selected: boolean
}

export default function ToetsGenerator() {
  const [config, setConfig] = useState<ToetsConfig>({
    vraagType: 'meerkeuze',
    aantalVragen: 10,
    onderwijsNiveau: 'havo',
    bloomNiveaus: ['kennis', 'begrip'],
    metCasus: false,
    onderwerp: '',
    contextTekst: ''
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedToets, setGeneratedToets] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  
  // Verbeterfunctie states
  const [verbeterTekst, setVerbeterTekst] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isVerbeteringGenerating, setIsVerbeteringGenerating] = useState(false)
  const [verbeterdeToets, setVerbeterdeToets] = useState('')
  const [verbeterStreamingResponse, setVerbeterStreamingResponse] = useState('')
  const [isVerbeteringStreaming, setIsVerbeteringStreaming] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const verbeterAbortControllerRef = useRef<AbortController | null>(null)
  const currentStreamingResponseRef = useRef<string>('')
  const currentVerbeterStreamingResponseRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const vraagTypes = [
    { id: 'meerkeuze', label: 'Meerkeuzevragen (A, B, C, D)', icon: '📝' },
    { id: 'juist-onjuist', label: 'Juist/Onjuist vragen', icon: '✅' },
    { id: 'open', label: 'Open vragen', icon: '💭' },
    { id: 'invulvragen', label: 'Invulvragen (fill-in-the-blank)', icon: '📋' },
    { id: 'matching', label: 'Koppelvragen (matching)', icon: '🔗' },
    { id: 'gemengd', label: 'Gemengde vraagtypen', icon: '🎯' }
  ]

  const onderwijsNiveaus = [
    { id: 'vmbo', label: 'VMBO', icon: '🎓' },
    { id: 'havo', label: 'HAVO', icon: '📚' },
    { id: 'vwo', label: 'VWO', icon: '🎯' },
    { id: 'mbo', label: 'MBO', icon: '🔧' },
    { id: 'hbo', label: 'HBO', icon: '🏛️' },
    { id: 'wo', label: 'Universiteit (WO)', icon: '🎓' }
  ]

  const bloomNiveaus = [
    { id: 'kennis', label: 'Kennis', beschrijving: 'Feiten onthouden', icon: '🧠' },
    { id: 'begrip', label: 'Begrip', beschrijving: 'Betekenis begrijpen', icon: '💡' },
    { id: 'toepassing', label: 'Toepassing', beschrijving: 'Kennis toepassen', icon: '🔧' },
    { id: 'analyse', label: 'Analyse', beschrijving: 'Informatie analyseren', icon: '🔍' },
    { id: 'synthese', label: 'Evaluatie', beschrijving: 'Oordelen vellen', icon: '⚖️' },
    { id: 'evaluatie', label: 'Creatie', beschrijving: 'Nieuwe ideeën creëren', icon: '✨' }
  ]

  const handleBloomNiveauToggle = (niveauId: string) => {
    setConfig(prev => ({
      ...prev,
      bloomNiveaus: prev.bloomNiveaus.includes(niveauId)
        ? prev.bloomNiveaus.filter(id => id !== niveauId)
        : [...prev.bloomNiveaus, niveauId]
    }))
  }

  // File management functions
  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file])
  }

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const toggleFileSelection = (id: string) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, selected: !file.selected } : file
      )
    )
  }

  const getSelectedFiles = () => uploadedFiles.filter(file => file.selected)

  const handleCameraCapture = (imageData: string, blob: Blob) => {
    const uploadedFile: UploadedFile = {
      id: generateFileId(),
      name: `Camera_${new Date().toLocaleTimeString()}.jpg`,
      type: 'image',
      preview: imageData,
      content: imageData,
      size: blob.size,
      uploadedAt: new Date(),
      selected: true
    }
    
    addUploadedFile(uploadedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      for (const file of files) {
        await handleSingleFileUpload(file)
      }
    }
  }

  const handleSingleFileUpload = async (file: File) => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()
    
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    const documentFormats = ['docx', 'pdf', 'txt', 'md']
    const dataFormats = ['csv', 'json']
    const audioFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mp4', 'mpeg', 'mpga', 'webm']
    
    const extension = fileName.split('.').pop() || ''
    const isImage = imageFormats.some(format => fileName.endsWith(`.${format}`)) || fileType.startsWith('image/')
    const isDocument = documentFormats.some(format => fileName.endsWith(`.${format}`))
    const isData = dataFormats.some(format => fileName.endsWith(`.${format}`))
    const isAudio = audioFormats.some(format => fileName.endsWith(`.${format}`)) || fileType.startsWith('audio/')
    
    if (!isImage && !isDocument && !isData && !isAudio) {
      alert(`Bestandstype niet ondersteund!\n\nOndersteunde formaten:\n📸 Afbeeldingen: ${imageFormats.join(', ')}\n📄 Documenten: ${documentFormats.join(', ')}\n📊 Data: ${dataFormats.join(', ')}\n🎵 Audio: ${audioFormats.join(', ')}`)
      return
    }

    try {
      if (isImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          
          const uploadedFile: UploadedFile = {
            id: generateFileId(),
            name: file.name,
            type: 'image',
            preview: result,
            content: result,
            size: file.size,
            uploadedAt: new Date(),
            selected: true
          }
          
          addUploadedFile(uploadedFile)
        }
        reader.readAsDataURL(file)
        return
      }
      
      if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          
          const uploadedFile: UploadedFile = {
            id: generateFileId(),
            name: file.name,
            type: 'document',
            preview: content.length > 100 ? content.substring(0, 100) + '...' : content,
            content: content,
            size: file.size,
            uploadedAt: new Date(),
            selected: true
          }
          
          addUploadedFile(uploadedFile)
        }
        reader.readAsText(file, 'UTF-8')
        return
      }
      
      if (fileName.endsWith('.json')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const jsonData = JSON.parse(content)
            const formattedContent = JSON.stringify(jsonData, null, 2)
            
            const uploadedFile: UploadedFile = {
              id: generateFileId(),
              name: file.name,
              type: 'data',
              preview: formattedContent.length > 100 ? formattedContent.substring(0, 100) + '...' : formattedContent,
              content: formattedContent,
              size: file.size,
              uploadedAt: new Date(),
              selected: true
            }
            
            addUploadedFile(uploadedFile)
          } catch (error) {
            alert('Ongeldig JSON bestand')
          }
        }
        reader.readAsText(file, 'UTF-8')
        return
      }
      
      if (isAudio) {
        const formData = new FormData()
        formData.append('file', file)

        try {
          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Transcriptie mislukt')
          }

          const data = await response.json()
          
          const uploadedFile: UploadedFile = {
            id: generateFileId(),
            name: file.name,
            type: 'audio',
            preview: data.transcription.length > 100 ? data.transcription.substring(0, 100) + '...' : data.transcription,
            content: data.transcription,
            size: file.size,
            uploadedAt: new Date(),
            selected: true
          }
          
          addUploadedFile(uploadedFile)
        } catch (error) {
          console.error('Audio transcription error:', error)
          alert('Fout bij audio transcriptie: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
        }
        return
      }
      
      // Handle other documents (PDF, DOCX, CSV) via server upload
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-docx', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      const uploadedFile: UploadedFile = {
        id: generateFileId(),
        name: file.name,
        type: fileName.endsWith('.csv') ? 'data' : 'document',
        preview: data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content,
        content: data.content,
        size: file.size,
        uploadedAt: new Date(),
        selected: true
      }
      
      addUploadedFile(uploadedFile)
    } catch (error) {
      console.error('File upload error:', error)
      alert('Fout bij uploaden: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
    }
  }

  const generatePrompt = (): string => {
    const selectedBloomNiveaus = bloomNiveaus
      .filter(niveau => config.bloomNiveaus.includes(niveau.id))
      .map(niveau => `${niveau.label} (${niveau.beschrijving})`)
      .join(', ')

    const vraagTypeLabel = vraagTypes.find(type => type.id === config.vraagType)?.label || config.vraagType

    return `Je bent een expert toetsmaker met specialisatie in kwalitatieve kennistoetsen. Maak een professionele toets volgens de volgende specificaties:

**TOETS SPECIFICATIES:**
- Type vragen: ${vraagTypeLabel}
- Aantal vragen: ${config.aantalVragen}
- Onderwijsniveau: ${config.onderwijsNiveau.toUpperCase()}
- Bloom taxonomie niveaus: ${selectedBloomNiveaus}
- Met casus: ${config.metCasus ? 'Ja, voeg relevante casussen toe' : 'Nee, directe vragen'}
- Onderwerp: ${config.onderwerp}

**CONTEXT INFORMATIE:**
${config.contextTekst}

**KWALITEITSEISEN:**
1. Formuleer vragen eenduidig en zakelijk
2. Elke vraag bevat één duidelijk probleem
3. Bij meerkeuzevragen: exact één juist antwoord
4. Vermijd "alle/geen van bovenstaande" opties
5. Alle antwoordopties ongeveer even lang
6. Geen ontkennende vraagstellingen
7. Passend bij het opgegeven onderwijsniveau
8. Duidelijke verdeling over de gekozen Bloom-niveaus

**GEWENSTE OUTPUT STRUCTUUR:**
Voor elke vraag:
- Vraagnummer
- Bloom-niveau tussen haakjes
- De vraag zelf
- Antwoordopties (indien van toepassing)
- Juiste antwoord
- Korte uitleg van het juiste antwoord

${config.metCasus ? '**CASUS INSTRUCTIE:** Begin relevante vragen met een korte, realistische casus die aansluit bij het onderwijsniveau.' : ''}

Maak nu de toets volgens deze specificaties. Zorg voor een goede mix van moeilijkheidsgraden binnen het gekozen niveau.`
  }

  const generateToets = async () => {
    if (!config.onderwerp.trim()) {
      alert('Vul eerst een onderwerp in!')
      return
    }

    if (config.bloomNiveaus.length === 0) {
      alert('Selecteer minimaal één Bloom taxonomie niveau!')
      return
    }

    setIsGenerating(true)
    setIsStreaming(true)
    setStreamingResponse('')
    setGeneratedToets('')
    setVerbeterdeToets('') // Reset verbeterde versie
    currentStreamingResponseRef.current = ''

    abortControllerRef.current = new AbortController()

    try {
      const prompt = generatePrompt()

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart',
          useGrounding: false
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No readable stream available')
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.message || 'Streaming error')
              }
              
              if (data.done) {
                setIsStreaming(false)
                setGeneratedToets(currentStreamingResponseRef.current)
                return
              }
              
              if (data.token) {
                const newResponse = currentStreamingResponseRef.current + data.token
                currentStreamingResponseRef.current = newResponse
                setStreamingResponse(newResponse)
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Toets generatie error:', error)
      
      if (error.name === 'AbortError') {
        if (!currentStreamingResponseRef.current) {
          setGeneratedToets('Toets generatie gestopt door gebruiker.')
        } else {
          setGeneratedToets(currentStreamingResponseRef.current)
        }
      } else {
        setGeneratedToets('Error: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
      }
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const generateVerbeterdeToets = async () => {
    if (!verbeterTekst.trim() && getSelectedFiles().length === 0) {
      alert('Vul eerst in wat je wilt verbeteren of voeg bestanden toe!')
      return
    }

    setIsVerbeteringGenerating(true)
    setIsVerbeteringStreaming(true)
    setVerbeterStreamingResponse('')
    setVerbeterdeToets('')
    currentVerbeterStreamingResponseRef.current = ''

    verbeterAbortControllerRef.current = new AbortController()

    try {
      const selectedFiles = getSelectedFiles()
      let verbeterPrompt = `Je bent een expert toetsmaker. Hieronder staat de originele toets die je hebt gemaakt. De gebruiker wil verbeteringen. Maak een VERBETERDE VERSIE 2.0 van de toets op basis van de feedback.

**ORIGINELE TOETS:**
${generatedToets}

**VERBETERVERZOEK VAN GEBRUIKER:**
${verbeterTekst}

**INSTRUCTIES:**
1. Analyseer de feedback zorgvuldig
2. Behoud de goede aspecten van de originele toets
3. Implementeer de gevraagde verbeteringen
4. Zorg dat de toets nog steeds voldoet aan de oorspronkelijke specificaties
5. Geef duidelijk aan wat je hebt verbeterd

Maak nu de verbeterde versie 2.0 van de toets:`

      // Add file context if files are selected
      if (selectedFiles.length > 0) {
        const fileContexts = selectedFiles.map((file, index) => {
          const fileType = file.type === 'image' ? 'Afbeelding' : 
                          file.type === 'document' ? 'Document' : 
                          file.type === 'audio' ? 'Audio Transcriptie' : 'Data'
          if (file.type === 'image') {
            return `[${fileType} ${index + 1}: ${file.name}]\n[Afbeelding bijgevoegd voor analyse]`
          } else {
            return `[${fileType}: ${file.name}]\n${file.content}`
          }
        }).join('\n\n---\n\n')
        
        verbeterPrompt += `\n\n**BIJGEVOEGDE BESTANDEN VOOR CONTEXT:**\n${fileContexts}`
      }

      const payload: any = { 
        message: verbeterPrompt,
        aiModel: 'smart',
        useGrounding: false
      }

      // Add selected images for Gemini Vision
      const selectedImages = selectedFiles.filter(file => file.type === 'image')
      if (selectedImages.length > 0) {
        payload.images = selectedImages.map(img => img.content)
      }

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: verbeterAbortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No readable stream available')
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.message || 'Streaming error')
              }
              
              if (data.done) {
                setIsVerbeteringStreaming(false)
                setVerbeterdeToets(currentVerbeterStreamingResponseRef.current)
                return
              }
              
              if (data.token) {
                const newResponse = currentVerbeterStreamingResponseRef.current + data.token
                currentVerbeterStreamingResponseRef.current = newResponse
                setVerbeterStreamingResponse(newResponse)
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Verbetering generatie error:', error)
      
      if (error.name === 'AbortError') {
        if (!currentVerbeterStreamingResponseRef.current) {
          setVerbeterdeToets('Verbetering gestopt door gebruiker.')
        } else {
          setVerbeterdeToets(currentVerbeterStreamingResponseRef.current)
        }
      } else {
        setVerbeterdeToets('Error: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
      }
    } finally {
      setIsVerbeteringGenerating(false)
      setIsVerbeteringStreaming(false)
      verbeterAbortControllerRef.current = null
    }
  }

  const resetGenerator = () => {
    setConfig({
      vraagType: 'meerkeuze',
      aantalVragen: 10,
      onderwijsNiveau: 'havo',
      bloomNiveaus: ['kennis', 'begrip'],
      metCasus: false,
      onderwerp: '',
      contextTekst: ''
    })
    setGeneratedToets('')
    setStreamingResponse('')
    setVerbeterdeToets('')
    setVerbeterStreamingResponse('')
    setVerbeterTekst('')
    setUploadedFiles([])
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const stopVerbeteringGeneration = () => {
    if (verbeterAbortControllerRef.current) {
      verbeterAbortControllerRef.current.abort()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
          <span className="text-white text-3xl">📝</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Professionele Toetsgenerator
        </h1>
        <p className="text-xl text-purple-700 font-medium">
          Genereer kwalitatieve toetsen met AI - Powered by Gemini 2.5 Flash
        </p>
      </div>

      {!generatedToets && !isStreaming ? (
        /* Configuration Form */
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          
          {/* Vraagtype Selectie */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">1️⃣</span>
              Type Toetsvragen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vraagTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConfig(prev => ({ ...prev, vraagType: type.id }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:scale-105 ${
                    config.vraagType === type.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium text-gray-800 text-sm">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aantal Vragen */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">2️⃣</span>
              Aantal Vragen
            </h3>
            <div className="flex items-center space-x-6">
              <input
                type="range"
                min="1"
                max="50"
                value={config.aantalVragen}
                onChange={(e) => setConfig(prev => ({ ...prev, aantalVragen: parseInt(e.target.value) }))}
                className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="bg-purple-100 px-6 py-3 rounded-xl border-2 border-purple-200">
                <span className="text-purple-800 font-bold text-2xl">{config.aantalVragen}</span>
                <span className="text-purple-600 text-sm ml-2">vragen</span>
              </div>
            </div>
          </div>

          {/* Onderwijsniveau */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">3️⃣</span>
              Onderwijsniveau
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {onderwijsNiveaus.map((niveau) => (
                <button
                  key={niveau.id}
                  onClick={() => setConfig(prev => ({ ...prev, onderwijsNiveau: niveau.id }))}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-lg hover:scale-105 ${
                    config.onderwijsNiveau === niveau.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{niveau.icon}</div>
                  <div className="font-medium text-gray-800 text-sm">{niveau.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bloom Taxonomie */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">4️⃣</span>
              Bloom Taxonomie Niveaus
              <span className="ml-3 text-sm font-normal text-purple-600">(meerdere selecteren mogelijk)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloomNiveaus.map((niveau) => (
                <button
                  key={niveau.id}
                  onClick={() => handleBloomNiveauToggle(niveau.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:scale-105 ${
                    config.bloomNiveaus.includes(niveau.id)
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{niveau.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">{niveau.label}</div>
                      <div className="text-sm text-gray-600">{niveau.beschrijving}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {config.bloomNiveaus.length === 0 && (
              <p className="text-orange-600 text-sm mt-3 flex items-center">
                <span className="mr-2">⚠️</span>
                Selecteer minimaal één Bloom niveau
              </p>
            )}
          </div>

          {/* Casussen */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">5️⃣</span>
              Casussen Toevoegen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setConfig(prev => ({ ...prev, metCasus: true }))}
                className={`p-6 rounded-xl border-2 text-center transition-all hover:shadow-lg hover:scale-105 ${
                  config.metCasus
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-4xl mb-3">📖</div>
                <div className="font-bold text-gray-800 text-lg mb-2">Ja, met casussen</div>
                <div className="text-sm text-gray-600">
                  Realistische scenario's voor contextrijke vragen
                </div>
              </button>
              
              <button
                onClick={() => setConfig(prev => ({ ...prev, metCasus: false }))}
                className={`p-6 rounded-xl border-2 text-center transition-all hover:shadow-lg hover:scale-105 ${
                  !config.metCasus
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-4xl mb-3">📝</div>
                <div className="font-bold text-gray-800 text-lg mb-2">Nee, directe vragen</div>
                <div className="text-sm text-gray-600">
                  Korte, directe kennisvragen zonder context
                </div>
              </button>
            </div>
          </div>

          {/* Onderwerp */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">6️⃣</span>
              Onderwerp van de Toets
            </h3>
            <input
              type="text"
              value={config.onderwerp}
              onChange={(e) => setConfig(prev => ({ ...prev, onderwerp: e.target.value }))}
              placeholder="Bijvoorbeeld: Nederlandse Geschiedenis, Wiskunde Algebra, Biologie Cellen, Marketing Strategieën..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
            />
          </div>

          {/* Context Tekst */}
          <div>
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-lg">7️⃣</span>
              Context Informatie
              <span className="ml-3 text-sm font-normal text-purple-600">(optioneel)</span>
            </h3>
            <textarea
              value={config.contextTekst}
              onChange={(e) => setConfig(prev => ({ ...prev, contextTekst: e.target.value }))}
              placeholder="Plak hier relevante teksten, hoofdstukken, leerdoelen of specifieke inhoud waar de toets op gebaseerd moet worden. Hoe meer context, hoe gerichter de vragen!"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none h-32 resize-none"
            />
            <p className="text-gray-600 text-sm mt-2 flex items-center">
              <span className="mr-2">💡</span>
              Tip: Voeg specifieke leerstof toe voor meer gerichte en relevante vragen
            </p>
          </div>

          {/* Generate Button */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={generateToets}
                disabled={!config.onderwerp.trim() || config.bloomNiveaus.length === 0 || isGenerating}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isGenerating ? '🔄 Genereren...' : '🚀 Genereer Professionele Toets'}
              </button>
              
              {(!config.onderwerp.trim() || config.bloomNiveaus.length === 0) && (
                <p className="text-orange-600 text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  {!config.onderwerp.trim() ? 'Vul eerst een onderwerp in' : 'Selecteer minimaal één Bloom niveau'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Generated Content */
        <div className="space-y-8">
          {/* Original Generated Toets */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">
                {isStreaming ? '🔄 Toets wordt gegenereerd...' : '✅ Jouw Professionele Toets is Klaar!'}
              </h2>
              <div className="flex items-center space-x-3">
                {isStreaming && (
                  <button
                    onClick={stopGeneration}
                    className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    ⏹️ Stop
                  </button>
                )}
                <button
                  onClick={resetGenerator}
                  className="px-6 py-2 text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  🔄 Nieuwe Toets
                </button>
              </div>
            </div>

            {/* Streaming Status */}
            {isStreaming && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-blue-700 font-bold text-lg">Gemini 2.5 Flash genereert je toets...</span>
                </div>
                <p className="text-blue-600 mt-3">
                  De AI analyseert je specificaties en creëert kwalitatieve toetsvragen volgens de hoogste onderwijsstandaarden ✨
                </p>
              </div>
            )}

            {/* Generated Content Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <MarkdownRenderer 
                content={isStreaming ? streamingResponse : generatedToets}
                className="text-gray-700"
              />
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-purple-600 animate-pulse ml-1 align-text-bottom"></span>
              )}
            </div>

            {/* Response Actions */}
            {!isStreaming && generatedToets && (
              <ResponseActions 
                content={generatedToets}
                isMarkdown={true}
                isStreaming={false}
              />
            )}
          </div>

          {/* Verbeterfunctie */}
          {!isStreaming && generatedToets && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-orange-600 mb-4 flex items-center">
                <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 text-lg">🔧</span>
                Wil je nog wat dingen verbeterd zien?
              </h3>

              {/* File Manager voor verbeteringen */}
              {uploadedFiles.length > 0 && (
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-orange-800 flex items-center">
                      <span className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs">📁</span>
                      </span>
                      Bijgevoegde Bestanden ({uploadedFiles.length})
                    </h4>
                    <span className="text-xs text-gray-500">
                      {getSelectedFiles().length} geselecteerd
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`border rounded-lg p-3 transition-all cursor-pointer ${
                          file.selected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={file.selected}
                              onChange={() => toggleFileSelection(file.id)}
                              className="rounded text-orange-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-lg">
                              {file.type === 'image' ? '📸' : file.type === 'document' ? '📄' : file.type === 'audio' ? '🎵' : '📊'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeUploadedFile(file.id)
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Verwijder bestand"
                          >
                            ×
                          </button>
                        </div>
                        
                        {file.type === 'image' && file.preview && (
                          <div className="mb-2">
                            <img 
                              src={file.preview} 
                              alt={file.name}
                              className="w-full h-20 object-cover rounded"
                            />
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-700">
                          <p className="font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          {file.type !== 'image' && (
                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {file.preview}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area voor verbeteringen */}
              <div className={`bg-orange-50 rounded-lg border transition-all duration-200 p-4 ${
                isDragOver 
                  ? 'border-orange-500 border-2 bg-orange-100' 
                  : 'border-orange-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}>

                {/* Drag & Drop Overlay */}
                {isDragOver && (
                  <div className="absolute inset-2 border-2 border-dashed border-orange-400 rounded-lg bg-orange-50 bg-opacity-90 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-orange-700 font-semibold">Drop bestanden hier</p>
                      <p className="text-orange-600 text-sm">Voor extra context bij verbeteringen</p>
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={verbeterTekst}
                      onChange={(e) => setVerbeterTekst(e.target.value)}
                      placeholder="Beschrijf wat je wilt verbeteren aan de toets. Bijvoorbeeld: 'Maak de vragen moeilijker', 'Voeg meer praktijkvoorbeelden toe', 'Verander vraag 3 naar een open vraag', etc."
                      className="w-full p-3 border-0 resize-none focus:outline-none bg-transparent"
                      rows={3}
                      disabled={isVerbeteringGenerating}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* File Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isVerbeteringGenerating}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                      title="Bestand uploaden voor extra context"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    
                    {/* Camera Button */}
                    <CameraCapture 
                      onCapture={handleCameraCapture}
                      disabled={isVerbeteringGenerating}
                    />
                    
                    {/* Generate Button */}
                    <button
                      onClick={generateVerbeterdeToets}
                      disabled={isVerbeteringGenerating || (!verbeterTekst.trim() && getSelectedFiles().length === 0)}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isVerbeteringGenerating ? '🔄' : '🚀 Verbeter Toets'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verbeterde Toets Display */}
              {(isVerbeteringStreaming || verbeterdeToets) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-green-600 flex items-center">
                      <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2 text-sm">✨</span>
                      {isVerbeteringStreaming ? '🔄 Verbeterde Versie 2.0 wordt gegenereerd...' : '✅ Verbeterde Versie 2.0'}
                    </h4>
                    {isVerbeteringStreaming && (
                      <button
                        onClick={stopVerbeteringGeneration}
                        className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        ⏹️ Stop
                      </button>
                    )}
                  </div>

                  {/* Streaming Status voor verbetering */}
                  {isVerbeteringStreaming && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <span className="text-green-700 font-medium">AI implementeert je verbeteringen...</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <MarkdownRenderer 
                      content={isVerbeteringStreaming ? verbeterStreamingResponse : verbeterdeToets}
                      className="text-gray-700"
                    />
                    {isVerbeteringStreaming && (
                      <span className="inline-block w-2 h-5 bg-green-600 animate-pulse ml-1 align-text-bottom"></span>
                    )}
                  </div>

                  {/* Response Actions voor verbeterde toets */}
                  {!isVerbeteringStreaming && verbeterdeToets && (
                    <ResponseActions 
                      content={verbeterdeToets}
                      isMarkdown={true}
                      isStreaming={false}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".docx,.pdf,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp,.bmp,image/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.mpeg,.mpga,.webm,audio/*"
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length > 0) {
            Array.from(files).forEach(file => handleSingleFileUpload(file))
          }
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* Footer */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center space-x-4 text-purple-600">
          <span>💜</span>
          <span className="font-medium">Toetsgenerator powered by Gemini AI</span>
          <span>💜</span>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Template door Tom Naberink • Professionele toetsen voor het onderwijs
        </p>
      </div>
    </div>
  )
}