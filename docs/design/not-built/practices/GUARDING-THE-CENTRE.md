# Guarding the Centre

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code, waits for the owner's acceptance.

The koala's gift on defeat (#357), replacing Co-Regulation. Body, quality 2, pool `sky` only. Named by the designer from `golden-flower` in [SOURCES](../../../lore/SOURCES.md): guarding the centre in stillness.

- The `freezeSphere` stat (0 or 1). Every 3 s a sphere leaves the player (from the middle of the body, where the player is at that moment; it does not follow them).
- Its radius grows linearly from 0 to 4 blocks in 1.5 s (at 0.5 s it is 1.33 blocks).
- Every projection (underground) or sky creature (deity or minion, allies included) whose centre it reaches is frozen for 3 s, once per sphere, unless it is in a freeze or in its freeze cadence ([the freeze family](../sky/guardians/README.md#9-gifts-freeze-and-water-357)).
- The player who emits it is never frozen by it. A won deity is never frozen.
- Positive outcome: what hunts the player stops for 3 s of every 9 at most.
- Look and sound are provisional (pale motes on the sphere's edge, the freeze cue): the art gate is open.

Code: `src/content/items/guarding-the-centre.ts`, `src/combat/freeze-sphere.ts`, `src/game/game.ts` (`updateSpheres`). Tests: `tests/freeze-sphere.test.ts`, `tests/sky-freeze-water.test.ts`. Recipe: none yet (#112).
