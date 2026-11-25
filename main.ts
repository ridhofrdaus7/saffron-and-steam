// Ember & Ladle — Make the best cooking game entry (Node 22, standard library only).
// Copies game/ and screenshots/ to /output (or MAKEFUN_OUTPUT_DIR) and generates dossier.json.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

function ensureReadablePermissions(dirPath: string): void {
  try {
    chmodSync(dirPath, 0o755);
  } catch {}
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) {
      ensureReadablePermissions(fullPath);
    } else {
      try {
        chmodSync(fullPath, 0o644);
      } catch {}
    }
  }
}

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierOptions));
ensureReadablePermissions(outputDir);


