# Ice and wood

Up: [elements](README.md) · Status: built.

Two solid families answer the elements in the build. Ice is water held still on the ninth floor; wood is the family of blocks that burn and float.

## Ice

On the ninth floor, the frozen bottom, every pool of water is ice on its surface. The water under the ice stays liquid. Ice is a solid block: you can stand on it, and you can break it (tier 1, 6 points of hardness). The owner's line for it is a feeling frozen still.

- **Slippery.** You slide on ice more than on stone.
- **Colour.** Ice takes the water's own colours, not the projections' cold.
- **Where.** Only the ninth floor freezes; the other floors' water stays water. See [CIRCLES](../levels/floors/CIRCLES.md).

## Wood

Three blocks are wood-like and flammable:

| Block | Tier and hardness | What it is in the rooms |
|---|---|---|
| Crate | tier 0, 4 | the stored thing you never opened: pushed, kicked, carried, burned |
| Living wood | tier 1, 14 | the tree's own wood: the giant tree is made of it |
| Leaves | tier 0, 2 | what grows when you rise: the canopy of the giant tree |

- **Burns.** Each of them catches from fire or lava and burns away, leaving a flame (see [FIRE.md](FIRE.md)).
- **Floats.** A wood-like cube in water rises to the surface instead of sinking. Stone and iron-like blocks sink slowly.
- **Furnace fuel.** Not built: the furnace is a design (see [FURNACE](../../not-built/elements/FURNACE.md)).

Grass is not wood-like: it is not flammable and it does not float. Grass stays as it is by a fire (see [GRASS-BURNING](../../not-built/elements/GRASS-BURNING.md)).

Code: `src/content/materials.ts` (ice, crate, living wood and leaves; the flammable and slippery flags), `src/game/game.ts` (floating wood in water, the slippery surface), `src/world/floor.ts` (ice in the frozen pools).
