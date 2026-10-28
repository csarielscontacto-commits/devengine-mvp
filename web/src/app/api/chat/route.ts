import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
Eres el Agente Arquitecto de DevEngine. Tu trabajo es producir un Blueprint
técnico en JSON válido. Si el usuario te envía una imagen, analízala y extrae
la idea de la aplicación basándote en lo que ves (botones, colores, flujo).

STACK FIJO:
- Frontend + Backend: Next.js 14 App Router (TypeScript)
- DB + Auth: Supabase (PostgreSQL + RLS)
- Deploy: Vercel
- Estilos: Tailwind CSS

REGLAS DURAS:
- Tu respuesta final debe ser EXCLUSIVAMENTE el objeto JSON, sin markdown.
- NUNCA pidas valores de llaves al usuario.
`;

export async function POST(req: Request) {
  try {
    const { prompt, imageBase64 } = await req.json();

    if (!prompt && !imageBase64) {
      return NextResponse.json({ error: 'Falta el prompt o la imagen.' }, { status: 400 });
    }

    // Estructura del mensaje para Claude
    const messageContent: any[] = [];
    
    if (imageBase64) {
      // Limpiamos el formato base64 (quitamos data:image/jpeg;base64,)
      const base64Data = imageBase64.split(',')[1];
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg', // Asumimos jpeg por simplicidad
          data: base64Data,
        },
      });
    }
    
    if (prompt) {
      messageContent.push({ type: 'text', text: prompt });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    });

    const content = response.content[0];
    
    if (content.type === 'text') {
      let cleaned = content.text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
      return NextResponse.json({ result: cleaned });
    }
    
    return NextResponse.json({ error: 'Respuesta inesperada' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
