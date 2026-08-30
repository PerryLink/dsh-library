import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'forks',
    // windows-latest + Node 24 under v8 coverage instrumentation pushes the
    // real-stack robustness tests past vitest's 5s default (main CI red).
    testTimeout: 30_000,
  },
})
