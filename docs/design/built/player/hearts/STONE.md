# Stone heart

One more heart, grey stone with gold cracks, that halves every hit while it is the heart taking the blows.

Part of [kinds of heart](README.md).

## What the player sees and feels

- Walking into it adds one extra heart of 100 health, even at full health.
- While it is the heart a hit lands on (the most recently picked up extra heart), every hit is halved, rounded down: 30 becomes 15, 60 becomes 30, 100 becomes 50. There is no threshold: any hit is halved. A halved hit sounds like stone and throws grey chips.
- It is spent like any extra heart and lost for good; after that, hits land whole.
- A stone heart given to a toll is a payment, not a hit: it goes whole, with what it holds, and is never halved. See [TOLL](../../levels/floors/TOLL.md).

## Numbers

- Health: 100. Halving: half, rounded down to whole design health.

Code: `src/entities/hearts.ts` (`stoneHalve`, `landHit`).
