# Architecture

How the code that exists today works.

| Document | Contents |
|---|---|
| [OVERVIEW.md](OVERVIEW.md) | Module map, runs and floors, frame order, core systems (event bus, stats, damage, RNG), world, physics, entities, rendering, HUD, debug console, tests |
| [WEAPONS.md](WEAPONS.md) | Weapons that replace the intention (Isaac-style): the active weapon, the `strike` event, the blade, the beam and the great cut, budgets |
| [ITEMS.md](ITEMS.md) | Items, synergies and exceptions: defining an item, the stat and event contract, priorities and chain reactions, synergies and suppression, installing (`Inventory.rebuild`), storing, debugging, deferred decisions |
| [ROOMS.md](ROOMS.md) | Floors and rooms: the Isaac-style plan, from plan to voxels, doors and keys, the room template format and rules (height, layers, elements, floor ranges), how to add a template |
| [ENTITIES.md](ENTITIES.md) | Stacked floors (going down by gravity), health, pickups and counters, bombs, enemies (projections): definitions, spawning, flow-field navigation, combat events |
| [RNG.md](RNG.md) | Seeds and randomness: seed codes, the three classes (structure, runtime, cosmetic), the path table, weighted tables, what varies per run, item pools, guarantees |
| [ACTORS.md](ACTORS.md) | Actors, factions, one damage pipeline (points), split actor/block damage, chain safety for explosions and deep event chains |
| [input/](input/README.md) | Input, a folder: the action table and contexts (README), then one document per scheme: [keyboard and mouse](input/KEYBOARD.md), [gamepad](input/GAMEPAD.md), [touch](input/TOUCH.md) |
| [LOCALIZATION.md](LOCALIZATION.md) | Localization: English source and Spanish, `t()` and catalogs, content texts by id, item messages, numbers, choosing the language, live switching, death causes, tests, how to add text or a language |
| [ELEMENTS.md](ELEMENTS.md) | Elements: the element layer, flow, reactions, rendering and projections in fire, water and lava (built); electricity and block entities (chests, furnaces, barrels) still plan |
| [LEVELS.md](LEVELS.md) | Levels: the ten floors and the tutorial roots (L1, built), and the milestones to the Tree-of-Life maps, multi-cell rooms, the circles, silence and heaven, and the giant tree (L2–L6) |

Related: the target architecture and the reasoning behind it are in [../research/TECHNICAL.md](../research/TECHNICAL.md); reviews of these designs are in [../reviews/](../reviews/README.md).
