//app/page.js

import SearchInterface from '@/components/SearchInterface'

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#1a1d23] p-6 rounded-lg border border-[#00ff9d]/20 shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all duration-300 hover:border-[#00ff9d]/40 hover:shadow-[0_0_20px_rgba(0,255,157,0.2)] hover:-translate-y-1">
      <h3 className="text-xl font-mono font-semibold mb-4 text-[#00ff9d] glow-primary">
        {icon} {title}
      </h3>
      <p className="text-[#94a3b8]">{description}</p>
    </div>
  )
}

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center py-16 bg-gradient-to-r from-[#0d1f1a] via-[#12151a] to-[#0d1f1a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <h1 className="text-4xl font-bold mb-4 text-[#00ff9d] glow-primary">
            Multimodal Search Revolution
          </h1>
          <p className="text-xl mb-8 text-[#e0e0e0]">
            Search across text, images, and voice using advanced AI retrieval
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-[#1a1d23] rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.1)] border border-[#00ff9d]/20 p-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#00ff9d] glow-primary">
            Search Interface
          </h2>
          <SearchInterface />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📚"
            title="Text Search"
            description="Semantic analysis with neural embeddings"
          />
          <FeatureCard
            icon="🖼️"
            title="Image Search"
            description="CLIP-powered visual pattern recognition"
          />
          <FeatureCard
            icon="🎙️"
            title="Voice Search"
            description="Real-time Whisper ASR conversion"
          />
        </div>
      </section>
    </div>
  )
}
