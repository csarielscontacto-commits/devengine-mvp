import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const ENV_OUT = path.join(ROOT, '.env');
const META_DIR = path.join(ROOT, '.devengine');
const META_OUT = path.join(META_DIR, 'env-manifest.json');

// 1. Parsear .env.example
function parseExample(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró ${filePath}. Ejecuta "devengine init" primero.`);
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const entries: { key: string; description: string | null; isSensitive: boolean; isPublic: boolean }[] = [];
  let pendingComment: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# Ejemplo:')) continue;
    if (trimmed.startsWith('#')) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const isSensitive = /KEY|SECRET|TOKEN|PASSWORD|SERVICE_ROLE/i.test(key);
    const isPublic = key.startsWith('NEXT_PUBLIC_');
    entries.push({ key, description: pendingComment, isSensitive, isPublic });
    pendingComment = null;
  }
  return entries;
}

// 2. Prompt con input enmascarado (oculta las llaves en pantalla)
function askMasked(query: string): Promise<string> {
  return new Promise((resolve) => {
    const mutableOut = new Writable({
      write(chunk, enc, cb) {
        if (!(mutableOut as any).muted) process.stdout.write(chunk, enc);
        cb();
      },
    });
    (mutableOut as any).muted = false;

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableOut,
      terminal: true,
    });

    (mutableOut as any).muted = true;
    rl.question(query, (answer) => {
      (mutableOut as any).muted = false;
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    
    (rl as any)._writeToOutput = function (s: string) {
      if ((mutableOut as any).muted) mutableOut.write(s.includes('\n') ? s : '*');
      else mutableOut.write(s);
    };
  });
}

// 3. Escritura atómica con permisos 0600 (solo el usuario puede leer)
function writePrivate(filePath: string, content: string) {
  const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(tmp, content, { mode: 0o600 });
  fs.renameSync(tmp, filePath);
  try { fs.chmodSync(filePath, 0o600); } catch {}
}

// 4. Main
async function main() {
  console.log('\n🔐 DevEngine — Inyector local Zero-Trust\n');
  console.log('Este proceso corre 100% en tu máquina. Nada se envía por red.\n');

  const entries = parseExample(ENV_EXAMPLE);
  if (entries.length === 0) {
    console.log('⚠️  No hay variables declaradas en .env.example. Nada que hacer.');
    return;
  }

  const collected: Record<string, string> = {};
  const manifest = { generated_at: new Date().toISOString(), keys: [] as any[] };

  for (const entry of entries) {
    console.log(`\n📌 ${entry.key}`);
    if (entry.description) console.log(`   ${entry.description}`);
    if (entry.isPublic) console.log('   ℹ️  Esta variable es PÚBLICA (se expone al cliente).');

    const value = entry.isSensitive
      ? await askMasked('   Valor (no se mostrará): ')
      : await new Promise<string>((r) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question('   Valor: ', (ans) => { rl.close(); r(ans); });
        });

    if (!value.trim()) {
      console.log('   ⏭️  Omitida. Se dejará vacía.');
    }
    collected[entry.key] = value;
    manifest.keys.push({
      key: entry.key,
      filled: Boolean(value.trim()),
      sensitive: entry.isSensitive,
    });
  }

  // 5. Escribir .env
  const envContent =
    `# Generado por devengine inject — ${new Date().toISOString()}\n` +
    `# NUNCA comitees este archivo. Está en .gitignore.\n\n` +
    entries.map((e) => `${e.key}=${collected[e.key] ?? ''}`).join('\n') + '\n';

  if (fs.existsSync(ENV_OUT)) {
    const backup = `${ENV_OUT}.bak.${Date.now()}`;
    fs.copyFileSync(ENV_OUT, backup);
    console.log(`\n🗂️  Backup del .env anterior: ${path.basename(backup)}`);
  }
  writePrivate(ENV_OUT, envContent);

  // 6. Manifest sin secretos (auditoría)
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(META_OUT, JSON.stringify(manifest, null, 2));

  const filled = manifest.keys.filter((k) => k.filled).length;
  console.log(`\n✅ .env creado (${filled}/${entries.length} variables configuradas).`);
  console.log(`📄 Manifest de auditoría: ${path.relative(ROOT, META_OUT)}`);
  console.log('\n💡 Verifica .gitignore incluye ".env" antes de comitear.\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
