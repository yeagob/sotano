# Opening holes (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

Cells of the floor crack, then open for a few seconds, then return.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/OPENING-HOLES.md).

## What the player sees and feels

- **The warning.** For the full warning (never shorter than 0.8 s) each cell that may open shows a crack: the crack overlay of a block a third broken, with dust motes. Only the sky's own cells crack: never a placed block, never a cell an ally holds, never air.
- **The opening.** When the warning ends, the cracked cells that are left turn to air for the hindrance's length (no loose cube falls). A player standing on them drops to what is below; falls never hurt in the sky.
- **The return.** When the time is up every cell comes back, and every crack returns to the damage it had before.

## How the player answers it

- **Step off the crack** before the warning ends.
- **A positive shot at a cracked cell** (its block, or within one block of its centre) closes it: that cell never opens.

## Who uses it

The panda's Sit-down (one or two cells of a column top, for 4 s).

Code: `src/sky/hindrances/opening-holes.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
