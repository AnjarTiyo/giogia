import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  async onSuccess() {
    const { execSync } = await import('node:child_process')
    execSync('chmod +x dist/index.js')
  },
})
