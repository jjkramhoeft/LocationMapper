import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build works on GitHub Pages under /<repo>/ without hardcoding the repo name.
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
})
