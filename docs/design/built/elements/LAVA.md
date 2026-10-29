# Lava

Up: [elements](README.md) · Status: built.

Lava stands for old pain: it burns what touches it, and emotion (water) hardens it into a boundary. It is the hottest thing in the dungeon and the only one that consumes what falls into it.

## What the player meets

- **Lava pools and rivers.** Templates dig lava one or two blocks deep (`l` and `L`), and some rooms have lava in their corners or across the floor. Lava appears from the third floor on, as the element rules say (see [FLOOR TYPES](../levels/floors/README.md)).
- **Slow flow.** Lava flows more slowly than water. Its flow rule is in the element data.
- **Wading.** You move at 40 percent of your speed in lava. The data also lets you swim in it, but lava has no breath meter, so while you are under it you take its harm and nothing else.
- **Touch.** Lava hurts 8 points, one heart, each time the player's invulnerability window opens while they touch it. The design text said a full heart each second; the build paces hits by the invulnerability window instead.
- **Light.** Lava glows, and it warms the blocks around it.
- **Burning blocks.** Lava lights flammable blocks next to it (crates, living wood, leaves) with a chance of 0.2 per tick, more often than fire does (0.08). A block that catches burns away and leaves a flame behind (see [FIRE.md](FIRE.md)).
- **Loose cubes.** A loose cube that falls into lava is removed. Obsidian is the exception: lava does not consume it. A bomb thrown into lava goes off at once.
- **Water meets lava.** Water flowing onto a lava source makes obsidian; water on a flowing lava cell makes stone (see [REACTIONS.md](REACTIONS.md)).

## How projections meet lava

| Projection | In lava |
|---|---|
| Burnout | avoids lava |
| Critic | avoids lava; touch harm 2 |

Burnout and Critic keep out of lava. Fire-immune Burnout walks the fire but not the lava.

## Where it is in the rooms

Lava sits in `moat`, `steam`, `lava-bridge`, `reliquary`, `caldera`, `path-span`, `path-coals`, `dis-hall`, `river`, `marsh` and `islet`, among others. The rules the validator enforces around it (no water beside it, no flame beside something that burns) are in [rooms/README.md](../levels/rooms/README.md).

Code: `src/content/elements.ts` (harm 8, wading 0.4, emissive), `src/world/elements.ts` (lighting, flow), `src/game/game.ts` (consuming loose cubes except obsidian, bombs in lava), the projection affinities in `src/content/enemies/`.
