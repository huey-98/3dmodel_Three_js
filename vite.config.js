import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const scenesDir = resolve(root, 'src/scenes');

function sceneInputs() {
  const input = { main: resolve(root, 'index.html') };
  if (!existsSync(scenesDir)) return input;
  for (const name of readdirSync(scenesDir)) {
    const html = resolve(scenesDir, name, 'index.html');
    if (existsSync(html)) input[name] = html;
  }
  return input;
}

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(root, 'src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: sceneInputs(),
    },
  },
});
