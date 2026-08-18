/**
 * Real Loader composition suite (community five-layer model, layers 4–5):
 * an independent process mounts the Loader over a cordis.yml with the real
 * harness service rows (session/system-prompt/tools/commands) plus the real
 * storage seam (dsh-storage + JSON backend + dsh-storage-domain), then the
 * plugin row with config. The plugin row points at the built `lib/index.js`,
 * so the suite also carries the plain-Node built entry smoke (A1). The two
 * negative regressions are also here: invalid config must fail loud for the
 * expected reason (U4), and a default export must fail with the missing-inject
 * reason (C2).
 * @module dsh-library/test/composition.spec
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runner = join(repositoryRoot, 'scripts', 'loader-runner.mjs')
const builtEntry = join(repositoryRoot, 'lib', 'index.js')

const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-library-loader-'))
const storageRoot = join(temporaryRoot, 'storage')

/** One cordis.yml: real harness + storage service rows, then the plugin row. */
function configFor(pluginRow: string, configLines: string[] = []): string {
  return [
    "- name: '@deepseek-ai/dsh-session'",
    "- name: '@deepseek-ai/dsh-system-prompt'",
    "- name: '@deepseek-ai/dsh-tools'",
    "- name: '@deepseek-ai/dsh-commands'",
    "- name: '@deepseek-ai/dsh-storage'",
    "- name: '@deepseek-ai/dsh-storage-json'",
    '  config:',
    `    root: ${JSON.stringify(storageRoot)}`,
    "- name: '@deepseek-ai/dsh-storage-domain'",
    '  config:',
    '    backend: json',
    `- name: ${JSON.stringify(pluginRow)}`,
    ...(configLines.length > 0 ? ['  config:', ...configLines.map(line => `    ${line}`)] : []),
    '',
  ].join('\n')
}

function runRunner(configPath: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runner, configPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env },
    timeout: 120_000,
  })
  if (result.error !== undefined) throw result.error
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

mkdirSync(storageRoot, { recursive: true })

beforeAll(() => {
  const build = spawnSync('pnpm', ['run', 'build'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env },
    timeout: 120_000,
  })
  if (build.status !== 0) {
    throw new Error(`build failed (${String(build.status)}):\n${build.stdout}\n${build.stderr}`)
  }
}, 120_000)

describe('Loader composition (built entry)', () => {
  it('mounts the plugin and serves /library through the real storage seam', () => {
    const configPath = join(temporaryRoot, 'valid.yml')
    writeFileSync(configPath, configFor(pathToFileURL(builtEntry).href))
    const evidence = runRunner(configPath)
    expect(evidence.status, `stdout:\n${evidence.stdout}\nstderr:\n${evidence.stderr}`).toBe(0)
    const marker = evidence.stdout.match(/DSH_LOADER_RESULT (.+)$/mu)
    expect(marker).not.toBeNull()
    const summary = JSON.parse(marker![1]!) as { tools: string[]; command: string }
    for (const name of ['library_add', 'library_remove', 'library_list', 'library_search', 'library_cite_check', 'library_diagnose']) {
      expect(summary.tools).toContain(name)
    }
    expect(summary.command).toContain('No documents indexed yet')
  })

  it('rejects invalid config through the Loader for the expected reason', () => {
    const entryUrl = pathToFileURL(builtEntry).href
    const cases = [
      { lines: ['chunkSize: 5000'], reason: /chunkSize|4000/u },
      { lines: ['chunkSize: 100', 'chunkOverlap: 100'], reason: /chunkOverlap|smaller/u },
      { lines: ['search:', '  hybridWeight: 5'], reason: /hybridWeight|0\.\.1/u },
    ]
    for (const entry of cases) {
      const configPath = join(temporaryRoot, 'invalid.yml')
      writeFileSync(configPath, configFor(entryUrl, entry.lines))
      const evidence = runRunner(configPath)
      expect(evidence.status, `invalid config unexpectedly mounted:\n${entry.lines.join('\n')}`).not.toBe(0)
      expect(evidence.stderr, `failed for the wrong reason:\n${evidence.stderr}`).toMatch(entry.reason)
    }
  })

  it('rejects a default export through the Loader with the missing-inject reason', () => {
    const wrapper = join(temporaryRoot, 'default-export.mjs')
    const builtUrl = pathToFileURL(builtEntry).href
    writeFileSync(wrapper, [
      `export { name, inject, Config, apply } from ${JSON.stringify(builtUrl)}`,
      `export { apply as default } from ${JSON.stringify(builtUrl)}`,
      '',
    ].join('\n'))
    const configPath = join(temporaryRoot, 'invalid-default.yml')
    writeFileSync(configPath, configFor(pathToFileURL(wrapper).href))
    const evidence = runRunner(configPath)
    expect(evidence.status).not.toBe(0)
    expect(evidence.stderr, `failed for the wrong reason:\n${evidence.stderr}`).toMatch(/without inject/u)
  })
})

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true })
})
