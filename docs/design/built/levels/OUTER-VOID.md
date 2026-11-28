# The Outer Void

Up: [built levels](README.md) · Status: built (issue #330, GEN_VERSION 41; the biomes GEN_VERSION 42) · Architecture: [LEVELS §14](../../../architecture/LEVELS.md#14-the-outer-void-issue-330) · Reference: the owner's voxel project for the procedural feel (issue #330, export v1)

## What the player finds

Past the initial zone (the plain, the ring of mountains and the far plain of [SURFACE](SURFACE.md)), the land does not end. It goes on in every direction, as far as the player walks.

- **The ground** rolls slightly: between ten blocks under the grass and thirteen above it, never a cliff between neighbours. Its relief grows over 96 blocks from the far plain's flat edge, so the seam is invisible.
- **Water** fills every low place up to the grass level: lakes and seas. Their beds are loam.
- **Trees** stand on the flat grass: a trunk of four to six logs, a canopy of leaves. **Bushes** are single leaf blocks on the grass. Both are seeded and never grow in water or on slopes.
- **Fog** closes the view at about 90 blocks, warm and dim, so the land reads as a horizon of silhouettes and the next trees appear as you walk.
- **Far out, four biomes** (below): the land changes as you walk north, south, east or west.
- **The deep desert** lies in the south of the desert: a basin of sand to the bedrock where a great worm lives (issue #354, [worm-desert](worm-desert/README.md)).
- **Nothing else** is placed there yet. The other three cardinal elements, the giant structures and the Boss Rush column (issues #331, #332) are not built.

## Biomes

The owner's brief: *walk far north, south, east or west and the biome changes; a desert to the south, an icy land to the north, a sea on one side with a small village, a harbour and a little boat, and a mountainous land on the other with a temple at the top; far away, at least two minutes of walking from the start of the Void.*

- **Where.** Nothing changes closer than **1 150 blocks** from the tree's axis (`BIOME_R` in `src/world/biomes.ts`, one constant for the owner to tune): the Void begins at 600, and 550 blocks is two minutes at walking speed (4.6 blocks a second). From 1 150 to 1 250 the biomes blend in. Inside 1 150 the Void is exactly what it was.
- **Which.** The direction from the tree's axis picks the biome: **east (+x) the sea, south (+z) the desert, west (−x) the mountains, north (−z) the ice**, each a quarter of the circle. A slow noise bends the borders by up to 0.35 radians, so they wander rather than run straight, and the ground's height blends across them so it never steps; the top blocks switch where one biome takes over.
- **Sea (east).** The Void's own relief, lowered under the water (from about 2 to 10 blocks deep). Its bed and its shores are sand.
- **The stilt village** stands once per run in the east, 1 250 to 1 400 blocks from the axis, in open water (the bed is carved down to 8 blocks under the surface round it). Five houses of crate walls with log corners, a door toward the walkway and small windows, roofs stepped in flagstone or stone, and a crate in a corner; each on a 9 × 9 deck on log posts that stand on the sea bed. A walkway joins the houses, a dock runs 17 blocks out to sea and ends in a T with two log bollards, and beside the dock floats a rowboat (7 × 3: a crate hull at the water's level, a rim of logs and a seat). Everything is made of blocks the game had; no text, no items.
- **Desert (south).** Dunes of sand from 1 to 12 blocks above the grass (two crossing waves and the Void's noise), sand three blocks deep over stone. No trees, no water, except where it blends into a neighbour. From 1 450 to 1 750 blocks due south lies the deep desert, where the sand goes down to the bedrock with no lava under it ([worm-desert](worm-desert/README.md)).
- **Mountains (west).** A massif of eight seeded peaks, the highest **100 blocks** above the grass and the others 46 to 84, round the highest. Every slope rises at most **one block between neighbours** (the peaks are cones of slope 0.6 with a gentle roughness, and the highest of them all), so every summit is climbed by jumping. Grass and trees in the foothills, bare stone from about 24 to 36 blocks up with patches of ice above 50, and an ice cap above about 84 to 92.
- **The temple** stands on a flat round summit of the highest peak (14 blocks of plateau, at 100), at least 200 blocks past 1 150. Three tiers of ashlar (19 blocks across with its stairs, then 11, then 7), a stair of flagstone on each of the four sides that climbs one block a step from the plateau to the top tier, and on the top tier a flagstone floor, four brass pillars, an altar of star stone, and an ashlar roof crowned with brass. Its foundation fills down to the ground wherever the summit is lower.
- **Ice (north).** A frozen lowland of small relief: ice on the low ground and in wide patches, bare stone between. Its lakes are frozen: two blocks of ice over the water. Spires of ice (a column of four to six blocks on a wider foot) rise here and there. No trees.
- **New block:** **sand** (`sand`, packed with the pale stone's warm ramp and the earth pattern, so it reads as rippled sand). The rest are blocks the game had: ice, stone, crate, log, leaves, flagstone, ashlar, brass frame, star stone.

## Digging

Inside the initial zone the ground is still fixed (decision 8 of [WORLD-STORAGE](../../not-built/levels/WORLD-STORAGE.md)). In the Outer Void the player can break the soil and the blocks that stand on it. The bedrock under the lava sea cannot be broken, and nor can the lava.

## The lava trap

The sea of lava lies under the ground, about twenty-two blocks under the grass, sealed by soil above and bedrock below. You cannot see it from above.

- When the player's feet reach **ten blocks under the local ground**, the ground opens round them: a pit nine blocks wide and deep as the feet, down to the lava.
- They fall into the sea and it kills them. Nothing saves them there: no shield, no invulnerability, no post-traumatic lava walk, no Waymark revive. The death is the lava's own.
- Around the pit, five projections of the roster rise at the lava's level, burning. They are neutral: they do not attack the player, they dissolve in the lava.
- The death screen says that the lava held you, as it does elsewhere.

The owner's brief for the issue said fifteen blocks; this round the owner asked for about ten, and the build follows the round (`TRAP_DEPTH` 10 in `src/world/void.ts`). Say so if the depth changes.

## Numbers

| Thing | Value |
|---|---|
| Edge of the initial zone | 600 blocks from the tree's axis |
| Relief | from -10 to +13 blocks above the grass |
| Water level | the grass |
| Lava sea | from 22 to 30 blocks under the grass (bedrock at 31) |
| Trap | 10 blocks under the ground, a 9 × 9 pit |
| Fog | from 6 to 90 blocks |
| Chunks drawn round the player | 96 blocks in the Void (176 on the plain) |
| Biomes | from 1 150 blocks from the axis, blended in over 100 |
| Mountains | eight peaks, the highest 100 blocks above the grass, slopes of at most one block |
| Temple | 19 × 19 blocks, 15 high, on the summit at 100 |
| Village | 1 250 to 1 400 blocks out to the east, five houses, a 17-block dock, a 7 × 3 boat, water 8 deep |
| Dunes | from 1 to 12 blocks above the grass, sand 3 deep |
| Frozen lakes | 2 blocks of ice over the water |

## Checked

- In a browser (dev server, a random seed, teleporting with `spawnAt`): each biome, the village from its dock and from a roof, the boat, the temple from its plateau and from inside its shrine, the slopes of the massif, the seam at 1 150. The Void's lakes were not drawn before this change (the streamed chunks never queued their element layer); they are now.
- Captures in greyscale of the ice, the desert, the village, the temple and the mountain slope: the blocks part by value (sand pale, ice mid, stone and ashlar darker, crate and log mid-dark).

## What is not checked yet

- The rest of the art gate of [sotano-art](../../../../.claude/skills/sotano-art/SKILL.md): the colour-blind filters, captures in `?gallery`, and a dedicated art pass on the ground, the water and the fog colour (`fog.warm` is reused in every biome, so the desert, the ice and the sea share the same warm haze).
- The look of the biomes is the build agent's; the owner has to confirm the sand's colour, the village and the temple.
- The lava trap still opens ten blocks under the local ground everywhere, so a tunnel dug into a mountain ten blocks under its slope opens a shaft to the lava through the whole mountain.
- The fog closes at 90 blocks, so the summit does not see far; and the plain Void's view radius (96) is kept for the mountains.
- The three-party architecture review of [LEVELS §14](../../../architecture/LEVELS.md#14-the-outer-void-issue-330) (engineer, architect and mediator).
- Placing blocks out there: the breaking is wired, placing is not verified.
