/**
 * Apothecary: a recipe is a row of ingredients, one per slot. The old ledger records earlier brews of the same
 * potion and how close each came: a gold seal for every ingredient in the right slot, a silver seal for every
 * other ingredient that belongs in the recipe but sat in the wrong slot. Exactly one recipe agrees with every line
 * of the ledger; find it and brew it. Ingredients are numbered 0..k-1.
 */
export type Brew = { guess: number[]; gold: number; silver: number };
export type Puzzle = { slots: number; kinds: number; repeats: boolean; ledger: Brew[] };

/** The seals a guess earns against the true recipe. */
export function seals(answer: number[], guess: number[]) {
  let gold = 0; const a = new Map<number, number>(), b = new Map<number, number>();
  answer.forEach((x, i) => { if (guess[i] === x) gold++; a.set(x, (a.get(x) ?? 0) + 1); });
  guess.forEach((x) => b.set(x, (b.get(x) ?? 0) + 1));
  let common = 0; for (const [x, n] of a) common += Math.min(n, b.get(x) ?? 0);
  return { gold, silver: common - gold };
}
/** Every recipe the rules allow. */
export function all(p: { slots: number; kinds: number; repeats: boolean }) {
  const out: number[][] = [], cur: number[] = [];
  const go = (i: number) => {
    if (i === p.slots) { out.push(cur.slice()); return; }
    for (let x = 0; x < p.kinds; x++) { if (!p.repeats && cur.includes(x)) continue; cur.push(x); go(i + 1); cur.pop(); }
  };
  go(0);
  return out;
}
export function fits(r: number[], b: Brew) { const s = seals(r, b.guess); return s.gold === b.gold && s.silver === b.silver; }
/** Recipes that agree with every ledger line. */
export function candidates(p: Puzzle) { return all(p).filter((r) => p.ledger.every((b) => fits(r, b))); }
/** For a wrong recipe, the first ledger line it disagrees with and what that line would have shown. */
export function conflict(p: Puzzle, r: number[]) {
  for (let i = 0; i < p.ledger.length; i++) { const b = p.ledger[i], s = seals(r, b.guess); if (s.gold !== b.gold || s.silver !== b.silver) return { line: i, ...s }; }
  return null;
}
/**
 * What the ledger proves about each slot: the ingredients still possible there, given any slots already fixed by
 * the player's notes (fixed[i] >= 0) and ingredients struck out entirely.
 */
export function possible(p: Puzzle, fixed: number[] = [], struck: number[] = []) {
  const c = candidates(p).filter((r) => r.every((x, i) => (fixed[i] ?? -1) < 0 || fixed[i] === x) && !r.some((x) => struck.includes(x)));
  return Array.from({ length: p.slots }, (_, i) => [...new Set(c.map((r) => r[i]))].sort((a, b) => a - b));
}
/** Stars: three for a first brew without a hint, two with one wrong brew or one hint, else one. */
export function starsFor(wrong: number, hints: number) { const bad = wrong + hints; return bad === 0 ? 3 : bad === 1 ? 2 : 1; }
