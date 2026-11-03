# Star heart

A gold heart with a five-pointed star outline: one heart back and thirty seconds untouchable.

Part of [kinds of heart](README.md).

## What the player sees and feels

- Taking it heals 100 and makes you invulnerable for 30 seconds. It can be taken at full health. It stores nothing.
- While it lasts, no damage is taken at all, the hearts glow gold, the edge of the screen glows softly, and a short original theme plays (a quiet triangle-wave arpeggio). When it ends, the theme stops with a falling chime and a toast.
- Taking another star while one is active resets the time to 30 seconds; it never adds up.
- The nod to a classic platformer's star is in the idea only: no sprites, music or sound from any other game.

## Numbers

- Heal: 100. Invulnerability: 30 seconds, reset (never stacked) by another star.

Code: `src/game/game.ts` (`collectHeart`, `updateHearts`, the damage pipeline), `src/audio/sfx.ts` (`starTheme`).
