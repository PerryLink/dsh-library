/**
 * Shared test harness: REAL Cordis `Context`, REAL `SessionStore`/`Session`,
 * REAL `ToolRuntime`, REAL `Commands`, REAL storage stack (JSON backend +
 * storage domain), and a REAL local filesystem over a mkdtemp sandbox — the
 * plugin's index, tools, command, and injection path run for real.
 * @module dsh-library/test/harness
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import LocalFileSystem from '@deepseek-ai/dsh-fs-local'
import { CallId, MessageId } from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId, type Session } from '@deepseek-ai/dsh-session'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'

/** Everything a mounted harness hands back to a test. */
export interface Harness {
  readonly ctx: Context
  readonly session: Session
  readonly agent: Agent
  readonly sandbox: string
}

let harnessCounter = 0

/** Build a structurally complete fake agent over a real session. */
function makeAgent(session: Session): Agent {
  const fake = {
    id: session.id,
    options: {},
    session,
    inbox: {},
    status: 'idle',
    ctx: new Context(),
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task: (signal: AbortSignal) => Promise<unknown>) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  }
  return fake as unknown as Agent
}

/** Mount the whole real stack plus this plugin in one sandbox. */
export async function mountHarness(config: Record<string, unknown> = {}): Promise<Harness> {
  harnessCounter += 1
  const sandbox = mkdtempSync(path.join(tmpdir(), 'dsh-library-harness-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson as unknown as import('@deepseek-ai/cordis').Plugin, { root: sandbox })
  await ctx.plugin(StorageDomain as unknown as import('@deepseek-ai/cordis').Plugin, { backend: 'json' })
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(LocalFileSystem, { cwd: sandbox })
  await ctx.plugin(SessionStore)
  const session = ctx.sessions.create(SessionId(`dsh-library-harness-${harnessCounter}`))
  session.append('turn/start', { turn: 1 })
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined } as never)
  await ctx.plugin(ToolRuntime)

  const plugin = await import('../src/index.ts')
  await ctx.plugin(plugin as unknown as import('@deepseek-ai/cordis').Plugin, config)

  const agent = makeAgent(session)
  return { ctx, session, agent, sandbox }
}

/** Dispose a harness and remove its sandbox (its own mkdtemp dir only). */
export async function unmountHarness(harness: Harness): Promise<void> {
  rmSync(harness.sandbox, { recursive: true, force: true })
}

let callCounter = 0

/** Execute one tool through the real registry pipeline. */
export async function callTool(harness: Harness, name: string, args: unknown): Promise<ToolExecutionResult> {
  callCounter += 1
  return harness.ctx.tools.execute({
    callId: CallId(`library-spec-${callCounter}`),
    name,
    arguments: args,
    agent: harness.agent,
    signal: new AbortController().signal,
  })
}

/** The MessageId brand factory for injection assertions. */
export { MessageId }
