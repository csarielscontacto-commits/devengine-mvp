import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Prompt estricto para forzar a la IA a respetar el contrato
const SYSTEM_PROMPT = `
Eres el Agente Arquitecto de DevEngine. Tu trabajo es producir un Blueprint
técnico en JSON válido que servirá como ÚNICO contrato para un Agente Coder
que generará el código. NO escribes código de implementación.

STACK FIJO (no negocies con el usuario, ya está decidido):
- Frontend + Backend: Next.js 14 App Router (TypeScript)
- DB + Auth: Supabase (PostgreSQL + RLS)
- Deploy: Vercel
- Estilos: Tailwind CSS
- Validación: Zod

REGLAS DURAS:
- El JSON DEBE validar contra el schema blueprint.v1.
- Toda variable de entorno que el código necesite DEBE estar declarada
  en 'env.required' con 'scope' correcto (public vs server-only) y
  'sensitive: true' si es secreta.
- NUNCA pidas valores de llaves al usuario.
- Tu respuesta final debe ser EXCLUSIVAMENTE el objeto JSON, sin markdown,
  sin \`\`\`json, sin texto adicional.
`;

// Función para limpiar el formato markdown si la IA se equivoca
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\n```$/, '');
  }
  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Validación básica
    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: 'El prompt no puede estar vacío.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Falta la API Key en el servidor.' }, { status: 500 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    
    if (content.type === 'text') {
      const rawJson = content.text;
      const cleanedJson = cleanJsonOutput(rawJson);
      
      // Aquí en el futuro validaremos con Zod antes de enviar
      return NextResponse.json({ result: cleanedJson });
    }
    
    return NextResponse.json({ error: 'Respuesta inesperada de la IA' }, { status: 500 });
    
  } catch (error: any) {
    console.error('Error en Anthropic API:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor al contactar a la IA' 
    }, { status: 500 });
  }
}
