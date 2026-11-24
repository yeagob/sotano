# The stars (heaven)

Up: [giant tree](README.md) · Status: built.

The stars are the last story of the tree: the sky above the crown, the place the HUD calls heaven. A disc of bough stands above the crown, and from it the star pads rise into the sky, each pad carrying you to the next. The owner's line: a star map of constellations, with teleport doors and views of the cosmos. The build has the pads and the night; the constellations are placed in the heaven zone, and where they belong is an open question (see [TREE-CONSTELLATIONS](../../../not-built/levels/TREE-CONSTELLATIONS.md)).

## The disc

A disc of bough, nine blocks in radius and two thick, lies over the stair from the canopy. It is the landing where you arrive from below.

## The pads

- **Starstone.** Each pad is a three-by-three platform of starstone, the hardest material of the tree (tier 3, 60 points of hardness), a fixed point to steer by.
- **Three constellations.** Three groups of four to six pads each spiral out from the tree's centre, rising as they go. Their heights and distances vary per run.
- **The first pad.** One pad lies six blocks from the disc, towards the tree's centre.
- **The chain.** Stepping onto a pad carries you to the next one. The pads form one chain: each carries you to the next in the order they were made, and the last carries you back to the first. A particle burst and a chime mark each jump.

The chain is one ring, not three: the design's constellations are groups of stars, and the build's chain runs through all of them in order.

## The way from the crown

The stair from the canopy rises past the Leaves and comes out on the disc; the first pad lies on the disc, so you walk onto it. From there the chain carries you: on each pad you were carried to, step off its centre onto its edge and back, and you are carried to the next. The last pad of the chain leads up into the sky. The pads themselves are too far apart to jump between (in the seeds tested, 8 to 32 blocks apart, and the first pad of the sky 16 to 19 blocks above the disc's, more than the Triple Jump's 14): the chain is what crosses them. The jump practice waits in the Leaves on the way up ([LEAVES](LEAVES.md), issue #316). Tested in `tests/leaves-gift.test.ts` with the real player body, from the ring of the Leaves to the last pad.

## The night

From the branches up, the sky turns to night: the fog takes the night colour, and the stars come out as points of light. The night is smooth, not sudden: it grows from the branches to the top of the sky. Here the stars are never a warm light: they are the cold points of the cosmos.

## The top of the sky

The top of the sky is the end of the tree. Heaven is where you land when silence carries you up (see [SILENCE](../floors/SILENCE.md)), and falling back into the top of the sky takes you to silence.

Code: `src/world/tree.ts` (the disc, the pads, the chain), `src/game/game.ts` (the star pads as steps, the night sky, the zone name), `src/content/materials.ts` (starstone).
