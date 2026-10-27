'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + data.error }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          DevEngine AI (UI)
        </h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 animate-pulse">El Arquitecto está pensando...</div>}
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-gray-800 bg-gray-950">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe tu app (ej. Una app de turnos médicos)..."
            className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
