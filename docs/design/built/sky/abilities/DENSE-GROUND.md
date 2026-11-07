# Dense ground (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

Cells of the floor turn dense, so walking on them is slow.

Status: built (wave 5). The numbers are provisional; what is not built is in [not-built](../../../not-built/sky/abilities/DENSE-GROUND.md).

## What the player sees and feels

- **The warning.** The chosen cells shimmer, every 0.4 s, for the full warning. No block changes.
- **The effect.** While it lasts, a player standing on a dense cell walks slower (half pace on every built use). The slow is refreshed each moment they stay, and ends a moment after they step off. Jumps keep their height.
- Placed blocks are never dense.

## How the player answers it

- **Walk round it, jump out of it, or build over it.**
- **A positive shot at a dense cell** returns it at once, during the warning or after.

## Who uses it

The panda's Heavy press, the koala's Scent mark, the elephant's Mud wallow, the lion's Long grass, the horse's Dust roll.

Code: `src/sky/hindrances/dense-ground.ts` (with `runner.ts` and `effects.ts`); tests in `tests/sky-engine.test.ts`.
