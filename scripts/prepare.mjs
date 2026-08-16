// Build entry for dsh-library: tsdown bundles the ESM runtime, tsc emits
// declarations into lib/types. tsdown's clean wipes lib/ first, so the
// order matters: bundle first, then declarations.
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
}

run('tsdown', [])
run('tsc', ['-p', 'tsconfig.build.json'])
