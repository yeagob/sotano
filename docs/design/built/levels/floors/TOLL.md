# The way down and the toll

Up: [floors](README.md) · Status: built.

Every floor's boss room holds the way down: a hole in its floor that leads to the next floor's start room. The hole is shut until you pay its toll. Floors 0 to 4 ask for things from your hands and your pockets; floors 5 to 8 ask for practices. The way down from floor 9 is free, into silence.

## What the toll asks

| Floor | Asks for | Count |
|---|---|---|
| 0 | things: a block or a monster part from your hand, a key, a bomb or a heart | 1 |
| 1 | things | 2 |
| 2 | things | 3 |
| 3 | things | 4 |
| 4 | things | 5 |
| 5 | practices, held items | 1 |
| 6 | practices | 2 |
| 7 | practices | 3 |
| 8 | practices | 4 |
| 9 | none: the hole drops into silence | 0 |

On floors 0 to 4 the things you may give are a block or a monster part in your hand, a key, a bomb, or a heart. A monster part is one of the four kinds a projection leaves (flesh, heart, mind or essence, see [PARTS](../../projections/PARTS.md)); it is given away like a block. On floors 5 to 8 only practices you carry are accepted.

The hearts are listed one by one, each with its own tile: every base heart that holds health (a part-filled one shows its quarters), then every bonus heart by its type (blue, stone, berserker). You choose exactly the number the floor asks, and each tile once. The window says what the choice costs before you pay: the bonus hearts given, the base hearts given, and the health and capacity left. Paying opens the hole at once, and a particle burst marks the place. Staying spends nothing.

## What a heart costs

- **A base heart** takes one heart of capacity and the health it holds. A part-filled base heart gives its own part, never a whole heart and never rounded. You cannot give the last base heart container, and some health must stay: a payment that would leave you with none is refused.
- **A bonus heart** (blue, stone, berserker) goes whole, with whatever it still holds. It never takes base health or base capacity.
- The capacity a base heart gives up lasts for the run; a new run starts with the full capacity again.

## The owner's line

The owner's text said that from the sixth level practices start, and gave a number of things per level. The build reads "the sixth" as floor 5, so practices start on floor 5 and the count rises from one there. The sentence "on the fifth, one practice" would move that to floor 4. That is open: see [TOLL-OPEN](../../../not-built/levels/TOLL-OPEN.md).

## Other rules

- A practice paid as the toll is lost: the player gives it up.
- A paid heart is a payment, not a hit: no halving, no invulnerability, and a toll never kills.
- Digging down is the other way, and it gets harder from floor 5: the rock under floors 5 to 8 holds lava ([LAVA-BELOW](LAVA-BELOW.md)).

Code: `src/content/levels.ts` (the toll by floor: the count and whether it asks for practices), `src/game/game.ts` (`payToll`: the payment, the capacity given up, the hole opening), `src/game/toll.ts` (the window's tiles and the heart plan: what a choice takes, or why it is refused), `src/game/hud.ts` (the window and its cost line). Tests: `tests/toll.test.ts`, `tests/toll-hearts.test.ts`.
