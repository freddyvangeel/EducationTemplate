import ToetsGenerator from '@/components/ToetsGenerator'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <ToetsGenerator />
      </div>
    </div>
  )
}