'use client';
import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Image from 'next/image';

// Definimos los agentes que se verán en pantalla
const INITIAL_AGENTS = [
  { id: 'director', name: 'Director de Ingeniería', role: 'Coordinación', status: 'idle' },
  { id: 'architect', name: 'Arquitecto', role: 'Diseño', status: 'idle' },
  { id: 'coder', name: 'Programador Full-Stack', role: 'Código', status: 'idle' },
  { id: 'qa', name: 'QA / Tester', role: 'Pruebas', status: 'idle' },
  { id: 'reviewer', name: 'Revisor Independiente', role: 'Revisión', status: 'idle' },
];

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [files, setFiles] = useState<{ path: string, content: string }[]>([]);
  const [activeFile, setActiveFile] = useState<number>(0);

  // 🔥 ESTADOS PARA EL CENTRO DE MANDO MULTIAGENTE
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [logs, setLogs] = useState<string[]>([]);

  // Función para simular el trabajo de los agentes
  const simulateAgentWork = (agentId: string, logMessage: string, duration: number) => {
    return new Promise<void>((resolve) => {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'working' } : a));
      setLogs(prev => [...prev, `[${agentId.toUpperCase()}] ${logMessage}`]);
      
      setTimeout(() => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'completed' } : a));
        setLogs(prev => [...prev, `[${agentId.toUpperCase()}] ✔️ Tarea completada.`]);
        resolve();
      }, duration);
    });
  };

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setAgents(INITIAL_AGENTS);
    setLogs([]);

    try {
      // 1. Simulamos que el Director y el Arquitecto trabajan
      await simulateAgentWork('director', 'Analizando requerimientos y creando plan...', 1500);
      await simulateAgentWork('architect', 'Diseñando estructura de archivos y DB...', 2000);

      // 2. Hacemos la llamada real a la IA
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      
      if (data.result) {
        setBlueprint(data.result);
        setLogs(prev => [...prev, `[SISTEMA] Blueprint técnico generado con éxito.`]);
      }
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `[ERROR] Fallo al contactar a los agentes.`]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!blueprint) return;
    setLoading(true);
    
    try {
      // Simulamos el trabajo de Coder, QA y Revisor
      await simulateAgentWork('coder', 'Escribiendo archivos del proyecto...', 3000);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint: JSON.parse(blueprint) }),
      });
      const data = await res.json();
      
      if (data.result) {
        const parsed = JSON.parse(data.result);
        setFiles(parsed.files || []);
        
        // Simulamos QA y Revisor
        await simulateAgentWork('qa', 'Ejecutando pruebas automatizadas...', 2000);
        await simulateAgentWork('reviewer', 'Revisando código y calidad...', 1500);
        
        setLogs(prev => [...prev, `[SISTEMA] Proyecto finalizado y validado.`]);
      }
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `[ERROR] Fallo en la generación de código.`]);
    } finally {
      setLoading(false);
    }
  };

  const downloadProject = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach((file) => {
      const cleanPath = file.path.replace(/^\.\//, '');
      zip.file(cleanPath, file.content);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'laborando-project.zip');
    } catch (error) {
      console.error("Error creando el ZIP", error);
    }
  };

  // UI para las burbujas de estado de los agentes
  const getAgentColor = (status: string) => {
    if (status === 'working') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse';
    if (status === 'completed') return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-gray-800 text-gray-400 border-gray-700';
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden selection:bg-[#264f78]">
      
      {/* PANEL IZQUIERDO: Explorador de Archivos */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] flex flex-col overflow-hidden relative`}>
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <span className="font-semibold text-xs tracking-wider text-blue-400 uppercase">Explorador</span>
          {files.length > 0 && (
            <button onClick={downloadProject} className="text-xs bg-[#238636] hover:bg-[#2ea043] text-white px-2 py-1 rounded-md shadow-lg">⬇️ ZIP</button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <p className="text-xs text-gray-500 p-2 italic text-center mt-4">Sin archivos generados.</p>
          ) : (
            <ul className="space-y-0.5">
              {files.map((file, idx) => (
                <li key={idx} onClick={() => setActiveFile(idx)} className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md text-[13px] transition-colors ${activeFile === idx ? 'bg-[#1f6feb] text-white font-medium' : 'text-gray-400 hover:bg-[#21262d] hover:text-white'}`}>
                  <span className={activeFile === idx ? 'text-white' : 'text-blue-400'}>◈</span> 
                  <span className="truncate">{file.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* PANEL CENTRAL: Editor / Orquestador Visual */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        <header className="h-10 border-b border-[#30363d] flex items-center px-4 bg-[#161b22] justify-between">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-[#30363d] rounded text-gray-400 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <span className="text-xs text-gray-400 font-mono">{files.length > 0 ? files[activeFile]?.path : 'Laborando — Command Center'}</span>
          </div>
          {loading && <span className="text-xs text-yellow-400 animate-pulse flex items-center gap-2"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Agentes trabajando...</span>}
        </header>

        <div className="flex-1 overflow-auto p-4 flex flex-col">
          
          {/* VISTA DE AGENTES (Se muestra cuando no hay archivos aún) */}
          {files.length === 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-300 mb-3">Panel de Agentes Activos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {agents.map((agent) => (
                  <div key={agent.id} className={`p-3 rounded-lg border transition-all ${getAgentColor(agent.status)}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">{agent.name}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70">{agent.role}</span>
                    </div>
                    <div className="text-xs flex items-center gap-2">
                      {agent.status === 'idle' && '⏸ Esperando'}
                      {agent.status === 'working' && '⚙️ Trabajando...'}
                      {agent.status === 'completed' && '✅ Completado'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONSOLA DE LOGS */}
          <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg p-4 font-mono text-xs overflow-y-auto flex flex-col">
            <div className="text-gray-500 mb-2 border-b border-[#30363d] pb-2">Registro de Operaciones (Terminal)</div>
            {logs.length === 0 && <span className="text-gray-600 italic">Los eventos aparecerán aquí...</span>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1 text-green-400">
                <span className="text-gray-500 mr-2">$</span>{log}
              </div>
            ))}
            {blueprint && files.length === 0 && (
               <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-blue-300">
                 El Arquitecto ha generado el Blueprint. <button onClick={handleGenerateCode} className="underline font-bold hover:text-white">Aprobar y Generar Código</button>
               </div>
            )}
          </div>

          {/* VISOR DE CÓDIGO (Si ya hay archivos) */}
          {files.length > 0 && (
            <div className="mt-4 flex-1 border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117]">
              <pre className="p-4 text-[13px] font-mono text-[#e6edf3] leading-relaxed h-full overflow-auto">
                <code>{files[activeFile]?.content}</code>
              </pre>
            </div>
          )}
        </div>
      </main>

      {/* PANEL DERECHO: Chat con el Director */}
      <aside className="w-[400px] bg-[#161b22] border-l border-[#30363d] flex flex-col">
        <header className="h-10 border-b border-[#30363d] flex items-center px-4 bg-[#0d1117]">
          <h1 className="text-xs font-semibold text-gray-300 tracking-wider">CHAT — DIRECTOR DE INGENIERÍA</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {blueprint ? (
             <div className="bg-[#21262d] p-4 rounded-lg text-sm text-gray-300 border border-[#30363d]">✅ <strong>Planificación completada.</strong> Revisa los logs y aprueba el código en el panel central.</div>
          ) : (
            <div className="text-center mt-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20"><span className="text-2xl text-white">✦</span></div>
              <p className="text-sm text-gray-400">Pídele al Director que construya tu aplicación.</p>
            </div>
          )}
        </div>

        <footer className="p-4">
          <form onSubmit={handleGenerateBlueprint} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 focus-within:border-blue-500 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: Construye un módulo de pagos con Stripe..."
              className="w-full bg-transparent text-[#e6edf3] p-2 text-sm focus:outline-none resize-none placeholder-gray-500"
              rows={3}
            />
            <div className="flex items-center justify-between px-2 pt-3 border-t border-[#30363d] mt-2">
              <span className="text-xs text-blue-300 bg-[#1f6feb]/20 px-2 py-1.5 rounded-md border border-[#1f6feb]/30 cursor-pointer hidden sm:block">
                Claude 3.5 Sonnet ⌄
              </span>
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white disabled:opacity-50 shadow-md ml-auto"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>
                )}
              </button>
            </div>
          </form>
        </footer>
      </aside>

    </div>
  );
}
