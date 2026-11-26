# Like Water

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code, waits for the owner's acceptance.

The elephant's gift on defeat (#357), replacing Long Memory. Emotion, quality 3, pool `sky` only. Named by the designer from `tao-te-ching` in [SOURCES](../../../lore/SOURCES.md) (chapters 8 and 78: water as the highest good, softness that overcomes the hard).

- A positive intention that impacts a block places source water in the cell in front of the face it hit, for 3 s; then it dries (the water that ran from it recedes).
- A positive impact on water this practice made only resets its 3 s.
- A cell that is solid or already holds an element is left alone.
- Every being in this water moves at half speed, as in the sky's water.
- Hook `intentHit` with id `water` (priority 200), through the new verb `ItemApi.tempWater`.
- Positive outcome: the player lays water where it slows what chases them.

Code: `src/content/items/like-water.ts`, `src/world/temp-water.ts`, `src/game/game.ts` (`placeTempWater`). Tests: `tests/like-water.test.ts`. Recipe: none yet (#112).
