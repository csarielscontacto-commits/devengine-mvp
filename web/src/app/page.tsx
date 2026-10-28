'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [files, setFiles] = useState<{ path: string, content: string }[]>([]);
  const [activeFile, setActiveFile] = useState<number>(0);

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (data.result) setBlueprint(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!blueprint) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint: JSON.parse(blueprint) }),
      });
      const data = await res.json();
      if (data.result) {
        const parsed = JSON.parse(data.result);
        setFiles(parsed.files || []);
      }
    } catch (error) {
      console.error(error);
      alert('Error generando código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#000000] text-[#d4d4d4] font-sans overflow-hidden selection:bg-[#264f78]">
      
      {/* PANEL IZQUIERDO: Explorador */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#181818] border-r border-[#2b2b2b] flex flex-col overflow-hidden relative`}>
        <div className="p-3 border-b border-[#2b2b2b] flex items-center justify-between">
          <span className="font-semibold text-xs tracking-wider text-gray-400 uppercase">Explorador</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <p className="text-xs text-gray-600 p-2 italic">Sin archivos generados.</p>
          ) : (
            <ul className="space-y-0.5">
              {files.map((file, idx) => (
                <li 
                  key={idx}
                  onClick={() => setActiveFile(idx)}
                  className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded text-[13px] ${activeFile === idx ? 'bg-[#2b2b2b] text-white' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-white'}`}
                >
                  <span className="text-blue-400 text-xs">◈</span> 
                  <span className="truncate">{file.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* PANEL CENTRAL: Editor de Código */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        <header className="h-10 border-b border-[#2b2b2b] flex items-center px-4 bg-[#1e1e1e]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-[#2b2b2b] rounded text-gray-400 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-xs text-gray-400 font-mono">{files.length > 0 ? files[activeFile]?.path : 'Laborando — Architect'}</span>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-2xl w-full">
                {!blueprint ? (
                  <div className="space-y-4">
                    <h2 className="text-3xl font-light text-white mb-2">Laborando</h2>
                    <p className="text-gray-500 text-sm">Describe tu aplicación para generar la arquitectura.</p>
                  </div>
                ) : (
                  <div className="text-left bg-[#181818] border border-[#2b2b2b] rounded-lg overflow-hidden shadow-2xl">
                    <div className="bg-[#1e1e1e] px-4 py-2 border-b border-[#2b2b2b] flex justify-between items-center">
                      <span className="text-xs font-mono text-gray-400">blueprint.json</span>
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Listo</span>
                    </div>
                    <pre className="p-4 text-[13px] font-mono text-[#9cdcfe] overflow-x-auto max-h-[50vh]">
                      {blueprint}
                    </pre>
                    <div className="p-4 border-t border-[#2b2b2b] bg-[#181818] flex justify-end">
                      <button onClick={handleGenerateCode} disabled={loading} className="bg-[#007acc] hover:bg-[#006bb3] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                        {loading ? 'Generando...' : '⚡ Generar Código'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <pre className="text-[13px] font-mono text-[#d4d4d4] leading-relaxed">
              <code>{files[activeFile]?.content}</code>
            </pre>
          )}
        </div>
      </main>

      {/* PANEL DERECHO: Chat Flotante */}
      <aside className="w-[400px] bg-[#181818] border-l border-[#2b2b2b] flex flex-col">
        <header className="h-10 border-b border-[#2b2b2b] flex items-center px-4">
          <h1 className="text-xs font-semibold text-gray-300">CHAT</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {blueprint ? (
             <div className="bg-[#2b2b2b] p-3 rounded-lg text-sm text-gray-300 border border-[#3c3c3c]">
               ✅ Arquitectura generada. Revisa el Blueprint en el panel central o pide cambios.
             </div>
          ) : (
            <div className="text-center mt-10">
              <div className="w-12 h-12 bg-[#2b2b2b] rounded-xl mx-auto flex items-center justify-center mb-4 border border-[#3c3c3c]">
                <span className="text-xl">✦</span>
              </div>
              <p className="text-sm text-gray-400">Pídele a Laborando que construya tu aplicación.</p>
            </div>
          )}
        </div>

        <footer className="p-4">
          <form onSubmit={handleGenerateBlueprint} className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl p-2 focus-within:border-[#007acc] transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pídele a Laborando que construya, corrija errores y explore..."
              className="w-full bg-transparent text-[#d4d4d4] p-2 text-sm focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-2">
                <button type="button" className="text-gray-500 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400 bg-[#2b2b2b] px-2 py-1 rounded-md border border-[#3c3c3c] cursor-pointer hover:bg-[#3c3c3c]">
                  Claude 3.5 Sonnet ⌄
                </span>
              </div>
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-1.5 bg-[#2b2b2b] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-md text-white disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </footer>
      </aside>

    </div>
  );
}
