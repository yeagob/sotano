[Levels (built)](../README.md) · [Design](../../../README.md)

# The deep desert

Status: built (issue #354). Code: `src/world/worm-desert.ts` (the basin), `src/world/mountains.ts` (its columns), `src/world/sand-fall.ts` (the falling sand), `src/entities/sand-worm.ts` (its worm). The south cardinal destination of the secret rooms ([CARDINAL-WALK](../../../not-built/levels/secret-rooms/CARDINAL-WALK.md)). Its worm has its own document: [WORM](WORM.md).

The deep desert is a round basin of sand in the south of the Outer Void's desert, where a great worm lives under the sand. It is the place the backlog called "Gusanos de Dune"; the novel is credited as a reference ([SOURCES](../../../../lore/SOURCES.md), `dune`) and never named in the game.

## Documents

| Document | Contents |
|---|---|
| [README.md](README.md) | The place: where it is, how it is reached, its sand, what is under it |
| [WORM.md](WORM.md) | The worm: the cracks that announce it, its leap, riding its back, calming it from the head, steering it, the dismount and its rewards |

## How the player reaches it

- **Walk south.** From the tree, walk south (+z) through the Outer Void ([OUTER-VOID](../OUTER-VOID.md)): past the desert's blend at 1 250 blocks the dunes begin, and at **1 450 blocks** from the tree's axis the deep sand starts. The basin is centred **1 600 blocks** due south, **150 blocks** in radius. It is about five minutes of walking from the tree.
- **South only.** The basin is a formula of the tree's axis, not of the seed: every run puts it at the same place, and no walk north, east or west reaches it (`tests/worm-desert.test.ts`, three seeds). The cardinal walk of the design needs no trigger: reaching the basin is what counts.
- **No portal.** The design left the portal open ([CARDINAL-WALK](../../../not-built/levels/secret-rooms/CARDINAL-WALK.md)). The desert lies inside the endless Outer Void, so the walk itself is the way in; the portals of the other cardinal rooms are still open.

## The sand

- **Deep sand.** Inside the basin the ground is sand from its top down to the **bedrock, 100 blocks under the grass**. There is no lava sea and no lava trap under it (owner: no hell under the desert). Outside the basin the desert is as it was: three blocks of sand over stone, the lava sea under it, and the trap ten blocks down.
- **The ground.** Inside the rim the dunes flatten over 40 blocks into a low swell, two to four blocks above the grass, so the worm's back is the highest thing in sight. Neighbouring columns never differ by more than a block, across the rim too.
- **Sand falls.** Sand has no hold of its own, as in Minecraft: when the cell under a sand block turns to air (dug, cracked, blown up), the block falls cell by cell until it rests, and the sand above follows. Digging into the basin leaves the hole at the top: the column comes down to fill it. This is true of every sand block of the Outer Void (the desert's three blocks and the sea's shores too). The fall moves at most 48 blocks a step, so a collapse never stalls the frame; sand never falls into a cell the player's body stands in, and waits there until the body moves.
- **Digging.** Every cell of the basin's sand can be broken, down to the cell over the bedrock. The bedrock cannot.

## Once per run

The basin and its worm are in every run. The worm gives its gifts once per run: after the dismount it dives and does not rise again until the next run (the shared rule of the secret rooms, [secret rooms](../../../not-built/levels/secret-rooms/README.md#shared-rules)). The achievement is kept across runs, as every achievement is.

## Numbers

| Thing | Value |
|---|---|
| Centre of the basin | 1 600 blocks due south (+z) of the tree's axis |
| Radius of the deep sand | 150 blocks: its edge is the worm's wall (the head within 142, the body within 150) |
| Sand to the bedrock | 100 blocks under the grass |
| The basin's ground | 2 to 4 blocks above the grass, flattened over the last 40 blocks inside the rim |
| Falling sand | 48 blocks moved a step at most; 4 096 waiting at most |

## The mirror below

As above, so below ([COSMOLOGY](../../../../lore/COSMOLOGY.md) §1): the deep desert has no mirror in the depth yet. Open for the owner.

## What is not checked yet

- The art gate of [sotano-art](../../../../../.claude/skills/sotano-art/SKILL.md) (captures in `?gallery`, greyscale and colour-blind filters) was not run for the basin or the worm.
- The walk was not played in a browser end to end at walking speed.
