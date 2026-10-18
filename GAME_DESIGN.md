# Lilac Apothecary: design notes

**Pillars.** Code-breaking turned into a fair logic puzzle. The guesses are already made and recorded, so the whole challenge is deduction, with no luck and no running out of turns. The setting is cosy and old-world, and getting it right pays off with a glowing, bubbling flask.

**Rules.**
- A recipe is a sequence of `slots` ingredients from `kinds` types; repeats are allowed only in Elixirs.
- Seals for a ledger line: gold = positional matches; silver = Σ min(count in answer, count in guess) − gold.

**Generation (`tools/gen.ts`).**
- Pick a random secret, then add earlier brews one at a time. Each round samples six random recipes (never the secret) and keeps one that shrinks the candidate set, usually the one that shrinks it most, with occasional randomness.
- Continue until exactly one candidate remains, then delete every line not needed for uniqueness.
- Reject ledgers with more than one empty (0/0) line and ledgers outside the template's line range.
- Interlock score: the average number of candidates admitted when any single line is removed. Keep the candidate with the highest score among up to 120.

**Feedback on a wrong brew.** Show the first ledger line whose seals the brewed recipe contradicts, and what it would have shown, then flash that line. The ledger never gains new lines, so it stays a puzzle, not trial and error.

**Hints.** Fill the first empty or wrong dish with its answer and fix it. In no-repeat chapters, this takes that ingredient out of any other dish.

**Stars.** Wrong brews + hints: 0 = three stars, 1 = two, otherwise one.

**Accessibility.**
- Ingredients differ by shape, not just colour.
- Strike-outs act as on-board notes, and messages sit above the bottom bar, clear of the ledger.
- Reduced motion removes the flights, shakes, smoke and bubbles.
- Every control is 46 px+ and aria-labelled.
- Plays fully offline.
