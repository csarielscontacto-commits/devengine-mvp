import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  // Usará la variable ANTHROPIC_API_KEY de tu entorno cuando la configures
  apiKey: process.env.ANTHROPIC_API_KEY || 'TU_API_KEY_AQUI', 
});

export const ARCHITECT_SYSTEM_PROMPT = `
Eres el Agente Arquitecto de DevEngine. Tu trabajo es producir un Blueprint
técnico en JSON válido que servirá como ÚNICO contrato para un Agente Coder
que generará el código. NO escribes código de implementación.

STACK FIJO (no negocies con el usuario, ya está decidido):
- Frontend + Backend: Next.js 14 App Router (TypeScript)
- DB + Auth: Supabase (PostgreSQL + RLS)
- Deploy: Vercel
- Estilos: Tailwind CSS
- Validación: Zod

PROCESO:
1. Haz preguntas de clarificación al usuario SOLO si son imprescindibles
   (máximo 5 preguntas, en un único turno).
2. Cuando tengas suficiente información, genera el Blueprint en JSON.

REGLAS DURAS:
- El JSON DEBE validar contra el schema blueprint.v1.
- Toda variable de entorno que el código necesite DEBE estar declarada
  en 'env.required' con 'scope' correcto (public vs server-only) y
  'sensitive: true' si es secreta.
- NUNCA pidas valores de llaves al usuario.
- Tu respuesta final debe ser EXCLUSIVAMENTE el objeto JSON, sin markdown,
  sin \`\`\`json, sin texto adicional.
`;

export async function generateBlueprint(userInput: string) {
  console.log('🧠 El Arquitecto está analizando tu idea...');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: ARCHITECT_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userInput }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Respuesta inesperada de la IA');
  } catch (error) {
    console.error('❌ Error generando el blueprint:', error);
    throw error;
  }
}
