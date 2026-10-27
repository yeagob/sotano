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
| [levels.md](levels.md) | Levels L1: ten floors, the tutorial roots, ids, surface band, pools, rock by depth ([../architecture/LEVELS.md](../architecture/LEVELS.md)) | Accepted with changes; L1 built |
| [elements.md](elements.md) | Fire, water and lava: element layer, flow, reactions, rendering, actors and rooms with height ([../architecture/ELEMENTS.md](../architecture/ELEMENTS.md) §9) | Accepted with changes; built |
