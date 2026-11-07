# Fading platforms (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

A platform, or chosen parts of it, turns to mist after a warning, is gone for a time, then returns.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/FADING-PLATFORMS.md).

## What the player sees and feels

- **The warning.** For the full warning the platform's cells turn to mist, grey and see-through, with a tick that speeds up as the warning ends (from every half second to every tenth of a second). The platform's whole outline still shows. The tick is named but silent: the sky's core sounds are not synthesised yet.
- **The fade.** When the warning ends the cells are gone for the hindrance's length; a player still on them falls to the ground or a lower platform, unhurt.
- **The return.** Then the cells come back, with a chime (named, silent for now).
- Cells an ally holds and placed blocks never fade. The floors' own routes are never tagged to fade.

## How the player answers it

- **Move off**, or build ahead: a placed block never fades.
- **A positive shot on the platform during the warning** holds it solid 2 s more before it fades; **on the faded platform** it brings it back at once for the rest of that run of the hindrance.

## Who uses it

The koala's Let-go (a thin branch, 4 s), the lion's Scrape (the ledge strip on its side, 3 s), the horse's Rear and stamp, Whinny wave and the floor's rhythm from the second phase.

Code: `src/sky/hindrances/fading-platforms.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
