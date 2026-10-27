#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'inject') {
  console.log('🚀 Iniciando inyector local...');
  // Ejecuta el script del inyector usando tsx para soporte directo de TS
  const injectorPath = path.join(__dirname, 'injector', 'index.ts');
  const result = spawnSync('npx', ['tsx', injectorPath], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
} else if (command === 'init') {
  console.log('⏳ El comando "init" estará disponible en la próxima fase (Agentes IA).');
} else {
  console.log(`
  DevEngine AI - CLI v0.1.0
  Uso:
    devengine init      - (Próximamente) Entrevista con el Agente Arquitecto.
    devengine inject    - Lee .env.example e inyecta las llaves locales de forma segura.
  `);
}
