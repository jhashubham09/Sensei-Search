//app/layout.js

import './globals.css'

export const metadata = {
  title: 'Sensei-Search - Multimodal RAG Engine',
  description: 'AI-powered search engine combining text, image, and voice inputs with Retrieval Augmented Generation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#0a0b0d] min-h-screen font-mono text-gray-100 selection:bg-[#00ff9d]/20 selection:text-[#00ff9d]">
        <nav className="bg-[#12151a] border-b border-[#00ff9d]/30 shadow-[0_0_15px_rgba(0,255,157,0.1)]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#00ff9d] glow-primary">
                Sensei-Search
              </h1>
              <div className="space-x-6">
                <a
                  href="/"
                  className="text-gray-300 hover:text-[#00ff9d] transition-colors duration-300 relative cyber-link"
                >
                  Search
                </a>
                <a
                  href="/docs"
                  className="text-gray-300 hover:text-[#00ff9d] transition-colors duration-300 relative cyber-link"
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-[#12151a] border-t border-[#00ff9d]/30 mt-8 shadow-[0_0_15px_rgba(0,255,157,0.1)]">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-400">
            <p className="relative group glow-secondary">
              © 2025 Sensei-Search. Built for Chronos Hackathon v1.0
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
