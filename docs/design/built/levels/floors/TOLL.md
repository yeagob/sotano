# The way down and the toll

Up: [floors](README.md) · Status: built.

Every floor's boss room holds the way down: a hole in its floor that leads to the next floor's start room. The hole is shut until you pay its toll. Floors 0 to 4 ask for things from your hands and your pockets; floors 5 to 8 ask for practices. The way down from floor 9 is free, into silence.

## What the toll asks

| Floor | Asks for | Count |
|---|---|---|
| 0 | things: a block from your hand, a key, a bomb or a heart | 1 |
| 1 | things | 2 |
| 2 | things | 3 |
| 3 | things | 4 |
| 4 | things | 5 |
| 5 | practices, held items | 1 |
| 6 | practices | 2 |
| 7 | practices | 3 |
| 8 | practices | 4 |
| 9 | none: the hole drops into silence | 0 |

On floors 0 to 4 the things you may give are a block in your hand, a key, a bomb, or a heart. A heart is a heart of damage: you lose it, and if you have no life left you die. On floors 5 to 8 only practices you carry are accepted.

The window lists what you carry. You choose exactly the number the floor asks, and each thing once. Paying opens the hole at once, and a particle burst marks the place.

## The owner's line

The owner's text said that from the sixth level practices start, and gave a number of things per level. The build reads "the sixth" as floor 5, so practices start on floor 5 and the count rises from one there. The sentence "on the fifth, one practice" would move that to floor 4. That is open: see [TOLL-OPEN](../../../not-built/levels/TOLL-OPEN.md).

## Other rules

- A practice paid as the toll is lost: the player gives it up.
- A paid heart goes through the damage rules, so a toll can kill.

Code: `src/content/levels.ts` (the toll by floor: the count and whether it asks for practices), `src/game/game.ts` (the payment window's rules, the hole opening, the damage of a paid heart).
