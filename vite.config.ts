import { defineConfig } from 'vite';

// Relative base so the build works under https://<user>.github.io/<repo>/
export default defineConfig({
  base: './',
  // Phaser alone is ~1.4 MB minified; one chunk is fine for this game.
  build: { chunkSizeWarningLimit: 2000 },
});
