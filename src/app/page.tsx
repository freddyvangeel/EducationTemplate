import TestChatBot from '@/components/TestChatBot'
import CopyButton from '@/components/CopyButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Gemini API Template
          </h1>
          
          <p className="text-xl text-purple-700 font-medium">
            Dit is een template om met Gemini te werken, gemaakt door Tom Naberink
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          
          {/* Setup Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                🔧
              </span>
              Setup Instructies
            </h2>
            
            <div className="space-y-6">
              
              {/* Step 1 - Create .env.local */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 1: Maak een .env.local bestand
                </h3>
                <p className="text-gray-600 mb-3">
                  Maak een nieuw bestand genaamd <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code> in de root van je project:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">.env.local</span>
                    <CopyButton 
                      text="GEMINI_API_KEY=your_actual_api_key_here"
                      className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                      title="Kopieer .env.local inhoud"
                    />
                  </div>
                  <code>GEMINI_API_KEY=your_actual_api_key_here</code>
                </div>
                <p className="text-orange-600 text-sm mt-2 font-medium">
                  ⚠️ Vervang "your_actual_api_key_here" met je echte API key! (zie stap 2)
                </p>
              </div>

              {/* Step 2 - Get API Key */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 2: Verkrijg een Gemini API Key
                </h3>
                <p className="text-gray-600 mb-3">
                  Ga naar Google AI Studio om je gratis API key aan te maken:
                </p>
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>Verkrijg API Key</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ <strong>Let op</strong>, je kunt gratis en risicovrij oefenen met de Gemini API. Daarnaast kun je 300,- dollar gratis budget krijgen. Als dat op, dan moet je het koppelen aan je creditcard. Zorg ervoor dat je weet wat je doet op dat moment!
                  </p>
                </div>
              </div>

              {/* Step 3 - Enhanced Test Step */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 3: Test je API Key & Alle Features
                </h3>
                <TestChatBot />
              </div>

              {/* Step 4 - Bolt Instructions */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 4: Werken met Bolt
                </h3>
                <p className="text-gray-600 mb-3">
                  Voordat je begint met bouwen in Bolt, zeg tegen Bolt dat het de ontwikkelingsinstructies moet lezen:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Instructie voor Bolt</span>
                    <CopyButton 
                      text="lees instructies.md"
                      className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                      title="Kopieer instructie"
                    />
                  </div>
                  <code>lees instructies.md</code>
                </div>
              </div>

              {/* Step 5 - Build Step */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 5: Bouwen maar!
                </h3>
                <p className="text-gray-600">
                  Wat ga jij maken om het onderwijs te verbeteren?
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-4 text-purple-600">
              <span>💜</span>
              <span>Veel succes met bouwen!</span>
              <span>💜</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Template door Tom Naberink • Powered by Next.js & Gemini AI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}