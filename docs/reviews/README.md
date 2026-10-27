# Reviews

Key architecture decisions go through a three-party review before (or while) they are built:

- **Engineer** — writes the proposal and implements the outcome.
- **Architect** — attacks the proposal, finds weaknesses, proposes alternatives.
- **Mediator** — external technical consultant: represents the owner's interests, fact-checks the critique and rules on each point (now, later, or rejected).

Each review records the critique, the ruling and the engineer's resolution.

| Review | Subject | Outcome |
|---|---|---|
| [items-architecture.md](items-architecture.md) | Items, synergies and exceptions ([../architecture/ITEMS.md](../architecture/ITEMS.md)) | Accepted with changes (M1) |
| [entities.md](entities.md) | Health, bombs, enemies, loot, stacked floors ([../architecture/ENTITIES.md](../architecture/ENTITIES.md)) | Accepted with changes (M1.5) |
| [rng.md](rng.md) | Seeds and randomness across the whole game ([../architecture/RNG.md](../architecture/RNG.md)) | Accepted with changes |
| [stress-test.md](stress-test.md) | 28 extreme items run against the whole architecture; root causes and a prioritised refactoring plan (P0–P2) | Report; refactors pending the owner's go-ahead |
| [actors.md](actors.md) | Actors, split damage, chain safety, factions ([../architecture/ACTORS.md](../architecture/ACTORS.md)) | Accepted with changes; built |
| [localization.md](localization.md) | Localization: English source + Spanish, catalogs, item messages, live switching ([../architecture/LOCALIZATION.md](../architecture/LOCALIZATION.md)) | Accepted with changes; built |
| [weapons.md](weapons.md) | Weapons that replace the intention: Occam's Razor, Kiai, One Clear Cut ([../architecture/WEAPONS.md](../architecture/WEAPONS.md)) | Accepted with changes; built |
| [levels-l7.md](levels-l7.md) | Levels L7: rooms bigger than their cell, new ceilings, deep holes, a building palette per floor ([../architecture/LEVELS.md](../architecture/LEVELS.md) §10–§11) | Accepted with changes; built |
| [levels-l4-l6.md](levels-l4-l6.md) | Levels L4–L6: circles, ice, silence and heaven, the giant tree, the creatures of the roots ([../architecture/LEVELS.md](../architecture/LEVELS.md) §8) | Accepted with changes; built |
| [levels-l3.md](levels-l3.md) | Levels L3: footprint rooms, the great pit, checks per carved room ([../architecture/LEVELS.md](../architecture/LEVELS.md) §7) | Accepted with changes; split L3c (built), L3a, L3b |
| [levels-l2.md](levels-l2.md) | Levels L2: Tree-of-Life floors, paths, and rooms you build your way through ([../architecture/LEVELS.md](../architecture/LEVELS.md) §5) | Accepted with changes; built |
| [levels.md](levels.md) | Levels L1: ten floors, the tutorial roots, ids, surface band, pools, rock by depth ([../architecture/LEVELS.md](../architecture/LEVELS.md)) | Accepted with changes; L1 built |
| [polarity.md](polarity.md) | Intention polarity: positive mends, negative harms, warmth, allies that heal and relapse, the F toggle ([../design/BESTIARY.md](../design/BESTIARY.md) §1.1) | Accepted with changes; built (added rules for owner ruling in §3) |
| [elements.md](elements.md) | Fire, water and lava: element layer, flow, reactions, rendering, actors and rooms with height ([../architecture/ELEMENTS.md](../architecture/ELEMENTS.md) §9) | Accepted with changes; built |
| [input.md](input.md) | Input: keyboard and mouse, gamepad, touch from one action table ([../architecture/input/](../architecture/input/README.md)) | Accepted with changes; built |
