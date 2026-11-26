# Self-Distancing

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code, waits for the owner's acceptance.

The panda's gift on defeat (#357), replacing Still Sitting. Mind, quality 1, pool `sky` only (handed out by the won panda, never drawn). Inspired by self-distancing in emotion-regulation research: looking at a problem from further away. The name is the designer's (owner's brief: "the practice of distance").

- The `flightDamage` stat (0 or 1) marks each intention. When one hits a projection, its damage is multiplied by the distance factor of how far it has flown, and by its size.
- The distance factor is ×0.5 at distance 0, ×1 at half the maximum flight distance, ×2 at the maximum flight distance, linear in between, and stays ×2 beyond it.
- The maximum flight distance is the straight flight of the intention: its speed × its straight seconds (16 × 0.5 = 8 blocks at base; the `shotSpeed` and `range` stats change it).
- Size: the intention's radius over the base radius (0.12), that is the `size` stat; size 2 gives ×2.
- Final damage = base × distance factor × size. Mining (blocks) and the sky creatures, which count hits, not damage, are unchanged.
- Positive outcome: every intention that flies more than half its reach hurts more, up to twice as much; a large intention hurts more at any distance.

Code: `src/content/items/self-distancing.ts`, `src/combat/intents.ts` (`distanceFactor`, `flightDamage`), `src/core/stats.ts` (`flightDamage`). Tests: `tests/self-distancing.test.ts`. Recipe: none yet (#112).
