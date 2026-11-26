# Shield

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code, waits for the owner's acceptance.

The lion's gift on defeat (#357), replacing Assertive Roar. Will, quality 4, pool `sky` only; the lion is its only source. The owner named it (Escudo).

- The `airShield` stat (0 or 1). While the stat is on and the feet are off the ground (`Player.shielded`, also `SkyPlayer.shielded`), the player is totally invulnerable: no damage, push, hold, slow, freeze, drain, capture or wind affects them.
- The flag is what the future wind on the platforms above the tree reads: airborne and shielded.
- On the ground nothing changes.
- Positive outcome: every jump is a safe moment.

Code: `src/content/items/shield.ts`, `src/entities/player.ts` (`shielded`), `src/sky/laws/spirit.ts`, `src/game/game.ts` (`damageActor`, the sky host). Tests: `tests/shield-water-freeze.test.ts`. Recipe: none yet (#112).
