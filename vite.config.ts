import { defineConfig } from 'vite';
import shebang from 'rollup-plugin-add-shebang';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'lib',
      target: 'es2020',
      lib: {
        entry: ['src/index.ts', 'src/cli.ts'],
        formats: ['es'],
        fileName: (format, entryName) => `${entryName}.js`,
      },
      rollupOptions: {
        external: [
          'fs',
          'fs/promises',
          'path',
          'openai'
        ],
        plugins: [
          shebang({
            shebang: '#!/usr/bin/env node',
            include: ['./lib/cli.js']
          })
        ]
      }
    }
  };
});
