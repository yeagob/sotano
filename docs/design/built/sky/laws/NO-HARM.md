# Nothing dies, and no health is taken (laws 3.7, 3.10 and 3.11, built)

Up: [The laws of the sky (built)](README.md)

In the sky nothing dies, and the player's health is never taken.

## What the player sees and feels

- **No health loss.** While the player is in the sky, every damage to their health is cancelled, whatever its cause: an item that hurts its holder, their own bomb, a landing, water. The hearts never drop in the sky, and the player cannot die there. The toast on arriving says it: "You are in the sky. Nothing here takes your health."
- **What the sky costs instead.** A deity's special attack drains spirit, and a capture takes one practice ([SPIRIT](SPIRIT.md)). Hindrances and minions only push, slow or hold the player (provisional, owner to confirm).
- **Nothing dies.** No deity and no minion can reach zero. A won deity changes its attitude and stays ([guardians](../guardians/README.md)); a minion turns into an ally or calms; a minion that is stuck fades out and back in at its home ([minions](../minions/README.md)).
- **No room or floor events.** A sky floor is neither a room nor a floor for item events (provisional, owner, 2026-11-03): practices that act on entering or clearing a room, or on entering a floor, wait until the player is back below.
- **No sky block burns.** No sky material is flammable (provisional, owner, 2026-11-03).

Code: `src/sky/laws/no-harm.ts` (the damage hook), `src/sky/creatures/system.ts` (no path sets a sky actor dead); tests in `tests/sky-laws.test.ts`.
