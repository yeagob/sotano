# The wind above the crown: what is open

Up: [levels (not built)](README.md) · Status: proposal (the Lion's shield is decided by the owner in principle; how it resolves is for the owner to review). The built wind is [built/levels/giant-tree/WIND](../../built/levels/giant-tree/WIND.md).

The wind above the crown is built: it blows from the first row over the crown's leaves, pushes an airborne body with 1.1 times its own air control force, and turns every 3 seconds. This page keeps what issue #373 left open.

## The Lion's shield

The owner's words (issue #373, paraphrased): the Lion's practice, given by the Lion in another branch, makes you untouchable in the air, and in that practice the shield should stop the wind. For now the wind is a force the practice resolves, and the owner will review how.

What the build gives the practice: the wind is one of the air's forces, and any practice can add a filter that sees each force by its name and keeps, changes or cancels it. A filter that cancels the wind leaves the body as if there were no wind (tested with a stub). Proposals for the owner, in the order recommended:

1. **The shield stops the wind entirely** while it is up: the filter cancels the wind's force. Simplest, and matches "the shield should stop the wind".
2. **The shield halves the wind**: the push drops to 0.55 of your air control, so you can now fly against it at half your walking speed. Keeps the wind felt.
3. **The shield stops the wind only while it is visible** (its own timer or charge), so the wind comes back when it drops.

Open questions:

- Does the shield stop the wind's streaks round you too (a calm bubble), or only its push?
- Does it stop only the tree's wind, or also the gusts of the sky realm ([sky WIND](../sky/abilities/WIND.md))?

## Other open points

- **The route of the stars with the wind.** The pads' route is proven crossable by the real body with the Triple Jump (`tests/star-pads.test.ts`), but those walks run without the wind. With the wind a hop drifts by up to 1.1 times the walking speed for every second in the air, so some hops may now need the wind to turn the right way. Whether every hop must stay crossable in any wind, or the wind is meant to make the player wait for a good turn, is for the owner.
- **A sound.** The wind is silent in this change. A low, steady air with a swell on each turn (never a click on its onset, `sotano-feature` log, issue #46) is proposed.
- **A sign of the turn.** The streaks swing round on each turn; a sound or a stronger streak burst at the turn would warn the player a moment before. Whether a warning before each turn is wanted (it would make it easier to control) is for the owner.
- **Projections and loose cubes.** The wind pushes only the player. Whether thrown cubes, bombs or intentions should drift with it is open.
