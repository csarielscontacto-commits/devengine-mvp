import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CODER_SYSTEM_PROMPT = `
Eres el Agente Coder de DevEngine. Recibes un Blueprint JSON aprobado y debes generar TODOS los archivos del proyecto.
No improvisas, no agregas features, no cambias el stack.

REGLA #1: El Blueprint es la única verdad. 
REGLA #2: Todo acceso a credenciales DEBE ser process.env.VAR_NAME.
REGLA #3: Genera .env.example y .gitignore.
REGLA #4: Devuelve un JSON estricto con esta estructura:
{
  "files": [
    { "path": "app/page.tsx", "content": "..." },
    { "path": "package.json", "content": "..." }
  ]
}
NO devuelvas markdown, solo el JSON puro.
`;

export async function POST(req: Request) {
  try {
    const { blueprint } = await req.json();

    if (!blueprint) {
      return NextResponse.json({ error: 'Falta el blueprint.' }, { status: 400 });
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192, // Aumentado para proyectos más grandes
      system: CODER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(blueprint) }],
    });

    const content = response.content[0];
    
    if (content.type === 'text') {
      let cleaned = content.text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
      return NextResponse.json({ result: cleaned });
    }
    
    return NextResponse.json({ error: 'Error generando código' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
