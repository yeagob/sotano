# Book of Secrets

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/bookofsecrets.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/mind/`. What the practice opens, the Recipe Book, is built and described in [built/practices/RECIPE-BOOK.md](../../built/practices/RECIPE-BOOK.md).

| | |
|---|---|
| Path | Mind (tags: mind, potion) |
| Quality | 1 of 4 |
| Found in | the Roots only: on the third extra pedestal from mastery level 30, every run (never drawn from a pool) |
| Inspired by | The Renaissance books of secrets (Alessio Piemontese, *Secreti*, 1555; public domain) |

## What it is

The books of secrets were the recipe books of their day: remedies, meals and small arts written down so they would not be lost. The practice is the same in life: write down what works for you, so you do not have to find it twice.

- **Description:** What you learn below is worth writing down. A book of secrets keeps the remedies, the meals and the small arts in one place, so nothing you found has to be found twice.
- **Effect:** Opens the Recipe Book (J, D-pad Down, or its tab in the menu): every potion and meal recipe, and what each presence takes.
- **Teaching:** "What is written down does not have to be found twice." Keep a small notebook of what works for you; when the hard day comes, you only have to open it.

## How it works

- It sets the `recipes` stat to 1 (a switch from 0 to 1). While it is 1 the menu shows the Recipes tab and the book's key opens it. Losing the practice (a toll) hides the tab again.
- **Positive outcome (sotano-items rule 15).** It only gives: knowledge of every recipe and offering. It changes no number of the world and costs nothing.
- **The Roots' gift.** Its only pool is `roots`: no chest, pedestal, presence or echo draws it, so adding it moved no seed. From mastery level 30 the Roots always lay it (REWARDS §4); the level's notice line is `mastery.gain.recipeBook`.
- It counts toward the mind state of being (Lucid) like any mind practice.
- No recipe yet for the crafting table (issue #112).

## Open questions

1. **The name.** Book of Secrets (*libro de los secretos*) names the Renaissance genre; the owner may prefer a plainer name (Recipe Book itself, or Commonplace Book).
2. **The key.** J was chosen because B (the owner's first idea) is the book download on the pause card and I is the inventory. Should B move?
3. **Spoilers.** The book shows every recipe and every presence that takes something, met or not. Should it show only what the player has met (like the codex)?
4. **Should it ever drop elsewhere** (a treasure room, below level 30), or stay a gift of the Roots only?
