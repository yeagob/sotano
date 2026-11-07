# Nothing stays broken (law 3.1, built)

Up: [The laws of the sky (built)](README.md)

A block of the sky's own world that the player breaks comes back.

## What the player sees and feels

- The player can break any breakable block of the sky's world, with the same verbs as below. The trunk wall, the slabs between the halls and the membranes over the ways up are heartwood and do not break.
- Four seconds after the break the empty cell **shimmers**: pale motes, with the block's ghost in the crack overlay. The rising chime is named but silent: the sky's core sounds are not synthesised yet.
- At five seconds the block returns, if its cell is free. A cell with the player, a sky creature, a loose cube or a placed block in it waits, and is checked again four times a second until it is free.
- **A broken sky block drops no loose cube** (provisional, owner to confirm): with regrowth every block would be an endless quarry. Loose cubes come from the nests ([NESTS](NESTS.md)) and from what the hand carries.

## The rule

The sky never keeps a hole the player made in its world (owner). Only the player's own blocks can go for good ([PLAYER-BLOCKS](PLAYER-BLOCKS.md)).

Code: `src/sky/laws/regrowth.ts` (`REGROW` 5 s, `SHIMMER` 1 s, `REGROW_RETRY` 0.25 s); tests in `tests/sky-laws.test.ts`.
