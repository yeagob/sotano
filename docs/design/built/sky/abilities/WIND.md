# Wind (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

A gust: three lanes on the floor, shown first, then a steady push along them for as long as the gust blows. It moves the player without touching them.

Status: built (H0). The numbers are provisional; the deities use it through their attacks ([guardians](../guardians/README.md)); what is not built is in [not-built](../../../not-built/sky/abilities/WIND.md).

## What the player sees and feels

- **The warning.** For the full warning (never shorter than 0.8 s) three dashed lanes lie on the floor in the sky's dark leaf: the gust's centre line from its source to its far end, and one lane either side of it.
- **The gust.** The lanes turn solid in the leaf's outline tone, at twice the size, for the gust's length. While the player stands in the gust, a steady push takes them along the line; the push is laid over their own motion and fades with it, as every push does.
- **The end.** When the gust's length is over, the lanes are gone and the push stops.

The whistle, the rising leaves and the dust streaks of the proposal are not built: the deities are built, but their sounds are silent and no streaks are drawn.

## The rule

1. A gust has one direction and one length, shown on its lanes before it blows.
2. The push acts while the player's body is within the gust's radius of its line, from the source to the far end, and only then.
3. A solid block between the source and the player shelters them: no push. A block the player built counts, and stays.
4. The gust never damages, and it never freezes the player: they keep their own motion, and the push is added to it.

## How the player answers it

- **Build a wall.** A block between the source and the player in the gust's line stops the push, and the wall stays.
- **A positive shot at the source.** A warm positive touch within three blocks of the source ends the gust: during the warning it never blows, and while it blows it stops at once.

Code: `src/sky/hindrances/wind.ts` (with `runner.ts` and `effects.ts`).
