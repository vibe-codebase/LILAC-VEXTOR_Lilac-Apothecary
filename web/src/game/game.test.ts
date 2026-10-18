import { describe, expect, it } from 'vitest';
import { all, candidates, conflict, fits, possible, seals, starsFor } from './sim';
import { CHAPTERS, LEVELS, levelIndex } from './levels';
import { INGREDIENTS } from './art';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

describe('seals', () => {
  it('count gold and silver like the old ledgers', () => {
    expect(seals([0, 1, 2], [0, 1, 2])).toEqual({ gold: 3, silver: 0 });
    expect(seals([0, 1, 2], [2, 0, 1])).toEqual({ gold: 0, silver: 3 });
    expect(seals([0, 1, 2], [0, 2, 4])).toEqual({ gold: 1, silver: 1 });
    expect(seals([3, 3, 1, 2], [3, 1, 3, 3])).toEqual({ gold: 1, silver: 2 }); // a repeated ingredient earns once per use
  });
  it('enumerate recipes with and without repeats', () => { expect(all({ slots: 3, kinds: 5, repeats: false })).toHaveLength(60); expect(all({ slots: 4, kinds: 6, repeats: true })).toHaveLength(1296); });
  it('find the first ledger line a wrong recipe breaks', () => {
    const p = { slots: 3, kinds: 5, repeats: false, ledger: [{ guess: [0, 1, 2], gold: 1, silver: 0 }, { guess: [3, 4, 0], gold: 0, silver: 1 }] };
    expect(fits([0, 3, 4], p.ledger[0])).toBe(true);
    expect(conflict(p, [0, 1, 4])).toEqual({ line: 0, gold: 2, silver: 0 });
    expect(possible({ ...p, ledger: [p.ledger[0]] })).toHaveLength(3); expect(possible({ ...p, ledger: [p.ledger[0]] })[0]).toContain(0);
  });
  it('stars', () => { expect(starsFor(0, 0)).toBe(3); expect(starsFor(1, 0)).toBe(2); expect(starsFor(0, 1)).toBe(2); expect(starsFor(1, 1)).toBe(1); });
});

describe('ledger', () => {
  it('has 24 recipes in three chapters of eight, with unique ids and names', () => {
    expect(LEVELS).toHaveLength(24); expect(CHAPTERS).toHaveLength(3);
    for (let c = 0; c < 3; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24); expect(new Set(LEVELS.map((l) => l.name)).size).toBe(24);
    expect(levelIndex(LEVELS[9].id)).toBe(9);
  });
  it('three slots, then four; repeats only in elixirs; never more jars than the shelf holds', () => {
    LEVELS.forEach((l) => { expect(l.slots).toBe(l.chapter === 0 ? 3 : 4); expect(l.repeats).toBe(l.chapter === 2); expect(l.kinds).toBeLessThanOrEqual(INGREDIENTS.length); });
  });
});

describe('every recipe', () => {
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: exactly one recipe fits, it is the answer, every line is needed`, () => {
      const c = candidates(l);
      expect(c).toHaveLength(1); expect(c[0]).toEqual(l.answer);
      l.ledger.forEach((b, i) => { expect(fits(l.answer, b)).toBe(true); expect(b.guess).not.toEqual(l.answer); expect(candidates({ ...l, ledger: l.ledger.filter((_, j) => j !== i) }).length).toBeGreaterThan(1); });
      expect(l.ledger.length).toBeLessThanOrEqual(7);
      if (!l.repeats) expect(new Set(l.answer).size).toBe(l.slots);
    });
  }
});

describe('save', () => {
  it('parses safely and records the best', () => {
    expect(parseSave(null)).toEqual(freshSave()); expect(parseSave('{bad')).toEqual(freshSave());
    let t = recordResult(freshSave(), LEVELS[0].id, 2, 1); t = recordResult(t, LEVELS[0].id, 3, 0);
    expect(t.stars[LEVELS[0].id]).toBe(3); expect(t.best[LEVELS[0].id]).toBe(0); expect(totalStars(t)).toBe(3);
  });
  it('unlocks in order', () => { const s = freshSave(); expect(isUnlocked(s, 1)).toBe(false); expect(isUnlocked(recordResult(s, LEVELS[0].id, 1, 2), 1)).toBe(true); });
});
