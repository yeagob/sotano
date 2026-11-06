# Paralysis (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

A ring spreads from the animal; a grounded player it passes is held for a moment.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/PARALYSIS.md).

## What the player sees and feels

- **The warning.** The ring's full reach is drawn on the floor in the sky's dust tint for the full warning.
- **The ring.** When the warning ends the ring grows at its speed out to its reach. A player on the ground within a block of its height is **held** once, when the band passes them: they cannot walk, and can still look, aim and shoot. A player in the air lets it pass.
- The colour is the sky's own, never the attack red: nothing in the sky hurts.

## How the player answers it

- **Jump as it passes.**
- **Hold the aim on the source** for half a second of the warning: the reach is halved and redrawn (the lion's "facing the roar").
- **A positive shot within three blocks of the source** halves the hold.

## Who uses it

The lion's Roar (8 blocks a second out to 12, a hold of 1.5 s).

Code: `src/sky/hindrances/paralysis.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
