# The stars (heaven)

Up: [giant tree](README.md) · Status: built.

The stars are the last story of the tree: the sky above the crown, the place the HUD calls heaven. A disc of bough stands above the crown, and from it the star pads rise into the sky: a route of starstone the Triple Jump climbs, pad by pad, to the last one, under a layer of cloud that leads up. The owner's line: a star map of constellations, with views of the cosmos. The build has the pads, the route, the cloud layer and the night; the constellations are placed in the heaven zone, and where they belong is an open question (see [TREE-CONSTELLATIONS](../../../not-built/levels/TREE-CONSTELLATIONS.md)).

## The disc

A disc of bough, nine blocks in radius and two thick, lies over the stair from the canopy. It is the landing where you arrive from below.

## The pads

- **Starstone.** Each pad is a block of starstone, the hardest material of the tree (tier 3, 60 points of hardness), a fixed point to steer by. Its footprint is solid starstone, one layer thick, under its centre cell.
- **Positions are fixed.** The pads' centre cells and heights are the same on every seed. Only their sizes vary (below), so a seed changes how the stars look, never where the route goes.
- **Sizes vary.** Each pad, the disc's pad and every bridge pad, takes one draw from the tree's seeded RNG and changes its width from three blocks across: a loss of one to three blocks, never below one block across (so a loss of two or three leaves one block), or a gain of one or two blocks (widths 1, 2, 4 and 5). The footprint grows or shrinks from the centre cell, and the centre cell is always well defined (for an even width, the lower of the two middle cells). A gain of three blocks is not drawn: a six-wide pad above a rise of nine blocks blocks the body's pass beside it, and the route's walk fails (tests/star-pads.test.ts).
- **The first pad.** One pad lies six blocks from the disc, towards the tree's centre.
- **Three constellations.** Three groups of five pads each spiral out from the tree's centre, rising as they go. Their radii, angles and heights are fixed values in `src/world/tree.ts`. Four pads are set three blocks further out than the spiral gives them, which lengthens the hops into and out of them: constellation 0's third pad, constellation 1's second and fourth, and constellation 2's fifth (written `0.2`, `1.1`, `1.3`, `2.4` as `constellation.pad`).
- **Bridges.** Every hop of the route, from the disc to the first pad and from pad to pad, is one the Triple Jump can make: at base stats, its gap is at most 0.8 of the reach of its rise (`reach` in `sky/totality/reach.ts`). Where a hop is too long or too high, intermediate pads are put between its ends, swung sideways where the straight line would not clear the pad above. A hop that climbs also leaves room to pass the pad above beside it: the gap is at least 1.8 blocks plus 0.45 per block of rise. The bridges are chosen from the base pads alone, with no randomness (`bridgePads`, `padHopFits` in `src/world/tree.ts`, issue #325).
- **The top pad.** The last pad of the route. It carries the flag `up`, and the cloud layer lies above it (below). Standing on it does nothing by itself.

## The cloud layer

Above the top pad, six blocks above its floor, lies a layer of cloud with a reach of five blocks across its centre (`CLOUD_RISE`, `CLOUD_RADIUS`, `cloudAbove` in `src/world/tree.ts`). It has no solids: the voxel world never sees it, and the body passes through it. It is drawn as a flat sheet of soft cloud in the cloud tokens of the sky blocks (`src/game/cloud-layer.ts`).

When the body's feet reach the cloud's height, within its reach over the top pad, the sky realm opens (SKY.md §2.4): the gate runs its fade, and you arrive on the sky's deck. The height is checked on the feet, so jumping up through the layer enters the sky. The Triple Jump reaches it from the pad: the second air jump's apex is about 13.9 blocks above the floor, so 6 blocks is in reach with two air jumps.

## The route

The pads carry no teleport. Stepping onto a pad does nothing: the route is the order the pads were made in, and you walk it with the jumps. The Triple Jump gives two air jumps at most as its first copy; a second copy adds one more air jump (a fourth jump), and a third copy adds nothing, so the stat stops at three. No jump has a height cap, so a jump-height practice only makes each hop easier to reach.

The pads keep their cells for the whole run: they are made once, when the tree's stars are grown, and never change.

## The way from the crown

The stair from the canopy rises past the Leaves and comes out on the disc; the first pad lies on the disc, so you walk onto it. From there the route is climbed with the Triple Jump: each hop is a jump from one pad's centre, with an air jump at each apex, to the next pad. The jump practice waits in the Leaves on the way up ([LEAVES](LEAVES.md), issue #316). Tested in `tests/star-pads.test.ts` (every hop fits, the real player body crosses the route by jumps on several seeds, and the same route fails without the Triple Jump) and in `tests/leaves-gift.test.ts` (from the ring of the Leaves to the top pad, and by the jumps from the top pad into the cloud layer).

## The night

From the branches up, the sky turns to night: the fog takes the night colour, and the stars come out as points of light. The night is smooth, not sudden: it grows from the branches to the top of the sky. Here the stars are never a warm light: they are the cold points of the cosmos.

## The top of the sky

The top of the sky is the end of the tree. Heaven is where you land when silence carries you up (see [SILENCE](../floors/SILENCE.md)), and falling back into the top of the sky takes you to silence.

Code: `src/world/tree.ts` (the disc, the pads, the sizes, the bridges, the route, the cloud spot), `src/game/cloud-layer.ts` (the cloud's look), `src/sky/gate.ts` (the cloud gate), `src/game/game.ts` (the night sky, the zone name), `src/content/materials.ts` (starstone).
