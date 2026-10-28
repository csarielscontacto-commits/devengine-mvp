'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      
      if (data.result) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + data.error }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error de conexión con el servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de "Enter" para enviar, "Shift+Enter" para salto de línea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden">
      
      {/* Panel Lateral (Sidebar tipo IDE) */}
      <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col hidden md:flex">
        <div className="p-4 border-b border-[#30363d] flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-sm font-semibold text-gray-400">devengine-mvp</span>
        </div>
        <div className="p-4 flex-1">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Explorador</p>
          <ul className="space-y-1 text-sm text-gray-400">
            <li className="flex items-center gap-2 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#21262d]">
              <span className="text-blue-400">📁</span> src
            </li>
            <li className="flex items-center gap-2 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-[#21262d] ml-4">
              <span className="text-blue-400">📁</span> app
            </li>
            <li className="flex items-center gap-2 text-white px-2 py-1 rounded bg-[#21262d] ml-8">
              <span className="text-yellow-400">📄</span> page.tsx
            </li>
          </ul>
        </div>
      </aside>

      {/* Área Principal del Chat */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-14 border-b border-[#30363d] flex items-center px-4 justify-between bg-[#0d1117] z-10">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-blue-500">✦</span> DevEngine Architect
          </h1>
          <span className="text-xs bg-[#238636] text-white px-2 py-1 rounded-full font-medium">Zero-Trust</span>
        </header>

        {/* Lista de Mensajes */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
              <div className="w-16 h-16 bg-[#161b22] rounded-2xl flex items-center justify-center border border-[#30363d]">
                <span className="text-3xl">🏗️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-300">¿Qué vamos a construir hoy?</h2>
              <p className="max-w-md text-sm">Describe tu aplicación full-stack. El Agente Arquitecto generará el Blueprint técnico en formato JSON.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Avatar del Bot */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 flex-shrink-0 mt-1">
                  ✦
                </div>
              )}

              {/* Burbuja del Mensaje */}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-xl overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-[#1f6feb] text-white p-4' 
                  : 'bg-[#161b22] border border-[#30363d]'
              }`}>
                
                {/* Si es el bot, mostramos un bloque de código estilo IDE */}
                {msg.role === 'assistant' ? (
                  <div className="flex flex-col">
                    <div className="bg-[#0d1117] px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-mono">blueprint.json</span>
                      <span className="text-xs text-gray-500">JSON</span>
                    </div>
                    <pre className="p-4 text-sm font-mono overflow-x-auto text-green-300">
                      <code>{msg.content}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
                ✦
              </div>
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-gray-400 text-sm">El Arquitecto está diseñando tu Blueprint...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Flotante */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d1117] via-[#0d1117] to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-end bg-[#161b22] border border-[#30363d] rounded-xl shadow-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe tu app (ej. Una app de turnos médicos)..."
                className="w-full bg-transparent text-white p-4 max-h-32 min-h-[60px] focus:outline-none resize-none"
                rows={1}
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="m-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-2">
              DevEngine AI puede cometer errores. Verifica la arquitectura antes de generar el código.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
