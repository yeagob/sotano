# Fire

Up: [elements](README.md) · Status: built.

Fire stands for passion and anger: it clears what no longer serves you, and it spreads if you are careless. In the build it is a flame that lives in a cell, burns what can burn, and goes out in a few seconds unless it is eternal.

## What the player meets

- **Eternal flames.** A template places a flame on the floor (`f`). It never goes out by itself. It is the fire of the braziers and hearths, and it is a source.
- **Burning down.** Any other flame decays: each level lasts half a second, so a fire fed by a flame runs down step by step and dies.
- **Spreading.** A flame lights flammable neighbours. Each tick each flammable neighbour catches with a chance of 0.08, and at most 12 blocks catch per tick everywhere. A crate that catches burns away and leaves a flame in its cell, so a row of crates burns in a chain over time, never all at once.
- **Flammable blocks.** Crates, living wood and leaves burn. Grass does not: it is not flammable, and it stays grass by a fire.
- **Loose cubes.** A flammable loose cube that falls into fire is removed. A bomb in fire goes off at once.
- **Going out.** Water puts a flame out (see [REACTIONS.md](REACTIONS.md)). A flame that loses the block under it goes out, so breaking a brazier's pillar or the crate under a flame puts the flame out.
- **Hurt.** Fire hurts 4 points, half a heart, each time the invulnerability window opens. It does not set the player alight: there is no burning status yet (see [BURNING-STATUS](../../not-built/elements/BURNING-STATUS.md)).
- **Wading.** Fire does not slow you and you do not swim in it.
- **A practice that uses it.** Kindling, a built practice: when a projection hurts the player, fire bursts out of the player, and flammable blocks within two blocks catch. It is the only practice that touches fire in the build (see [ELEMENT-PRACTICES](../../not-built/elements/ELEMENT-PRACTICES.md) for the ones that do not yet exist).
- **Light.** Fire glows and warms the blocks near it.

## How projections meet fire

| Projection | In fire |
|---|---|
| Burnout | fire-immune: walks through fire at its normal speed; when it spends its run it leaves a slowing field, not a fire |
| Critic | avoids fire; touch harm 2 |
| Panic | avoids fire; on entering it swells |
| Alarm | avoids fire; on entering it swells |

Burnout is the one projection that lives in fire. The design also had it leave burning blocks behind; that is not built (see [BURNING-CUBES](../../not-built/elements/BURNING-CUBES.md)).

## Where it is in the rooms

Fire is the protagonist of `hearth` (rows of eternal flames over crates) and of the braziers in `terraces`, `font`, `reliquary`, `dis-hall`, `tombs` and `path-coals`, among others. The validator keeps a flame off the door approaches, the centre, the shaft and anything that burns beside it. The list is in [ELEMENT-ROOMS](../levels/rooms/ELEMENT-ROOMS.md).

Code: `src/content/elements.ts` (decay 0.5 s, ignition 0.08 and 12 per tick, eternal flames), `src/world/elements.ts` (spread, going out when unsupported), `src/game/game.ts` (ignition breaks the block, loose flammable cubes removed in fire), `src/content/materials.ts` (flammable flags).
