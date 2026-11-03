# Blue heart

One more heart, drawn in blue after the containers, lost for good once it is spent.

Part of [kinds of heart](README.md).

## What the player sees and feels

- A heart like the red one, in blue. Walking into it adds one extra heart of 100 health after the containers, even at full health.
- Hits take it before the red health (the most recently picked up extra heart first).
- When it is spent it bursts, a toast says it is gone, and it never comes back: no heal refills it.

Code: `src/entities/hearts.ts` (`landHit`), `src/game/game.ts` (`collectHeart`, `heartLost`).
