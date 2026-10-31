# Tree paths: open, locked or hidden

Up: [not-built levels](README.md) · Status: proposal.

The Tree-of-Life floors join their emanation rooms with corridors of paths. The design wants those corridors to vary from run to run: some open, some locked, some hidden, chosen by the seed, so that the Tree is not the same map twice.

## What the design asks

- **Open.** A path you walk through, as the build's paths are today.
- **Locked.** A path behind a door that needs a key, so the key becomes a choice on the map.
- **Hidden.** A path behind a wall you must dig through or a plug you must break, so the way is found by building.
- **Seeded.** Which paths are which is decided at the start of a run from the seed, never from the player's state, so the same code gives the same Tree.

## What the build does

Every touching pair of cells is joined, and every corridor is open (see [TREE-OF-LIFE](../../built/levels/floors/TREE-OF-LIFE.md)). The Tree is a loop of open corridors. Nothing is locked or hidden, and no seed changes which corridors exist.

## Verbs the variation would give

- Walk an open path (as now).
- Carry a key to a locked path and spend it at the door (the door rules are in [DOORS](../../built/levels/rooms/DOORS.md)).
- Dig or break the plug of a hidden path, and build across where a path is cut.

## Open questions

1. How many paths of a floor may be locked or hidden, and does the Tree keep at least one open route from the kingdom to the crown?
2. Does a locked path take one of the floor's own keys, or a key the floor brings with it?
3. Does a hidden path use a door plug (a dirt plug in a wall, see [DOORS](../../built/levels/rooms/DOORS.md)) or a wall of rock, and what can the player break?
4. Does the variation count toward the rule that half of the fighting rooms need building? A hidden path would add to it.
5. Does the variation change the floor's mirroring (the crown over the next kingdom), or only its corridors?
