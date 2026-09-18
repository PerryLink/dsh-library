#!/usr/bin/env node
/**
 * Checkout freshness assertion for the alpha.2 ruler (tsconfig.json `paths`).
 *
 * The local `typecheck` ruler resolves @deepseek-ai/* through tsconfig paths
 * into a harness checkout whose `lib/types` is a BUILD ARTIFACT of its `src`.
 * If someone edits checkout `src` without rebuilding `lib/types`, tsc silently
 * resolves through the stale declarations — a false green. This script makes
 * that staleness loud:
 *
 *   - checkout absent      -> notice + exit 0 (the face is not verifiable on
 *                             this runner; CI runners have no harness clone)
 *   - checkout git-clean   -> fresh by definition -> exit 0
 *   - otherwise            -> per referenced package: newest src mtime must not
 *                             be newer than newest lib/types mtime; any stale
 *                             package -> print the list -> exit 1
 *
 * Exit 1 means: the alpha.2 face cannot be trusted; rebuild lib/types.
 */
import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tsconfig = JSON.parse(await readFile(join(repoRoot, 'tsconfig.json'), 'utf8'))
const paths = tsconfig.compilerOptions?.paths ?? {}

const checkoutRoot = resolve(repoRoot, '..', '..', '..', '..', 'deepseek-harness')

if (!existsSync(checkoutRoot)) {
  console.log('[freshness] harness checkout absent — alpha.2 face not verifiable on this runner; skipping')
  process.exit(0)
}

let clean = false
try {
  const out = execFileSync('git', ['-C', checkoutRoot, 'status', '--porcelain'], { stdio: 'pipe' })
  clean = out.toString('utf8').trim() === ''
} catch {
  clean = false
}
if (clean) {
  console.log('[freshness] harness checkout git-clean — alpha.2 face fresh by definition')
  process.exit(0)
}

const newest = (dir) => {
  if (!existsSync(dir)) return 0
  if (statSync(dir).isFile()) dir = dirname(dir)
  let max = 0
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else {
        try {
          const m = statSync(p).mtimeMs
          if (m > max) max = m
        } catch {}
      }
    }
  }
  walk(dir)
  return max
}

const stale = []
for (const targets of Object.values(paths)) {
  for (const target of targets) {
    if (typeof target !== 'string') continue
    const abs = resolve(repoRoot, target)
    if (!abs.startsWith(checkoutRoot + '\\') && !abs.startsWith(checkoutRoot + '/')) continue
    if (!existsSync(abs)) {
      stale.push(`${target} -> MISSING`)
      continue
    }
    // lib/types/<pkg> -> packages/<area>/<pkg>/src (the "lib/" strip of lib/types)
    const rel = abs.slice(checkoutRoot.length + 1).replace(/\\/g, '/')
    const m = rel.match(/^packages\/(.+)\/lib\/types\//)
    const srcDir = m ? join(checkoutRoot, 'packages', m[1], 'src') : null
    const libMax = newest(abs)
    const srcMax = srcDir ? newest(srcDir) : 0
    if (srcMax > libMax) {
      stale.push(`${target} -> lib ${new Date(libMax).toISOString()} < src ${new Date(srcMax).toISOString()}`)
    }
  }
}

if (stale.length > 0) {
  console.error('[freshness] STALE harness lib/types (rebuild before trusting the alpha.2 face):')
  for (const s of stale) console.error(`  ${s}`)
  process.exit(1)
}
console.log('[freshness] harness lib/types fresh against src (dirty checkout, mtime comparison)')
