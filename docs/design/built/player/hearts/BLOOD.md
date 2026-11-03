# Blood heart

A crimson heart that beats slowly. It stores nothing: taking it starts a slow healing (the name is a working title).

Part of [kinds of heart](README.md).

## What the player sees and feels

- The pickup beats slowly on the floor. At full health it stays there, like a red heart.
- Taking it starts the healing: 3 health per second into the containers, up to 200 in all (two hearts), for at most two minutes. While it heals, the red hearts in the HUD beat slowly.
- The healing ends early when the containers are full.
- Any hit that lands ends it at once, with a toast; it never resumes. Taking another blood heart starts a new healing from the beginning.

## Numbers

- Rate: 3 health per second. Total: 200. Time: 120 seconds. 200 at 3 per second takes about 67 seconds, so the total is the usual limit.

Code: `src/entities/hearts.ts` (`tickBlood`), `src/game/game.ts` (`updateHearts`, the damage pipeline).
