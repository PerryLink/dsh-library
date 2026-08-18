// tests/fixtures/fake-embedder.mjs — scripted external embedder for the
// adversarial protocol suite. Reads the JSONL request batch from stdin and
// answers per the mode in argv[2]:
//   complete  — every requested index exactly once (positive control)
//   missing   — answers all but index 1 (incomplete batch must fail closed)
//   extra     — every index plus one unsolicited index 999 (size mismatch)
//   malformed — one non-JSON line and no answer for index 1
//   hang      — never answers and never exits (timeout/terminate path)
// Vector length comes from argv[3] (default 256).
import { readFileSync } from 'node:fs'

const mode = process.argv[2] ?? 'complete'
const dims = Number(process.argv[3] ?? 256)

if (mode === 'hang') {
  setInterval(() => {}, 60_000)
} else {
  const input = readFileSync(0, 'utf8')
  const requests = input.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line))
  const vector = Array.from({ length: dims }, (_, i) => (i === 0 ? 1 : 0))
  const answer = index => JSON.stringify({ index, vector })

  if (mode === 'malformed') process.stdout.write('this is not json\n')
  for (const request of requests) {
    if ((mode === 'missing' || mode === 'malformed') && request.index === 1) continue
    process.stdout.write(`${answer(request.index)}\n`)
  }
  if (mode === 'extra') process.stdout.write(`${answer(999)}\n`)
}
