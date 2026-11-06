# Block nests (built)

Up: [The laws of the sky (built)](README.md)

A nest is a hollow on a sky floor that holds three loose cubes of the floor's material and refills.

## What the player sees and feels

- Each floor's plan places its nests on fixed ground (never on a platform that fades). Each holds three loose cubes the player can pick up and place.
- A cube carried more than one and a half blocks from the nest's centre, or gone, counts as taken. Each taken cube is replaced after six seconds with a soft pop. A nest never holds more than three.
- Nests are how a player with no practices builds in the sky without breaking anything: broken sky blocks drop no cube ([REGROWTH](REGROWTH.md)). Totality has no nests.

Whether the owner wants nests, or blocks only from breaking the sky's world, is open ([guardians, not built](../../../not-built/sky/guardians/README.md#5-open-questions), question 8).

Code: `src/sky/laws/nests.ts` (`NEST_CUBES` 3, `NEST_REFILL` 6 s, `NEST_REACH` 1.5); tests in `tests/sky-laws.test.ts`.
