# The Leaves (the room of the crown)

Up: [giant tree](README.md) · Status: built. Owner decision D14 of #149: the Leaves are a room.

The Leaves are the one room of the giant tree: a hall of leaves high in the crown, beside the last stair, with a ring of starstone at its centre and an open eye in its dome where the sky comes in. Idea: seeing the whole. Verb: climb, stand in the ring, look up. It is the crown's place, the top of the tree that the rest of the game points to (the Listener's Light, decision D4, is placed there by its own change).

## Where it is

- **In the canopy story**, the story the HUD calls the leaves, on the side of the stair that climbs from the canopy to the stars: the room hangs east of that stair, and its doorway opens onto the step whose tread points east.
- **Its height.** The stair offers two such steps; the room takes the one that keeps it inside its band: its floor stands 14 blocks over the canopy's floor (128 blocks above the grass), its shell from 126 to 137, eight rows clear of the stars story above.
- **The same in every run.** The tree stands at the world's centre, and the room is placed by the tree's shape, not by the seed. It is carved the first time the canopy grows, last, so a limb or the crown's leaves that reach into it give way to it.

## What the player meets

- **The way in.** Climbing the last stair, one step opens east onto a short floor of bough through the wall of leaves: three blocks wide, three high.
- **The hall.** Thirteen by seven blocks, eight high under a dome of leaves, a floor of bough. Bough terraces stand in the four corners (three high at the ends, two beside them) and four low posts by the north and south walls: steps to stand on and look from.
- **The ring.** Seven starstone blocks, one high, ring the centre, open to the west: you step over or walk in. The starstone is the tree's fixed point (tier 3), the same stone as the star pads.
- **The eye.** Over the ring the dome is open, three by three, up through the crown to the top of the story: from the centre you see the sky, and at night its stars.
- **Leaves give way.** The walls and the dome are leaves (and young leaves), so a hand or an intention opens a window anywhere; they burn like all leaves. Only the west doorway is open when the room is carved.
- **Its name.** The first time you stand in it in a run, a toast says *The Leaves, at the top of the tree*.
- **The gift (issue #316).** The jump practice, the [Triple Jump](../../player/TRIPLE-JUMP.md), floats over the ring's east stone, the one-high block of starstone that faces the ring's open west side, as a pedestal's practice floats over its pedestal. It is there from the start of every run. Standing in the ring, or stepping up to the stone, takes it, with the usual banner. It is the crown's reward for the climb (owner, issue #316): the crown starts the ascent through the sky, and the star pads above are the climb to the sun ([STARS](STARS.md)). The centre of the ring stays free for the crown's place. If you already hold the Triple Jump (the horse's gift), it leaves the stone, so it is never given twice.

No projections and no element live in the Leaves: the tree holds none yet (see [README](README.md)). The Star-reader keeps its quiet room on its Tree floor (decided with D14, see [STAR-READER](../../presences/STAR-READER.md)).

## The room in the levels' grammar

The Leaves are a room template like any floor's (`crown-leaves`): the 13 × 7 grid, `height` 8 with a `dome` ceiling, and the validator's rules (open door approaches, an open centre that reaches a door, headroom over every terrace). The crown's palette stands in for a floor's: walls and ceiling of leaves, floor and terraces of bough, and `o` (obsidian on a floor) in starstone. It is never drawn by a floor's generator.

## The band (sotano-levels check)

| Rule | The Leaves |
|---|---|
| Interior height ≤ 8 | 8 |
| Shell over the band's floor | the floor's two rows of bough stand 14 rows over the canopy's floor slab |
| Rows clear under the band above | 8 (at least 3 asked, as the three rock layers between floors) |
| Pits and pools | none |
| The way through stays clear | the stair's cells are untouched; the doorway starts outside the stair's tread |

Tested in `tests/crown.test.ts`: the template validates, the room is carved as drawn (floor, walls, ring, eye, doorway) for several seeds, it stays inside the band, and a walker climbs the last three steps of the stair, crosses the doorway and stands in the ring.

Tested in `tests/leaves-gift.test.ts` (issue #316), with the real player body: the gift's stone is starstone with open air over it; a walker climbs into the Leaves, stands in the ring and steps up to the stone, within reach of the practice (the game's own touch rule, `reachesItem`); then, holding it, it walks back out of the doorway, up the rest of the stair onto the disc, onto the first star pad, and rides the pads' chain (the game's own rule, `padUnder` and `padTravel`) to the last pad, where the gate takes it up into the sky.

Code: `src/content/crown.ts` (the template, the crown's palette and `LEAVES_GIFT`), `src/world/tree.ts` (`leavesRoomAt`, the carving in the canopy), `src/world/crown.ts` (`CROWN_PLACE`, the one constant for the crown's place, and `LEAVES_GIFT_SPOT`), `src/game/game.ts` (the toast, `placeLeavesGift`).
