'use client'

import { useState, useRef } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'

interface ToetsConfig {
  vraagType: string
  aantalVragen: number
  onderwijsNiveau: string
  bloomNiveaus: string[]
  metCasus: boolean
  onderwerp: string
  contextTekst: string
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
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentStreamingResponseRef = useRef<string>('')

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
    currentStreamingResponseRef.current = ''

    abortControllerRef.current = new AbortController()

    try {
      const prompt = generatePrompt()

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart', // Gebruik 2.5 Flash zoals gevraagd
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
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
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
                min="5"
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
      )}

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