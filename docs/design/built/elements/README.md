# Elements (built)

Up: [built](../README.md) · the element documents, as built and checked in code.

Elements are the matter that moves through the rooms: water, lava and fire. They do not replace the solid blocks; they flow into the cells beside them, wash over the player and the projections, and change what they touch. What the player can do with each one is in its own document. The reactions between elements, and the solid materials that answer them (ice, wood), are documented apart. Nothing in this folder is a plan: what is not built is in [not-built/elements](../../not-built/elements/README.md).

Rules that hold for every element:

- An element fills a cell that has no solid block. A cell holds one element kind with a level: fluids run from level 1 to 8 (8 is full), and a source is a fluid or a flame that never changes by itself.
- Sources stay put. A flowing cell takes its level from its neighbours and recedes when the source that feeds it is gone.
- The hottest element touching the player hurts; the player is hurt by the element at their feet, their body and their head. Hits are paced by the invulnerability window, so one touch is one hit, not a stream.
- Breaking an element gives nothing. Elements never drop keys, bombs, hearts or items (the blocks they touch drop nothing either).
- Room templates never carve water next to lava, or a flame next to something that burns. The reactions happen when the player starts them.

Code: the element data in `src/content/elements.ts`, the simulation in `src/world/elements.ts`, the reactions in `src/content/reactions.ts`.

| Document | Contents |
|---|---|
| [WATER.md](WATER.md) | Water: flow, wading, swimming, breath and drowning, how projections meet it |
| [LAVA.md](LAVA.md) | Lava: what it burns, what it consumes, how it lights and how projections avoid it |
| [FIRE.md](FIRE.md) | Fire: eternal flames, the chain through flammable blocks, how it goes out, its hurt |
| [ICE-AND-WOOD.md](ICE-AND-WOOD.md) | Ice on the frozen ninth floor, and the flammable wood-like blocks that float |
| [REACTIONS.md](REACTIONS.md) | The two reaction rows (water on lava, water on fire) and the rules that follow from them |
