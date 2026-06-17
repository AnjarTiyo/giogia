import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  async onSuccess() {
    const { execSync } = await import('node:child_process')
    execSync('chmod +x dist/index.js')
  },
})
