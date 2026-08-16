/**
 * Build face for dsh-library: one host bundle (`src/index.ts` → `lib/index.js`).
 * The plugin is host-only — no browser half, no client bundle.
 *
 * The only runtime imports are `node:` builtins and `@deepseek-ai/*` peers
 * (cordis/schemastery/dsh-*), which tsdown externalizes, plus zod — the one
 * non-peer runtime dependency, deliberately inlined so the host bundle stays
 * self-contained when a profile resolves the package outside pnpm's tree
 * (the shared profiles/node_modules fallback carries no dependency set).
 * THIRD_PARTY_NOTICES.md records both zod and the ported upstream modules.
 */

import { defineConfig } from 'tsdown'

/** Plugin id: the cordis.yml bare row id and the stamped bundle entry name must match. */
const PLUGIN_ID = 'dsh-library'

export default defineConfig({
  name: PLUGIN_ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: false,
  // ESM output under a "type": "module" package must land on .js, not .mjs.
  fixedExtension: false,
  deps: {
    // zod is the only non-peer runtime dependency: bundling it keeps the host
    // half self-contained (see the module doc). Everything else stays external.
    onlyBundle: ['zod'],
    alwaysBundle: ['zod'],
    neverBundle: [/^node:/],
  },
})
