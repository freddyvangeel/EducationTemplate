'use client'

import { useState, useRef } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'

interface ToetsVraag {
  id: string
  type: string
  vraag: string
  antwoorden?: string[]
  juisteAntwoord?: number | boolean
  uitleg?: string
  bloomNiveau?: string
  moeilijkheidsgraad?: string
}

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
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<ToetsConfig>({
    vraagType: '',
    aantalVragen: 10,
    onderwijsNiveau: '',
    bloomNiveaus: [],
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
    { id: 'kennis', label: 'Kennis (onthouden)', beschrijving: 'Feiten, begrippen en procedures onthouden', icon: '🧠' },
    { id: 'begrip', label: 'Begrip (begrijpen)', beschrijving: 'Betekenis van informatie begrijpen', icon: '💡' },
    { id: 'toepassing', label: 'Toepassing (toepassen)', beschrijving: 'Kennis gebruiken in nieuwe situaties', icon: '🔧' },
    { id: 'analyse', label: 'Analyse (analyseren)', beschrijving: 'Informatie opdelen en verbanden zoeken', icon: '🔍' },
    { id: 'synthese', label: 'Synthese (evalueren)', beschrijving: 'Oordelen vellen over waarde van ideeën', icon: '⚖️' },
    { id: 'evaluatie', label: 'Creatie (creëren)', beschrijving: 'Elementen combineren tot iets nieuws', icon: '✨' }
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
    setCurrentStep(1)
    setConfig({
      vraagType: '',
      aantalVragen: 10,
      onderwijsNiveau: '',
      bloomNiveaus: [],
      metCasus: false,
      onderwerp: '',
      contextTekst: ''
    })
    setGeneratedToets('')
    setStreamingResponse('')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                1️⃣ Welk type toetsvragen wil je?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vraagTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setConfig(prev => ({ ...prev, vraagType: type.id }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      config.vraagType === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-medium text-gray-800">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                2️⃣ Hoeveel vragen wil je?
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={config.aantalVragen}
                  onChange={(e) => setConfig(prev => ({ ...prev, aantalVragen: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <div className="bg-purple-100 px-4 py-2 rounded-lg">
                  <span className="text-purple-800 font-bold text-xl">{config.aantalVragen}</span>
                  <span className="text-purple-600 text-sm ml-1">vragen</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                3️⃣ Welk onderwijsniveau?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {onderwijsNiveaus.map((niveau) => (
                  <button
                    key={niveau.id}
                    onClick={() => setConfig(prev => ({ ...prev, onderwijsNiveau: niveau.id }))}
                    className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                      config.onderwijsNiveau === niveau.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{niveau.icon}</div>
                    <div className="font-medium text-gray-800">{niveau.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                4️⃣ Welke Bloom taxonomie niveaus? (meerdere mogelijk)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bloomNiveaus.map((niveau) => (
                  <button
                    key={niveau.id}
                    onClick={() => handleBloomNiveauToggle(niveau.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      config.bloomNiveaus.includes(niveau.id)
                        ? 'border-purple-500 bg-purple-50'
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
                <p className="text-orange-600 text-sm mt-2">
                  ⚠️ Selecteer minimaal één Bloom niveau
                </p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                5️⃣ Wil je casussen bij de vragen?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, metCasus: true }))}
                  className={`p-6 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                    config.metCasus
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">📖</div>
                  <div className="font-medium text-gray-800">Ja, met casussen</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Realistische scenario's voor contextrijke vragen
                  </div>
                </button>
                
                <button
                  onClick={() => setConfig(prev => ({ ...prev, metCasus: false }))}
                  className={`p-6 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                    !config.metCasus
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">📝</div>
                  <div className="font-medium text-gray-800">Nee, directe vragen</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Korte, directe kennisvragen zonder context
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                6️⃣ Wat is het onderwerp van de toets?
              </h3>
              <input
                type="text"
                value={config.onderwerp}
                onChange={(e) => setConfig(prev => ({ ...prev, onderwerp: e.target.value }))}
                placeholder="Bijvoorbeeld: Nederlandse Geschiedenis, Wiskunde Algebra, Biologie Cellen..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                7️⃣ Context informatie (optioneel)
              </h3>
              <textarea
                value={config.contextTekst}
                onChange={(e) => setConfig(prev => ({ ...prev, contextTekst: e.target.value }))}
                placeholder="Plak hier relevante teksten, hoofdstukken, of specifieke leerdoelen waar de toets op gebaseerd moet worden..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none h-32 resize-none"
              />
              <p className="text-gray-600 text-sm mt-2">
                💡 Tip: Voeg specifieke leerstof toe voor meer gerichte vragen
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.vraagType && config.aantalVragen > 0
      case 2:
        return config.onderwijsNiveau && config.bloomNiveaus.length > 0
      case 3:
        return config.onderwerp.trim().length > 0
      default:
        return false
    }
  }

  const getConfigSummary = () => {
    const vraagTypeLabel = vraagTypes.find(type => type.id === config.vraagType)?.label
    const niveauLabel = onderwijsNiveaus.find(niveau => niveau.id === config.onderwijsNiveau)?.label
    const bloomLabels = bloomNiveaus
      .filter(niveau => config.bloomNiveaus.includes(niveau.id))
      .map(niveau => niveau.label)

    return {
      vraagTypeLabel,
      niveauLabel,
      bloomLabels
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
          <span className="text-white text-2xl">📝</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Professionele Toetsgenerator
        </h1>
        <p className="text-purple-700 text-lg">
          Genereer kwalitatieve toetsen met AI - Powered by Gemini 2.5 Flash
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Voortgang</span>
          <span className="text-sm text-purple-600 font-medium">Stap {currentStep} van 3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {!generatedToets && !isStreaming ? (
          <>
            {renderStep()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Vorige
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Volgende →
                </button>
              ) : (
                <button
                  onClick={generateToets}
                  disabled={!canProceed() || isGenerating}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isGenerating ? '🔄 Genereren...' : '🚀 Genereer Toets'}
                </button>
              )}
            </div>

            {/* Configuration Summary */}
            {currentStep === 3 && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">📋 Toets Configuratie:</h4>
                <div className="text-sm text-purple-700 space-y-1">
                  <p><strong>Type:</strong> {getConfigSummary().vraagTypeLabel}</p>
                  <p><strong>Aantal:</strong> {config.aantalVragen} vragen</p>
                  <p><strong>Niveau:</strong> {getConfigSummary().niveauLabel}</p>
                  <p><strong>Bloom:</strong> {getConfigSummary().bloomLabels.join(', ')}</p>
                  <p><strong>Casussen:</strong> {config.metCasus ? 'Ja' : 'Nee'}</p>
                  <p><strong>Onderwerp:</strong> {config.onderwerp}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Generated Content */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isStreaming ? '🔄 Toets wordt gegenereerd...' : '✅ Jouw Toets is Klaar!'}
                </h2>
                <button
                  onClick={resetGenerator}
                  className="px-4 py-2 text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  🔄 Nieuwe Toets
                </button>
              </div>

              {/* Streaming Status */}
              {isStreaming && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-blue-700 font-medium">Gemini 2.5 Flash genereert je toets...</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-2">
                    De AI analyseert je specificaties en creëert kwalitatieve toetsvragen ✨
                  </p>
                </div>
              )}

              {/* Generated Content Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <MarkdownRenderer 
                  content={isStreaming ? streamingResponse : generatedToets}
                  className="text-gray-700"
                />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1 align-text-bottom"></span>
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
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          💜 Toetsgenerator powered by Gemini AI • Template door Tom Naberink
        </p>
      </div>
    </div>
  )
}