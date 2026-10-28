'use client';
import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Image from 'next/image';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [files, setFiles] = useState<{ path: string, content: string }[]>([]);
  const [activeFile, setActiveFile] = useState<number>(0);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imagePreview) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, imageBase64: imagePreview }),
      });
      const data = await res.json();
      if (data.result) {
        setBlueprint(data.result);
        setImagePreview(null);
      }
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
      alert("Hubo un error al empaquetar los archivos.");
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden selection:bg-[#264f78]">
      
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] flex flex-col overflow-hidden relative`}>
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <span className="font-semibold text-xs tracking-wider text-blue-400 uppercase">Explorador</span>
          {files.length > 0 && (
            <button onClick={downloadProject} className="text-xs bg-[#238636] hover:bg-[#2ea043] text-white px-2 py-1 rounded-md shadow-lg">
              ⬇️ ZIP
            </button>
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

      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        <header className="h-10 border-b border-[#30363d] flex items-center px-4 bg-[#161b22]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-[#30363d] rounded text-gray-400 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <span className="text-xs text-gray-400 font-mono">{files.length > 0 ? files[activeFile]?.path : 'Laborando — Architect'}</span>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-2xl w-full">
                {!blueprint ? (
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">Laborando</h2>
                    <p className="text-gray-400 text-sm">Describe tu aplicación o sube una foto.</p>
                  </div>
                ) : (
                  <div className="text-left bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-2xl">
                    <div className="bg-[#0d1117] px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                      <span className="text-xs font-mono text-gray-400">blueprint.json</span>
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">Listo</span>
                    </div>
                    <pre className="p-4 text-[13px] font-mono text-[#79c0ff] overflow-x-auto max-h-[50vh]">{blueprint}</pre>
                    <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
                      <button onClick={handleGenerateCode} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
                        {loading ? 'Generando...' : '⚡ Generar Código'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <pre className="text-[13px] font-mono text-[#e6edf3] leading-relaxed bg-[#0d1117] p-4 rounded-md border border-[#30363d]">
              <code>{files[activeFile]?.content}</code>
            </pre>
          )}
        </div>
      </main>

      <aside className="w-[400px] bg-[#161b22] border-l border-[#30363d] flex flex-col">
        <header className="h-10 border-b border-[#30363d] flex items-center px-4 bg-[#0d1117]">
          <h1 className="text-xs font-semibold text-gray-300 tracking-wider">CHAT</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {blueprint ? (
             <div className="bg-[#21262d] p-4 rounded-lg text-sm text-gray-300 border border-[#30363d]">✅ <strong>Arquitectura generada.</strong></div>
          ) : (
            <div className="text-center mt-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20"><span className="text-2xl text-white">✦</span></div>
              <p className="text-sm text-gray-400">Pídele a Laborando que construya tu aplicación.</p>
            </div>
          )}
        </div>

        <footer className="p-4">
          <form onSubmit={handleGenerateBlueprint} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 focus-within:border-blue-500 shadow-sm">
            
            {imagePreview && (
              <div className="relative w-20 h-20 mb-3 rounded-md overflow-hidden border border-[#30363d]">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <button type="button" onClick={() => setImagePreview(null)} className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-md p-1 text-xs">✕</button>
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pídele a Laborando que construya, corrija errores y explore..."
              className="w-full bg-transparent text-[#e6edf3] p-2 text-sm focus:outline-none resize-none placeholder-gray-500"
              rows={3}
            />
            
            {/* 🔥 BARRA INFERIOR CON BOTONES GRANDES PARA CELULAR */}
            <div className="flex items-center justify-between px-2 pt-3 border-t border-[#30363d] mt-2">
              <div className="flex items-center gap-3">
                
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                
                {/* BOTÓN DE FOTO GRANDE Y VISIBLE */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Adjuntar Foto
                </button>

                <span className="text-xs text-blue-300 bg-[#1f6feb]/20 px-2 py-1.5 rounded-md border border-[#1f6feb]/30 cursor-pointer hidden sm:block">
                  Claude 3.5 Sonnet ⌄
                </span>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || (!input.trim() && !imagePreview)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white disabled:opacity-50 shadow-md"
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
