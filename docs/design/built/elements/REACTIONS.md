# Reactions

Up: [elements](README.md) · Status: built.

A reaction happens when two elements meet across a cell boundary and the pair is in the reaction table. The table has two rows. Everything else that changes between elements (fire catching a block, lava eating a cube, a flame going out when it has no support) follows from the element rules, not from the table.

## The two reactions

| Reaction | What meets what | Result | What the player sees |
|---|---|---|---|
| **Quench** | water on lava | a lava source becomes obsidian; a flowing lava cell becomes stone | steam |
| **Douse** | water on fire | the flame is gone | a hiss |

The owner's story for quench is that emotion meets old pain and hardens into a boundary. A lava lake quenched by water becomes obsidian, the toughest solid in the game (tier 3, 40 points of hardness). A trickle of lava becomes plain stone. So a dam of water is also a way to build: where a flow meets a source, the source becomes a wall.

## Rules that follow

- **Lava consumes what falls in** except obsidian, which it cannot consume.
- **Fire goes out with its support.** A flame that has no block under it goes out; breaking the crate or the pillar under it is enough.
- **Fire catches what burns.** Fire and lava light the flammable blocks beside them (see [FIRE.md](FIRE.md) and [LAVA.md](LAVA.md)).
- **Templates do not start reactions.** The validator refuses a room that carves water beside lava or a flame beside something that burns, so the player starts every chain.
- **A reaction is a hook.** Each reaction emits an event before it happens, so an item or a state of being could change its result. No item does so yet.

## What is not a reaction in the build

Deepstone does not melt in lava, mud is not made from water and dirt, sand does not turn into glass, and electricity does not exist. Those are design, not built, in [not-built/elements](../../not-built/elements/README.md).

Code: `src/content/reactions.ts` (the two rows), `src/world/elements.ts` (applying reactions, catching, going out), `src/game/game.ts` (lava and fire consuming loose cubes).
