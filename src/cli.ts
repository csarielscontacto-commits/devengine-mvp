#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { generateBlueprint } from './agents/architect';

const args = process.argv.slice(2);
const command = args[0];

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function runInit() {
  console.log('\n🏗️  DevEngine AI - Entrevista con el Arquitecto\n');
  const projectIdea = await askQuestion('Describe brevemente tu proyecto (qué hace, quién lo usa): ');
  
  if (!projectIdea.trim()) {
    console.log('❌ Necesitas dar una descripción para continuar.');
    return;
  }

  try {
    const blueprintJsonString = await generateBlueprint(projectIdea);
    
    // Guardamos el blueprint
    const filePath = path.join(process.cwd(), 'blueprint.json');
    fs.writeFileSync(filePath, blueprintJsonString);
    
    console.log(`\n✅ Blueprint generado y guardado en: ${filePath}`);
    console.log('👉 Siguiente paso: Ejecuta "devengine generate" para que el Coder cree los archivos.');
  } catch (error) {
    console.error('Error en el proceso de inicialización.');
  }
}

async function main() {
  if (command === 'inject') {
    console.log('🚀 Iniciando inyector local...');
    const injectorPath = path.join(__dirname, 'injector', 'index.ts');
    const result = spawnSync('npx', ['tsx', injectorPath], { stdio: 'inherit' });
    process.exit(result.status ?? 1);
  } else if (command === 'init') {
    await runInit();
  } else {
    console.log(`
  DevEngine AI - CLI v0.1.0
  Uso:
    devengine init      - Entrevista con el Agente Arquitecto (Genera blueprint.json).
    devengine inject    - Lee .env.example e inyecta las llaves locales.
    `);
  }
}

main();
