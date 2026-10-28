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

**Built (2026-10-27):** the giant tree in seven stories, each a hall the size of a floor joined by spiral stairs, loaded only as you come near ([architecture §12](../architecture/LEVELS.md)); the circles' names on the HUD, the frozen ninth (ice you slide on), silence under it (stand still and you are carried to heaven; the top of the sky brings you back), the giant tree with its stair, branches, leaves and stars that carry you from one to the next, a night sky above it, and Wonder, the first creature of the roots (a paper moth of curiosity that keeps you company).

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
| **Tree of Life** | 1–5 | Ten emanation rooms at the Tree's positions (three pillars), joined by the paths as corridors; seeded variation in which paths are open, locked or hidden | Rooms spread into the empty cells beside them (the map keeps the Tree's shape), height (5 → 8), template complexity (layers, elements, terraces), theme, the materials the rooms are built from |
| **Random** | 6–9 | Isaac-style plans (today's generator) with special rooms at dead ends | Harder rock, deeper elements, the circles' themes; the ninth is frozen |
| **Trunk** | L1 | A vertical map: rooms stacked inside the trunk, joined by climbs and shafts | — |
| **Branches** | L2 | A 3D map: platforms and hollows in every direction, joined by branches | — |
| **Leaves** | L3 | A star map: constellations as rooms, teleport doors between stars, open views of the cosmos | — |

## 3. Rooms that use height (built)

A room template can be taller than the standard 5 blocks (up to **8**), shape its extra height into a **barrel vault** (along X or Z) or a **dome**, dig pools and dips up to **2** blocks into its floor, and add **layers**: grids of blocks above the floor for bridges, balconies and galleries. Built **terraces** (`1`–`4`) make stairs and tiers. These limits keep three layers of rock between floors, so no room ever touches the floor above or below (tested over every pair of bands).

## 3b. Rooms bigger than their cell (built, owner 2026-10-27)

*"Bigger spaces that still count as one room on the map: the map only says how many rooms there are and how they connect."* A room may spread into the empty cells around it (up to 2 × 2 cells, any outline: a long gallery, a hall and a cavern of rock). The map always draws it as one cell. Ceilings take new shapes (pointed, crossing, stepped, an uneven cave roof); plateaus three high make holes five deep and pillars to jump; every floor is built from its own materials (walls, floor, trim). Architecture: [LEVELS.md §11](../architecture/LEVELS.md#11-l7-as-built-after-the-review-reviewslevels-l7md).

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
| `long-gallery` | normal/path, 2×1, floors 1–3 | Limbo's gallery under a pointed vault: its far half a plateau riddled with holes five deep, pillars to jump, the key at the bottom of a well | Jump the pillars; drop to the key and build your way out |
| `cloister` | normal/path, floors 1–2 | A walk around a sunken garth under crossing vaults | Fight from the walk; whatever falls in builds out |
| `bastions` | normal/path, floors 1–5 | Towers three high in the corners, ringed by holes five deep, under a pointed vault | Climb the stair for a vantage; knock projections into the holes |
| `wind-hall` | normal/path, 2×1, floors 2–3 | The winds: a hall two cells long cut by obsidian walls with plugs, a stair at the far end | Dig the plugs or climb the walls |
| `stepped-well` | normal/path, 1×2, floors 2–4 | A stepped well: terraces around a pit five deep under a stepped ceiling, the key at the bottom | Jump the rim, drop to the key, build out |
| `drowned-nave` | normal/path, 2×1, floors 3–4 | The rain: a nave drowned wall to wall, stepping stones, galleries, the key on an island | Swim or step across; fight from the galleries |
| `strongroom` | normal/path, 2×1, floors 4–5 | The weights: great blocks packed with aisles, each one shut | Break or climb your way to the key |
| `styx-cavern` | normal/path, 2×1, floors 5–6 | The marsh: an irregular cavern of mud and still water under an uneven roof | Wade and swim to the hummock |
| `crown-hall` | boss, 2×1, floors 1–4 | The crown as a long dome, the way down at its heart, the practice on a dais | — |
| `chasm` | normal/path, 1×2, floors 6–9 | A plateau of holes five deep, a bridge of pillars, the key in the deepest hole | Jump the bridge; drop and build out |
| `dis-hall` | normal/path, 2×1, floors 6–7 | The walls of Dis: a ditch of lava and graves of flame beyond | Bridge the lava |

## 5. What makes a good room (the bar)

1. **One idea you can read in a glance**, with no text: "an island in lava", "a bridge over deep water".
2. **The elements are verbs, not decoration**: every element room gives the player something to do with it (kick, flood, burn, bridge, swim, lure).
3. **Projections live it too**: think about how each projection reads the room ([ELEMENTS architecture §10](../architecture/ELEMENTS.md)): Doubt won't follow you into water; Panic calms in it and goes off in fire.
4. **Height means something**: a gallery is a vantage point, a pit is a trap, a vault is awe.
5. **The rules of the house**: door approaches clear, the centre open for projections, the pedestal reachable, the shaft clear, nothing reacts on load, nothing reaches another floor. The validator checks all of it; the [`sotano-levels`](../../.claude/skills/sotano-levels/SKILL.md) skill explains why.

## 6. Proposal: cavern scenery in the spirit of the cover art (owner reference, 2026-10-28)

Status: **a proposal for the next level designs, not a decision.** It does not change the art ledger ([DECISIONS.md](../art/DECISIONS.md)). Anything it adopts goes through the [`sotano-art`](../../.claude/skills/sotano-art/SKILL.md) gate first. Reference: `public/the-roots-cover.jpg`.

**Mood.** The cover is awe at the bottom of a shaft: a huge dark cavern of voxel stone, islands hanging in the air, columns coming down from the ceiling, and a few warm lights (a molten gorge, lamps on ledges, a shaft from above) that pull the eye down into the depth. The energy comes from contrast and scale, not brightness. Almost everything is dark and cool, the warm points are rare, so each one means something. The small figure on the ledge is the player's point of view: looking out, about to go down.

**What to take from the image.**
- *Scale.* Rooms should feel bigger than their walls: multi-cell footprints, tall vaults, layers seen across a gap. The sense of space past the walls comes from fog and occlusion, never from a painted backdrop.
- *Floating islands and hanging columns as structure.* Islands are plateaus and layers; columns are pillars from the floor and stalactites from a `cave` ceiling. They form the room's vertical language and carry its verb (jump, climb, build).
- *Warm light as the reward in the dark.* One warm focal point per room, readable from across the room.
- *Cool haze for depth.* Far walls fade toward the floor's own fog colour (teal on the water floors), so distance reads cool and near reads warm.
- *Moss and small plants on ledges.* Grass and leaves on the living edges; the yellow plants are made of the sand and copper ramps, never of gold.
- *A shaft of light from above.* One vertical shaft per room at most.

**How it fits Vessel Light.** Pillar 2 says warm is earned and yours. The cover bends that rule in five places, and each one needs a reconciliation:
1. *Broad amber glows around the gorge.* In the guide, warm light comes from the player, or from lava and fire, which hurt. Reconcile: every warm light names its source (the `cause` field of pillar 2): lava or fire (block light 12 and 10), a lamp the player lit (7), a practice on a pedestal (6), or the warmth of a cleared room (8). No free-floating glow. The BFS radius keeps each glow local.
2. *Lamps lit everywhere.* Floor-1 lamps are unlit until their room is cleared (DECISIONS §4). Reconcile: a cavern full of lit lamps is the climb (citrinitas). The cover shows the way up, not the way down.
3. *The shaft from above.* Only the surface has a sky, and the surface is not a room. Reconcile: the shaft is the way up (rubedo), or the cold slit light of F3, which the ledger already allows pre-lit. Never a warm light falling from nothing.
4. *Pale speckled faces.* Guide §6.1 forbids full-tile random speckle, and the palest rock must stay in the husk band. Keep the rhythm of pebbles and pits as shaped `stone` or `deepstone` patterns, at a lower value.
5. *A full-body protagonist.* §9 says the hands are the only body. The figure belongs to key art only, and in play it is never drawn. (Owner question below.)

**What it means for level design.**
- Use height. A vault uses at least two of its heights (a layer, a pillar or a hanging column), not one empty ceiling.
- Islands are carried, never floating: each stands on a pillar or spans between blocks, as the layer rule already requires. The cover's islands become supported islands.
- Each room has one lit focal point at a height the player sees from the entrance: a pedestal, a lava pool or a lamp. Two focal points in one room compete; do not place them.
- Three depth planes in every big room. Near: the floor, the door approach, the strongest value. Middle: pillars and islands, where the verb happens. Far: fog and a cooler wall or ceiling, read by colour, since fog far is never under 24.
- A vantage ledge, out of every door approach, that looks over the room. It is where a vault's awe is given.
- Floors own the cover's motifs: F1 umber ledges and lamps, F2 teal haze and water glints, F3 cold slits and slate islands, F4 the molten gorge. The cover is a glimpse of the descent, not one room.

**Concrete rules for a room designer.**
1. One warm focal point per room, with a named source (lava, fire, a lamp lit by the player, a practice on a pedestal, or the cleared-room warmth).
2. Hanging columns and stalactites attach to a `cave`, `dome` or `vault` ceiling; they never float. Keep the centre column open up to door height (3), and nothing hangs within 3 blocks above the pedestal.
3. Islands sit on a column or span between blocks, at layer heights `1…height − 3`. No island within 3 tiles of a door approach on a layer under door height.
4. Room height stays at 8 or less, and no room touches the floor above or below. The cover's scale across several floors belongs to the great pit (floor 5) and the giant tree, never to a single room.
5. Scale comes from footprints (2 × 1 and 2 × 2 cells), vaults and fog, never from a painted backdrop.
6. Moss and plants only on ledges and wall tops, never on door approaches or in a shaft. Dry yellow plants use the `sand` and `copper` ramps, never `light.*` or `life.*`.
7. At most one shaft of light per room: vertical, from the ceiling to the floor, in a cold or sky ramp allowed on that floor (F3, the climb, the surface).
8. Scenery is built only from existing materials. No new material is added for decoration.

**What to check before adopting.**
- *Voxel count and performance.* The cover is far denser than any room needs. Count visible faces per room in the gallery and the mesher; hollow the shells, keep hanging columns to a few cubes, and check the draw-call budget (about 150 on PC and 90 on mobile, [ART-GUIDE §13](../art/ART-GUIDE.md)) and the meshing time per chunk. This proposal sets no face budget yet; engineering measures one first.
- *Readability in the dark.* Capture each new room at distance (20 blocks in fog), in colour, greyscale and the three colour-blindness filters. The floor stays above OKL 0.12 with the lantern; every projection's cold eye still reads; a fired intention is the brightest thing in view; no island or column hides a door.
- *The rules of the house* ([§5](#5-what-makes-a-good-room-the-bar)): door approaches clear, centre open, pedestal reachable, shaft clear, nothing reacting on load, nothing reaching another floor. The validator stays quiet, and a new test checks that scenery sits only on allowed layers.
- *Gentleness.* Focal lights and lamps are steady, with breathing at 0.5 Hz or slower and no flicker (G2).
- *Meaning.* Scenery adds no new concept: the cavern is the husk that holds the light ([ART-GUIDE §1](../art/ART-GUIDE.md)). A room that needs its own concept goes to the lore first.

**What not to copy.**
- The cover's surface detail as texture. Its speckle and its bright rock are a render's look; the game keeps shapes, bevels and the husk band.
- Any plant, rock or lamp shape that matches a known game's asset. We copy the principle (scale, islands, one warm point), never the silhouette.
- Bloom. The cover's glow is painted; ours is block light and emissive texels, with no default bloom ([ART-GUIDE §13](../art/ART-GUIDE.md)).

**Adoption path (if the owner accepts).**
1. Build one test room per floor type (a vault on floor 1, a pit on floor 3, a gorge on floor 4) and capture it in `?gallery`.
2. Pass the `sotano-art` gate on each new block, light and colour, and the validator (`npm test`).
3. Write the accepted rules into ART-GUIDE and this section, and move the adopted rules out of the proposal.

**Owner decisions (2026-10-28).**
1. **The cover's figure is key art only.** The game keeps the rule that the player's body is never shown (ART-GUIDE §9): only the hands.
2. **The cavern richness goes into floors 1–5.** Those floors need more detail and decoration: lamps, plants, carved stone, hanging and supported islands, moss on the ledges. The warm light stays earned (one source per room, named by its fire, lamp, practice or cleared warmth), but the decoration is what makes the first five floors read as places.
3. **The great pit is the only place where the cover's scale is allowed** (the floor-5 abyss, with its shaft into the next layer).
