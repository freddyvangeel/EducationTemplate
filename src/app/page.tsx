export const dynamic = 'force-dynamic'
  
import LeermeterChatBot from '@/components/LeermeterChatBot'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <span className="text-white text-3xl">📚</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Chat met Leermeter
          </h1>
          
          <p className="text-xl text-blue-700 font-medium mb-6">
            Stel je vragen over de Leermeter. Ik help je graag!
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
            <p className="text-gray-600 text-sm">
              💡 <strong>Tip:</strong> Je kunt vragen stellen zoals:
            </p>
            <ul className="text-gray-600 text-sm mt-2 space-y-1">
              <li>• "Wat is de Leermeter?"</li>
              <li>• "Hoe gebruik ik de Leermeter?"</li>
              <li>• "Wat zijn de voordelen?"</li>
              <li>• "Leg uit hoe het werkt"</li>
            </ul>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <LeermeterChatBot />
        </div>
      </div>
    </div>
  )
}