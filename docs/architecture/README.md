# Architecture

How the code that exists today works.

| Document | Contents |
|---|---|
| [OVERVIEW.md](OVERVIEW.md) | Module map, runs and floors, frame order, core systems (event bus, stats, damage, RNG), world, physics, entities, rendering, HUD, debug console, tests |
| [ITEMS.md](ITEMS.md) | Items, synergies and exceptions: defining an item, the stat and event contract, priorities and chain reactions, synergies and suppression, installing (`Inventory.rebuild`), storing, debugging, deferred decisions |
| [ROOMS.md](ROOMS.md) | Floors and rooms: the Isaac-style plan, from plan to voxels, doors and keys, the room template format and rules, how to add a template |
| [ENTITIES.md](ENTITIES.md) | Stacked floors (going down by gravity), health, pickups and counters, bombs, enemies (projections): definitions, spawning, flow-field navigation, combat events |
| [RNG.md](RNG.md) | Seeds and randomness: seed codes, the three classes (structure, runtime, cosmetic), the path table, weighted tables, what varies per run, item pools, guarantees |
| [ELEMENTS.md](ELEMENTS.md) | Plan: architecture for fire, fluids, lava, electricity, block entities (chests, furnaces, barrels), and the step-by-step implementation plan (E0–E9) |

Related: the target architecture and the reasoning behind it are in [../research/TECHNICAL.md](../research/TECHNICAL.md); reviews of these designs are in [../reviews/](../reviews/README.md).
