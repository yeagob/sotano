# Levels: the world's thirteen floors and the rooms inside them

Status: **§1–§2 are the owner's direction and decisions (2026-10-27), not built yet (architecture: [../architecture/LEVELS.md](../architecture/LEVELS.md)); §3–§5 are built** (rooms with height and elements). How to author rooms and floors: the [`sotano-levels`](../../.claude/skills/sotano-levels/SKILL.md) skill. Code today: [ROOMS.md](../architecture/ROOMS.md).

## 1. The shape of the world (owner, 2026-10-27)

*"Thirteen floors. Floors 0–5 are laid out as the Tree of Life's ten emanations, each one with bigger, more themed and more complex layouts. From 5 to 9, random maps again. And up above, a real, giant tree made of thousands of cubes that holds the three upper floors: the trunk (a vertical map), the branches (a 3D map) and the leaves (a star map of constellations with teleport doors and views of the cosmos). Going down we sink into the layers of the unconscious, down to the bottom of Dante's hell, and then into silence; going up we go to heaven."*

```
            heaven (the sky above the canopy)
  ▲  L3   Leaves   – a star map: constellations, teleport doors, views of the cosmos
  ▲  L2   Branches – a 3D map: platforms, bridges and hollows in every direction
  ▲  L1   Trunk    – a vertical map: you climb inside and around it
 ───────  the surface (the house, the grass, the roots go down from here)
  ▼  0       the roots: the earth, peaceful creatures; you start climbing from here
  ▼  1    }
  ▼  2    }  Tree-of-Life floors (ten emanations joined by the paths), circles 1–5,
  ▼  3    }  each bigger, more themed, more complex than the one above
  ▼  4    }
  ▼  5    }  …ending in a great pit
  ▼  6    }
  ▼  7    }  random floors (Isaac-style plans), circles 6–9
  ▼  8    }
  ▼  9    }  the frozen bottom
            silence ⟲ heaven (it loops)
```

Ten floors below and three in the tree: thirteen. Down is the unconscious, layer by layer (the [Cosmology](../lore/COSMOLOGY.md): as above, so below); up is the crown of the tree and the sky. The deepest point and the highest one meet (Cosmology §3).

### Owner decisions (2026-10-27)

1. **Floor 5 is the last Tree floor**, and it ends in a **great pit** that leads to the next layer of the world (the random floors).
2. **Dante's circles: yes.** Floors 1–9 are the nine circles in order (the ninth frozen, as in the poem). **Floor 0 is simply the earth, the roots**: non-aggressive creatures live there.
3. **Silence connects with heaven: it is cyclic.** What ends a run is still to be decided.
4. **There is no house on the surface.** You climb from floor 0, the roots, however you can (blocks, the tree itself).
5. **Heaven and the bottom are connected**; how, to be decided.

6. **Floor 0 is the tutorial and the friend**: everything beautiful, **every door open** (no locks, no combat seals), **instructions on how to play spread through its rooms**, and **only practices of quality 1–3** on its pedestals. The instructions are **carved on stone tablets on the walls** of each room (north and south walls, beside the doors), never an overlay on the screen (owner, 2026-10-27).
7. **Challenge rooms** may appear on any hostile floor: three waves of projections every time you enter, harder each time, for as long as you like (farming).
8. **Doors work as in Isaac**: open whenever there are no projections, sealed while you fight, open again on their own when the room is clear; **a breakthrough destroys a door for good**.

So the world, top to bottom: heaven · leaves · branches · trunk · the surface · **0** roots (peaceful) · **1–5** Tree of Life and the first five circles (5 ends in the great pit) · **6–9** random floors, circles six to nine (9 frozen) · silence (which loops back to heaven).

Respect rules for Dante: his structure and images, never his figures as projections, no punishment of people (projections are patterns, never people), no gore.

### Still open

- Where the run starts (assumption: on floor 0, among the roots) and what ends it.
- How silence and heaven connect (a fall, a door, a shaft of light).
- Which creatures live in the roots (they need the projection art gate even though they are not hostile). Proposal: Rootlings, Mosslings, Delvers and the Gardener ([BESTIARY.md §7–§8](BESTIARY.md)).

## 2. Floor types

| Type | Floors | Plan | What grows with depth |
|---|---|---|---|
| **Roots** | 0 | The earth: root tunnels and hollows, non-aggressive creatures, the way up to the surface | — |
| **Tree of Life** | 1–5 | Ten emanation rooms at the Tree's positions (three pillars), joined by the paths as corridors; seeded variation in which paths are open, locked or hidden | Room footprint (1×1 → 2×1 → 2×2 grid cells), height (5 → 8), template complexity (layers, elements, terraces), theme |
| **Random** | 6–9 | Isaac-style plans (today's generator) with special rooms at dead ends | Harder rock, deeper elements, the circles' themes; the ninth is frozen |
| **Trunk** | L1 | A vertical map: rooms stacked inside the trunk, joined by climbs and shafts | — |
| **Branches** | L2 | A 3D map: platforms and hollows in every direction, joined by branches | — |
| **Leaves** | L3 | A star map: constellations as rooms, teleport doors between stars, open views of the cosmos | — |

## 3. Rooms that use height (built)

A room template can be taller than the standard 5 blocks (up to **8**), shape its extra height into a **barrel vault** (along X or Z) or a **dome**, dig pools and dips up to **2** blocks into its floor, and add **layers**: grids of blocks above the floor for bridges, balconies and galleries. Built **terraces** (`1`–`4`) make stairs and tiers. These limits keep three layers of rock between floors, so no room ever touches the floor above or below (tested over every pair of bands).

## 4. Rooms where the elements are the protagonists (built)

| Room | Type | What it is | What the player can do |
|---|---|---|---|
| `cistern` | normal | A flooded hall under a barrel vault, deep water on both sides of a causeway, galleries over the water | Swim (breath!), fight from the galleries, kick cubes in to float the wood |
| `hearth` | normal | Rows of eternal flames; crates in the corners | Kick or throw crates into the fire; lure Panic into a flame; break a flame's floor to put it out |
| `moat` | normal | An island inside a lava moat, four ways across, under a dome | Knock projections into the lava with thrown cubes; bridge it with blocks |
| `steam` | normal | Water and lava separated by one wall of obsidian | Break the wall: emotion meets old pain and hardens into obsidian and stone |
| `terraces` | normal | An amphitheatre climbing into the corners around a ring of shallow water, flames on the top tier | Fight from above; the water calms Panic |
| `font` | normal | A cross of shallow water under a dome, braziers on four pillars | Wade; break a pillar to put its flame out |
| `crossing` | normal | A brick bridge over a flooded floor, a dry centre | Hold the bridge; Doubt walks around the water |
| `spring` | treasure | The practice on an island ringed by shallow water | — |
| `reliquary` | vault | Braziers on pillars, lava in the corners | Breaking the floor next to the lava lets it spill (it slopes like a ramp) |
| `caldera` | boss | Lava pools around the arena, braziers on pillars | — |
| `well` | start | Shallow pools under a high vault: a first taste of wading | — |
| `abyss` | boss, floor 5 | The great pit: a hall two rooms long, still water and braziers, the crown's practice at the far end and a 4×4 shaft into the next layer of the world | Fall into the random floors |
| `antechamber` | normal, 2×1, floors 6–9 | A hall split by a river of lava, its north and south doors walled off | Bridge the river to the key; climb the walls |
| `giants-well` | normal, 1×2, floors 7–9 | Trenches cut the side doors off; below an obsidian wall, a ring of pits | Build across, climb down, build out |
| `gauntlet`, `colosseum` | challenge | Three waves every time you walk in | Farm; use the pit and the cover |
| `roots-*` | floor 0 | The tutorial, a lesson on each room's walls | Break, step, kick, pit, bridge, breakthrough |

## 5. What makes a good room (the bar)

1. **One idea you can read in a glance**, with no text: "an island in lava", "a bridge over deep water".
2. **The elements are verbs, not decoration**: every element room gives the player something to do with it (kick, flood, burn, bridge, swim, lure).
3. **Projections live it too**: think about how each projection reads the room ([ELEMENTS architecture §10](../architecture/ELEMENTS.md)): Doubt won't follow you into water; Panic calms in it and goes off in fire.
4. **Height means something**: a gallery is a vantage point, a pit is a trap, a vault is awe.
5. **The rules of the house**: door approaches clear, the centre open for projections, the pedestal reachable, the shaft clear, nothing reacts on load, nothing reaches another floor. The validator checks all of it; the [`sotano-levels`](../../.claude/skills/sotano-levels/SKILL.md) skill explains why.
