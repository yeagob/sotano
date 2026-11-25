# The branches

Up: [giant tree](README.md) · Status: built (the owner's seven branches, 2026-11-25).

The branches are the story that leaves the trunk. The owner's line for it is a three-dimensional map: platforms and hollows in every direction, joined by branches. The build grows exactly seven limbs from a trunk of old bark, boughs of their own smooth bark (see [BARK](BARK.md)), long, wide and thick, each one rising as it leaves and each ending in a ball of leaves.

## What the player meets

- **Seven limbs, every run.** Seven limbs leave the hall, spread round the trunk. A limb never leaves through one of the hall's two stairs, and limbs are kept at least 26 degrees apart where they leave, so each is its own way out; out in the air, no two limbs come within six blocks of each other.
- **From the floor.** A limb starts on the hall's floor, flush with it or one block up, and leaves through a tunnel four blocks high cut in the wall. You walk onto it from the hall.
- **Wide and thick.** At the trunk a limb is five blocks wide and three deep; it thins as it goes, to three wide and two deep at the tip.
- **Long.** A limb runs out about forty blocks from inside the wall, and never fewer than twenty-eight out of the trunk. The world is wider east to west than north to south, so a limb that leaves toward the north or the south bends, a little every block, toward the east or the west, and runs on along the long side of the world. Each limb rises a block every four to six blocks of its length.
- **Tips.** Each limb ends in a round platform of bough, with its ball of leaves above it, a few blocks over the platform, the place where you stand and see out. The balls are the same as before this change: leaves round a centre eight blocks over the tip (lower where the story's ceiling is near).

## What a limb asks of you

Each limb carries one course of obstacles on the way to its ball. The obstacles stand out of the trunk, where the limb is level for two blocks either side, a third and two thirds of the way from the wall to the tip (the beam stands half way).

| Course | What you meet | How you pass |
|---|---|---|
| **Breaks** | the limb is broken twice, a gap one or two blocks long across its whole width | a ground jump (it carries about 2.8 blocks); or lay a block |
| **Knots** | two knots of bough across the limb's whole width, two blocks over its top | break the knot, or lay a block and climb |
| **Tufts** | two tufts of leaves across the limb, three blocks high | break through (leaves give way to a hand), or burn them |
| **Narrows** | for six blocks the limb thins to a beam about one block wide, with the drop on either side | walk the beam |
| **Bare** | nothing: the walk out | walk |

**Which limb gets which.** One switch decides it for the whole tree. Its default deals every obstacle once to four limbs, in an order drawn from the seed, and draws the other three limbs' courses from the seed among the four obstacles, so one climb shows them all and every limb has an obstacle. The switch can instead give every limb one course, bare included, so the owner can try each variation (owner, 2026-11-25: the owner tests the variations later).

A fall off a limb is a fall to the ground below the tree, as it always was.

## The ball's practice

The owner describes the ball of leaves as holding a practice in its middle, with holes in its leaves to reach it. The build has no practice in any ball: the balls are leaves only, solid, over an empty platform. That is not built here and is not invented: it waits for the owner's word on which practice and how it is reached.

The branches are the zone the HUD names "the branches", and the sky starts to turn to night here.

Tested in `tests/tree-climb.test.ts`: for 24 seeds and every course (the default and each one forced), exactly seven limbs, each long, each with its platform of bough and its ball of leaves, and no two limbs close; the default deals every obstacle in every seed; every limb's tip is reached on foot from the hall (over a break, a break being at most two blocks; through a knot or a tuft once broken), and a knot or a tuft stops the walk until it is broken.

Code: `src/world/tree.ts` (`BRANCH_COUNT`, `BRANCH_COURSE` the switch, `BranchCourse`, the limbs, their tunnels, obstacles and tips), `src/game/game.ts` (the zone name, the night sky from the branches up).
