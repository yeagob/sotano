# Cube cage (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

Cubes rise round the player's cell and hold them in for a few seconds.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/CUBE-CAGE.md).

## What the player sees and feels

- **The warning.** The cage's cells are outlined one by one over the first three quarters of the warning, each with motes and a pop. The cage is the eight cells round the player's cell, two high, with no roof.
- **The cage.** When the warning ends, the outlined cells fill with cubes of cloud for the hindrance's length, leaving any cell the player's body is in. The cubes are the animal's, not the player's: they leave no loose cube and dissolve at the end.
- **Never over a drop.** With no solid ground under the centre cell the cage is not made.

## How the player answers it

- **Step out** before it closes.
- **Any positive shot at a cube**, or at an outlined cell, breaks it with a puff.

## Who uses it

The koala's Hug (4 s).

Code: `src/sky/hindrances/cube-cage.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
