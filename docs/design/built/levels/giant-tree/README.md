# The giant tree (built)

Up: [levels](../README.md) · the tree that rises above the surface, built as seven stories you climb, and the sky that opens above it.

The giant tree stands at the centre of the surface and rises through the open sky. It is made of ordinary blocks: living wood for the trunk and branches, leaves for the canopy, and starstone pads for the stars. Its height reaches the top of the sky. It is built as seven stories, each one a hall or a level you can walk through, joined by spiral stairs of living wood. Each story is generated the first time you come near it, so the tree costs nothing until you climb. The owner's words for the tree: a real, giant tree of thousands of cubes that you climb, with a trunk you move through as a vertical map, branches as a 3D map, and leaves as a star map. The first three are built as stories; the design's upper three floors are discussed in [not-built/levels/FLOOR-KINDS](../../../not-built/levels/FLOOR-KINDS.md).

## The seven stories

| Story | Zone on the HUD | Starts at (blocks above the base) | Height | Radius |
|---|---|---|---|---|
| roots | the trunk | 0 | 22 | 34 |
| rings | the trunk | 22 | 22 | 30 |
| galleries | the trunk | 44 | 22 | 26 |
| hollows | the trunk | 66 | 22 | 23 |
| branches | the branches | 88 | 24 | 20 |
| canopy | the leaves | 112 | 34 | the crown spreads wide |
| stars | heaven | 146 | 114 | the pads, out to the edge of the sky |

The four trunk stories are one hollow column, a wall of living wood three blocks thick around each story's hall. The base is the surface; the sky above the top story is the top of the world.

## Growing and loading

- **Grown once.** A story is built the first time you come within reach of it, from its own seeded stream, and it stays built for the run. Growing happens in the same run every time, because the stream belongs to the run's seed.
- **Loaded near you.** Only the stories around you are kept loaded (yours, and the one above and below). Far stories are not drawn until you come near. No projections or elements live in the tree yet.
- **Zones.** The HUD names the zone you stand in: the trunk, the branches, the leaves or heaven. Below the surface a floor's name is shown instead.

## What the tree is made of

- **Living wood** (the log) is the trunk, the branches, the floors, the stairs, the pillars and the stars' disc. It burns, like every wood-like block (see [ICE-AND-WOOD](../../elements/ICE-AND-WOOD.md)).
- **Leaves** are the canopy, the hanging strands of the galleries and the balls at the tips of the branches. They burn too.
- **Starstone** is the pad that carries you from one star to the next (see [STARS](STARS.md)). It is tier 3 with 60 points of hardness, a fixed point to steer by.
- **Dirt and grass** lie on the floor of the first story's centre, a small clearing.

## The sky above it

Above the surface, the open sky is 260 blocks high, up to the top of the world. The sky turns to night from the branches up, and the stars come out in it. Silence and heaven loop around the top of the sky (see [SILENCE](../floors/SILENCE.md)).

## Documents

| Document | Contents |
|---|---|
| [TRUNK.md](TRUNK.md) | The four trunk stories: the roots, the rings, the galleries and the hollows; the spiral stairs between them |
| [BRANCHES.md](BRANCHES.md) | The branch story: the limbs that leave the trunk and carry the climb out and up |
| [CANOPY.md](CANOPY.md) | The leaves: the crown, its limbs and the floor under it |
| [STARS.md](STARS.md) | Heaven: the disc, the pads and the constellations, and the night |

Code: `src/world/tree.ts` (the stories, their growth, the stairs, the pads), `src/game/game.ts` (growing and loading the stories near you, the zones, the star pads, the night sky), `src/content/materials.ts` (living wood, leaves, starstone).
