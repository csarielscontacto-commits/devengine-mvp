'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para el Flujo de Trabajo
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [files, setFiles] = useState<{ path: string, content: string }[]>([]);
  const [activeFile, setActiveFile] = useState<number>(0);
  const [step, setStep] = useState<'architect' | 'coder'>('architect');

  // 1. Generar Blueprint
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
      if (data.result) {
        setBlueprint(data.result);
        setStep('coder');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Generar Código a partir del Blueprint
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
      alert('Error generando código. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden">
      
      {/* PANEL IZQUIERDO: Explorador de Archivos */}
      <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        <div className="p-4 border-b border-[#30363d] flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-white">DevEngine</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Archivos Generados</p>
          
          {files.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aún no hay archivos. Genera el Blueprint primero.</p>
          ) : (
            <ul className="space-y-1">
              {files.map((file, idx) => (
                <li 
                  key={idx}
                  onClick={() => setActiveFile(idx)}
                  className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded text-sm ${activeFile === idx ? 'bg-[#1f6feb] text-white' : 'text-gray-400 hover:bg-[#21262d] hover:text-white'}`}
                >
                  <span className="text-blue-400">📄</span> 
                  <span className="truncate">{file.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* PANEL CENTRAL: Editor de Código (o Chat si no hay archivos) */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-[#30363d]">
        {files.length === 0 ? (
          // Vista de Chat / Blueprint
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Agente Arquitecto</h2>
            <p className="text-gray-400 max-w-md">Describe tu app para generar el Blueprint técnico.</p>
            
            {blueprint && (
              <div className="w-full max-w-2xl text-left bg-[#161b22] border border-[#30363d] rounded-lg mt-8">
                <div className="bg-[#0d1117] px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                  <span className="text-xs font-mono text-gray-400">blueprint.json</span>
                </div>
                <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto max-h-96">
                  {blueprint}
                </pre>
                <div className="p-4 border-t border-[#30363d] flex justify-end">
                  <button onClick={handleGenerateCode} disabled={loading} className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded font-semibold transition-colors">
                    {loading ? 'Generando Código...' : 'Aprobar y Generar Código con el Agente 2 ⚡'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Vista del Editor de Código
          <div className="flex-1 flex flex-col bg-[#0d1117]">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
              <span className="text-sm font-mono text-gray-300">{files[activeFile]?.path}</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm font-mono text-blue-200">
                <code>{files[activeFile]?.content}</code>
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* PANEL DERECHO: El Chat de control */}
      <aside className="w-80 bg-[#161b22] flex flex-col">
        <header className="h-14 border-b border-[#30363d] flex items-center px-4 bg-[#0d1117]">
          <h1 className="text-sm font-bold text-white">Panel de Control</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
            <p className="text-xs text-gray-400">Estado actual:</p>
            <p className="text-sm font-semibold text-green-400">
              {step === 'architect' ? 'Esperando descripción' : 'Blueprint listo'}
            </p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Utiliza este panel para dar instrucciones al sistema. Si quieres cambiar la arquitectura, empieza de nuevo.
          </p>
        </div>

        <footer className="p-4 border-t border-[#30363d] bg-[#0d1117]">
          <form onSubmit={handleGenerateBlueprint} className="flex flex-col gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe tu app..."
              className="w-full bg-[#161b22] text-white p-3 rounded-lg border border-[#30363d] focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Pensando...' : 'Generar Blueprint'}
            </button>
          </form>
        </footer>
      </aside>

    </div>
  );
}
