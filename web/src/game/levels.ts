import type { Puzzle } from './sim';
import DATA from './ledgers.json';

export type Level = Puzzle & { id: string; name: string; chapter: number; hint?: string; answer: number[]; lean: number };
export const CHAPTERS = [
  { name: 'Herbal', short: 'Herbal', blurb: 'Three-ingredient tisanes. A gold seal: right ingredient, right place. Silver: right ingredient, wrong place.' },
  { name: 'Tinctures', short: 'Tinctures', blurb: 'Four slots and more jars on the shelf. No ingredient appears twice.' },
  { name: 'Elixirs', short: 'Elixirs', blurb: 'Old elixirs may use the same ingredient twice or more. Read every line.' },
];
const NAMES: [string, string?][] = [
  ['Calming Tisane', 'Each line of the ledger is an earlier brew. Gold seals count ingredients in the right slot; silver, right ingredient in the wrong slot.'],
  ['Sleeping Draught', 'Tap a slot, then a jar to fill it. Hold a jar to strike it out when you know it isn’t in the recipe.'],
  ['Morning Tonic'], ['Throat Balm'], ['Clear Mind'], ['Sweet Dreams'], ['Bright Eyes'], ['Warm Hearth'],
  ['Courage Tincture', 'Four slots now, and still no ingredient used twice.'], ['Luck Drops'], ['Silver Tongue'], ['Lantern Oil'], ['Fox’s Cunning'], ['Swift Feet'], ['Owl’s Sight'], ['Kind Heart'],
  ['Elixir of Dawn', 'Elixirs may repeat an ingredient. A seal is earned only once per ingredient used.'], ['Starlight Water'], ['Dragon’s Breath'], ['Mermaid Song'], ['Phoenix Ash'], ['Moon Milk'], ['Giant’s Strength'], ['Philosopher’s Dew'],
];
type D = Puzzle & { answer: number[]; lean: number };
const DD = DATA as unknown as Record<string, D>;
/** Within each chapter, ledgers come in order of size, then of how much their lines lean on each other. */
const ORDER = ['a', 'b', 'c'].flatMap((c) => Object.keys(DD).filter((k) => k[0] === c).sort((a, b) => DD[a].slots * 10 + DD[a].kinds - (DD[b].slots * 10 + DD[b].kinds) || DD[a].ledger.length - DD[b].ledger.length || DD[b].lean - DD[a].lean));
export const LEVELS: Level[] = ORDER.map((id, i) => ({ ...DD[id], id, name: NAMES[i][0], hint: NAMES[i][1], chapter: Math.floor(i / 8) }));
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
