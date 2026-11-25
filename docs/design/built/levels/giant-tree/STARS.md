# The stars (heaven)

Up: [giant tree](README.md) · Status: built.

The stars are the last story of the tree: the sky above the crown, the place the HUD calls heaven. A disc of bough stands above the crown, and from it the star pads rise into the sky: a route of starstone the Triple Jump climbs, pad by pad, to the last one, which leads up. The owner's line: a star map of constellations, with views of the cosmos. The build has the pads, the route and the night; the constellations are placed in the heaven zone, and where they belong is an open question (see [TREE-CONSTELLATIONS](../../../not-built/levels/TREE-CONSTELLATIONS.md)).

## The disc

A disc of bough, nine blocks in radius and two thick, lies over the stair from the canopy. It is the landing where you arrive from below.

## The pads

- **Starstone.** Each pad is a three-by-three platform of starstone, the hardest material of the tree (tier 3, 60 points of hardness), a fixed point to steer by.
- **Three constellations.** Three groups of four to six pads each spiral out from the tree's centre, rising as they go. Their heights and distances vary per run.
- **The first pad.** One pad lies six blocks from the disc, towards the tree's centre.
- **Bridges.** Every hop of the route, from the disc to the first pad and from pad to pad, is one the Triple Jump can make: at base stats, its gap is at most 0.8 of the reach of its rise (`reach` in `sky/totality/reach.ts`). Where a hop is too long or too high, intermediate pads are put between its ends, swung sideways where the straight line would not clear the pad above. A hop that climbs also leaves room to pass the pad above beside it: the gap is at least 1.8 blocks plus 0.45 per block of rise. The bridges are chosen from the base pads alone, with no randomness, so a seed always gets the same pads (`bridgePads`, `padHopFits` in `src/world/tree.ts`, issue #325).
- **The up pad.** The last pad of the route leads up into the sky: stepping on it opens the sky realm (SKY.md §2.4).

## The route

The pads carry no teleport. Stepping onto a pad does nothing: the route is the order the pads were made in, and you walk it with the jumps. The Triple Jump gives two air jumps at most, however many copies you hold, and no jump has a height cap, so a jump-height practice only makes each hop easier to reach.

The pads keep their cells for the whole run: they are made once, when the tree's stars are grown, and never change.

## The way from the crown

The stair from the canopy rises past the Leaves and comes out on the disc; the first pad lies on the disc, so you walk onto it. From there the route is climbed with the Triple Jump: each hop is a jump from one pad's centre, with an air jump at each apex, to the next pad. The jump practice waits in the Leaves on the way up ([LEAVES](LEAVES.md), issue #316). Tested in `tests/star-pads.test.ts` (every hop fits, the real player body crosses the route by jumps on several seeds, and the same route fails without the Triple Jump) and in `tests/leaves-gift.test.ts` (from the ring of the Leaves to the up pad).

## The night

From the branches up, the sky turns to night: the fog takes the night colour, and the stars come out as points of light. The night is smooth, not sudden: it grows from the branches to the top of the sky. Here the stars are never a warm light: they are the cold points of the cosmos.

## The top of the sky

The top of the sky is the end of the tree. Heaven is where you land when silence carries you up (see [SILENCE](../floors/SILENCE.md)), and falling back into the top of the sky takes you to silence.

Code: `src/world/tree.ts` (the disc, the pads, the bridges, the route), `src/game/game.ts` (the up pad, the night sky, the zone name), `src/content/materials.ts` (starstone).
