# Water currents (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

Water fills a channel bed from its head and carries the player along it.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/WATER-CURRENTS.md).

## What the player sees and feels

- **The warning.** Motes run down the bed from its head for the full warning.
- **The current.** The bed's free cells fill with water from the head down, stopping at the first cell that is not free: **a placed block is a dam**, and the bed below it stays dry. A player whose feet are in the water is pushed along the bed toward its next cell. Nobody drowns: water takes no health in the sky.
- **The end.** When the time is up the hindrance dries every cell it filled. Water the element simulation spread from those cells drains as water does.

## How the player answers it

- **Step up onto a bank**, jump across, or **dam the bed** above you.
- **A positive shot within one and a half blocks of the head** dries the water and stops it filling again for 3 s; the current still ends on time.

## Who uses it

The elephant's Trunk spray (6 s). The floor's own channels are not built yet, so the elephant's bed is a stand-in along the terrace ([ELEPHANT](../guardians/ELEPHANT.md)).

Code: `src/sky/hindrances/water-currents.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
