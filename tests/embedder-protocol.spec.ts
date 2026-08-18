/**
 * External-embedder protocol adversarial suite (U6): a REAL local subprocess
 * runtime drives a scripted fake embedder through the JSONL wire protocol.
 * Every requested index must be answered exactly once — a missing index, an
 * unsolicited index, a malformed line, and a stalled process must each fail
 * the batch closed (misconfiguration surfaces, retrieval never silently
 * degrades). No network, no real embedder model.
 * @module dsh-library/test/embedder-protocol.spec
 */

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { embedWithCommand } from '../src/embedding.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = join(repositoryRoot, 'tests', 'fixtures', 'fake-embedder.mjs')
const TEXTS = ['alpha', 'beta', 'gamma']
const DIMS = 8

async function withRuntime<T>(run: (subprocess: LocalSubprocessRuntime) => Promise<T>): Promise<T> {
  const ctx = new Context()
  try {
    await ctx.plugin(LocalSubprocessRuntime)
    return await run(ctx.subprocess as LocalSubprocessRuntime)
  } finally {
    await ctx.fiber.dispose()
  }
}

function caps(timeoutMs: number) {
  return { timeoutMs, graceMs: 200, maxOutputBytes: 1024 * 1024 }
}

describe('external embedder protocol', () => {
  it('returns one vector per text when the embedder answers every index', async () => {
    const vectors = await withRuntime(subprocess =>
      embedWithCommand(subprocess, [process.execPath, fixture, 'complete', String(DIMS)], repositoryRoot, TEXTS, DIMS, caps(10_000)))
    expect(vectors).toHaveLength(TEXTS.length)
    for (const vector of vectors) expect(vector).toHaveLength(DIMS)
  })

  it('fails the batch closed when the embedder skips a requested index', async () => {
    const outcome = await withRuntime(subprocess =>
      embedWithCommand(subprocess, [process.execPath, fixture, 'missing', String(DIMS)], repositoryRoot, TEXTS, DIMS, caps(10_000))
        .catch((error: unknown) => error as Error))
    expect(outcome).toBeInstanceOf(Error)
    expect((outcome as Error).message).toMatch(/answered 2 of 3 indices; missing: 1/u)
  })

  it('fails the batch closed when the embedder answers an unsolicited index', async () => {
    const outcome = await withRuntime(subprocess =>
      embedWithCommand(subprocess, [process.execPath, fixture, 'extra', String(DIMS)], repositoryRoot, TEXTS, DIMS, caps(10_000))
        .catch((error: unknown) => error as Error))
    expect(outcome).toBeInstanceOf(Error)
    expect((outcome as Error).message).toMatch(/answered 4 of 3 indices/u)
  })

  it('fails the batch closed on malformed embedder output', async () => {
    const outcome = await withRuntime(subprocess =>
      embedWithCommand(subprocess, [process.execPath, fixture, 'malformed', String(DIMS)], repositoryRoot, TEXTS, DIMS, caps(10_000))
        .catch((error: unknown) => error as Error))
    expect(outcome).toBeInstanceOf(Error)
    expect((outcome as Error).message).toMatch(/malformed/u)
  })

  it('aborts a stalled embedder at the configured timeout', async () => {
    const outcome = await withRuntime(subprocess =>
      embedWithCommand(subprocess, [process.execPath, fixture, 'hang', String(DIMS)], repositoryRoot, TEXTS, DIMS, caps(500))
        .catch((error: unknown) => error as Error))
    expect(outcome).toBeInstanceOf(Error)
    expect((outcome as Error).message).toMatch(/exited abnormally/u)
  }, 15_000)
})
