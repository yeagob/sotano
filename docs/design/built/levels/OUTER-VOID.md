# The Outer Void

Up: [built levels](README.md) · Status: built (issue #330, GEN_VERSION 41) · Architecture: [LEVELS §14](../../../architecture/LEVELS.md#14-the-outer-void-issue-330) · Reference: the owner's voxel project for the procedural feel (issue #330, export v1)

## What the player finds

Past the initial zone (the plain, the ring of mountains and the far plain of [SURFACE](SURFACE.md)), the land does not end. It goes on in every direction, as far as the player walks.

- **The ground** rolls slightly: between ten blocks under the grass and thirteen above it, never a cliff between neighbours. Its relief grows over 96 blocks from the far plain's flat edge, so the seam is invisible.
- **Water** fills every low place up to the grass level: lakes and seas. Their beds are loam.
- **Trees** stand on the flat grass: a trunk of four to six logs, a canopy of leaves. **Bushes** are single leaf blocks on the grass. Both are seeded and never grow in water or on slopes.
- **Fog** closes the view at about 90 blocks, warm and dim, so the land reads as a horizon of silhouettes and the next trees appear as you walk.
- **Nothing else** is placed there yet. The four cardinal elements, the giant structures and the Boss Rush column (issues #331, #332) are not built.

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

## What is not checked yet

- The art gate of [sotano-art](../../../../.claude/skills/sotano-art/SKILL.md): captures in greyscale and the colour-blind filters, and a dedicated art pass on the ground, the water and the fog colour (`fog.warm` is reused).
- The three-party architecture review of [LEVELS §14](../../../architecture/LEVELS.md#14-the-outer-void-issue-330) (engineer, architect and mediator).
- Placing blocks out there: the breaking is wired, placing is not verified.
