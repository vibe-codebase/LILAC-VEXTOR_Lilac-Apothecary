/**
 * Ledger generator. A secret recipe is chosen, then earlier brews are written into the ledger one by one (random
 * recipes, each scored against the secret) until only the secret agrees with every line. Lines that turn out to be
 * unnecessary are then struck, so every line matters. The candidate whose lines lean on each other most (dropping
 * any one line lets in the most other recipes) is kept.
 * Run: npx esbuild tools/gen.ts --bundle --platform=node --format=esm --outfile=tools/.gen.mjs && node tools/.gen.mjs
 */
import fs from 'node:fs';
import { all, candidates, seals, type Brew, type Puzzle } from '../src/game/sim';

type T = { id: string; slots: number; kinds: number; repeats: boolean; lines: [number, number]; seed: number };
const tpl = (c: string, rows: [number, number, boolean, number, number][]) => rows.map(([slots, kinds, repeats, lo, hi], i): T => ({ id: `${c}${i + 1}`, slots, kinds, repeats, lines: [lo, hi], seed: c.charCodeAt(0) * 100 + i }));
const TEMPLATES = [
  ...tpl('a', [[3, 5, false, 2, 3], [3, 5, false, 3, 3], [3, 5, false, 3, 4], [3, 6, false, 3, 4], [3, 6, false, 3, 4], [3, 6, false, 4, 4], [3, 6, false, 4, 5], [3, 6, false, 4, 5]]),
  ...tpl('b', [[4, 6, false, 3, 4], [4, 6, false, 4, 4], [4, 6, false, 4, 5], [4, 6, false, 4, 5], [4, 7, false, 4, 5], [4, 7, false, 5, 5], [4, 7, false, 5, 6], [4, 7, false, 5, 6]]),
  ...tpl('c', [[4, 5, true, 4, 5], [4, 5, true, 4, 5], [4, 6, true, 5, 6], [4, 6, true, 5, 6], [4, 6, true, 5, 6], [4, 6, true, 5, 7], [4, 7, true, 5, 7], [4, 7, true, 6, 7]]),
];
function rng(seed: number) { let s = Math.imul(seed + 0x9e3779b9, 2654435761) >>> 0 || 1; for (let i = 0; i < 8; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; } return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function attempt(T: T, pool: number[][], rnd: () => number) {
  const secret = pool[Math.floor(rnd() * pool.length)];
  const ledger: Brew[] = [];
  let cands = pool;
  for (let guard = 0; cands.length > 1 && guard < 30; guard++) {
    // a brew that splits the remaining recipes reasonably, never the secret itself
    let best: Brew | null = null, bestLeft = Infinity;
    for (let k = 0; k < 6; k++) {
      const g = pool[Math.floor(rnd() * pool.length)]; if (g.every((x, i) => x === secret[i])) continue;
      const s = seals(secret, g), b = { guess: g, ...s }, left = cands.filter((r) => { const t = seals(r, g); return t.gold === s.gold && t.silver === s.silver; }).length;
      if (left < cands.length && (left < bestLeft || rnd() < 0.25)) { best = b; bestLeft = left; }
    }
    if (!best) continue;
    ledger.push(best);
    cands = cands.filter((r) => { const t = seals(r, best!.guess); return t.gold === best!.gold && t.silver === best!.silver; });
  }
  if (cands.length !== 1) return null;
  // strike unnecessary lines
  for (let i = ledger.length - 1; i >= 0; i--) { const trial = ledger.filter((_, j) => j !== i); if (candidates({ ...T, ledger: trial }).length === 1) ledger.splice(i, 1); }
  // how much the lines lean on each other
  const lean = ledger.reduce((a, _, i) => a + candidates({ ...T, ledger: ledger.filter((_, j) => j !== i) }).length, 0) / ledger.length;
  return { secret, ledger, lean };
}

const out: Record<string, unknown> = {};
for (const T of TEMPLATES) {
  const rnd = rng(T.seed * 7919), pool = all(T);
  let best: { secret: number[]; ledger: Brew[]; lean: number } | null = null;
  for (let a = 0, found = 0; a < 4000 && found < 120; a++) {
    const r = attempt(T, pool, rnd); if (!r) continue;
    if (r.ledger.length < T.lines[0] || r.ledger.length > T.lines[1]) continue;
    if (r.ledger.filter((b) => b.gold + b.silver === 0).length > 1) continue; // at most one empty brew
    found++;
    if (!best || r.lean > best.lean) best = r;
  }
  if (!best) throw new Error(`no ledger for ${T.id}`);
  const p: Puzzle = { slots: T.slots, kinds: T.kinds, repeats: T.repeats, ledger: best.ledger };
  out[T.id] = { ...p, answer: best.secret, lean: Math.round(best.lean * 100) / 100 };
  console.log(T.id, `${T.slots} slots, ${T.kinds} kinds${T.repeats ? ', repeats' : ''}`, 'lines', best.ledger.length, 'lean', best.lean.toFixed(1), 'check', candidates(p).length);
}
fs.writeFileSync(new URL('../src/game/ledgers.json', import.meta.url), JSON.stringify(out));
