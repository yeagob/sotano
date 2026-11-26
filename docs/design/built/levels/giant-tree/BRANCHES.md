# The branches

Up: [giant tree](README.md) · Status: built (issue #329, the six main branches, 2026-11-26). Not seen in the browser yet.

The branches are the story that leaves the trunk. In the owner's words, each main branch is a mobility and jump trial: a classic platform course with its own mechanic, "challenging, not frustrating". Its difficulty rises along the branch, and the only punishment for failing is the fall. Six main branches leave the hall of the branch story. Each one is a limb of bough with a course above it. Each course ends in its ball of leaves, which holds a mobility practice at its centre.

## What the player meets

- **Six branches, every run, always the same.** Three leave east and three west, on three lines eleven blocks apart, because the world is wider east to west than north to south. Every layout and every jump distance is fixed: the seed does not change them, so a course can be learnt. The one thing the seed draws is the decoration of the beams' branch: six loose cubes of bough, eight to ten blocks over its course, out of every jump's reach.
- **Free order, one start.** Every branch starts in the same hall, the top story of the trunk, where the hollows' stair arrives. Take them in any order.
- **The limb.** Each limb leaves the hall at its floor through a tunnel in the wall. It is five blocks wide (three deep by the trunk, two out at the tip) and runs straight out to a round platform under its ball. A walk along the limb takes you to the tip, under the ball.
- **The course.** By the trunk, a short stair of three steps climbs from the limb to the start ledge, three blocks over the limb. The course then crosses about eighteen blocks of air, rising four blocks to the perch. The perch is a plank that runs through a hole in the side of the ball, into its hollow centre.
- **The fall.** A fall from any piece lands on the limb, three to seven blocks below. Walk back to the stair by the trunk and start again. No practice and no block is needed to get back.
- **The ball and its practice.** The ball of leaves is as before: radius five, eight blocks over the tip. It now has a hollow at its centre, a hole on the course's side for the perch, and a three-by-three eye on top that lets the sky in. The branch's practice floats in the hollow and is taken by touch, like the Leaves' gift. If you already hold that practice (from a room, say), its ball is empty.

## The six mechanics

The pieces of a course are whole blocks, and the moving ones move one block at a time. A body standing on a moving piece is carried with it. A block never appears inside a body: the piece waits until you are clear. Each mechanic has its own block, so a platform says what it does before you touch it ([DECISIONS](../../../../art/DECISIONS.md) §14.8).

| # | Branch | Mechanic | Block | How it rises in difficulty | Practice |
|---|---|---|---|---|---|
| 1 | east, north line | **Platforms moving sideways**, three wide, back and forth across the line | raft wood | the first moves one block either side every 3.2 s; later ones move two, and faster (one step every 0.4 s on the last) | Fartlek (Shift sprint, #263) |
| 2 | east, middle | **Platforms moving up and down**: board each one where it meets the step before, and ride it up to the next | raft wood | two blocks of travel, then three; the last cycles in 3.6 s | Double Jump (#293) |
| 3 | east, south line | **Platforms that give way** a set time after you first stand on them, and come back three seconds later | dry leaves | 1.2 s at first, then 1.0, 0.9, 0.8 and 0.7 s; the pieces narrow from three wide to two | Flow (faster movement) |
| 4 | west, north line | **Pairs that alternate**: landing on one colour brings the other, and the piece you leave goes. Jump to the other colour, never in place. Back on still ground for a second, the pairs reset | pale bough / shade bough | the zig-zag climbs a block every other hop | the wall jump (#294) |
| 5 | west, middle | **Platforms on a rhythm**: each is solid for part of a 3.2 s cycle, each one 0.8 s after the one before, so a wave runs out along the branch | breath leaves | solid 2.0 s at first, then 1.8 and 1.6 s | Irimi (dash, #261) |
| 6 | west, south line | **Narrow beams and single cubes in the air**: precision jumps | bough | a beam five long, single cubes on and off the line, a second beam, two cubes to the ball | Child's Pose (crouch, #262) |

**The jumps.** Every hop is made with one ground jump at base stats (rise 1.26, reach about 2.8 level and 2.0 at a block up). A hop up one block crosses one block of air. A level hop crosses at most two. Nothing asks more than one block up. The difficulty comes from timing and narrowness, never from a jump at its limit.

**Why each practice sits where it does.** Each practice sits on the course that asks the most of what it gives. The sideways movers reward running across them (Fartlek), and the lifts reward the extra jump. On the dry leaves speed is everything (Flow). The alternating pairs suit the wall bounce. The rhythm suits the dash's sense of timing. On the beams an edge is the danger, and the crouch never falls off one (Child's Pose).

## The six practices (owner, 2026-11-26)

The owner named the six in #329:

1. **Double jump**: item `double-jump` (#293). It is built on its own branch (`port/293-double-jump`) and merged later. Until then, its ball is empty.
2. **Faster movement, first**: the Shift sprint (#263). This is **Fartlek** (`fartlek`, its effect "Hold Shift to run 45% faster").
3. **Faster movement, second**: the owner left this "to identify". The build uses **Flow** (`flow`). It is the one built practice whose effect is a faster walk (move speed +30%) and that carries the movement tag. The other practices that raise move speed are a meal or potion stack (Mindful Eating, Nourishment, Tea Ceremony) or an all-stat practice (Satori), not a movement practice. **To confirm with the owner.**
4. **Wall bounce**: the wall jump, item `wall-jump` (#294). It is built on its own branch and referenced here by id. Until it is merged, its ball is empty.
5. **Dash**: Irimi (`irimi`, #261).
6. **Crouch**: Child's Pose (`balasana`, #262).

The Triple Jump is not one of the six: it is the Leaves' gift (LEAVES.md) and the sky's.

## All six in one run

The run holds the six branch practices at once, however each one was taken. At that moment the achievement **Every Way Out** (`tree.branches.all`, [ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md) §1) unlocks, and Camina Despacio is laid (#340, item `walk-slow`, built on its own branch). It goes on a pedestal at the centre of the branch story's hall: the room where every branch starts and the top of the trunk's climb (#328's core; the owner left the room "to define" and expected the core). The practice and its effect (a time control while crouched) are not built here. Only the hook is: if the build has no `walk-slow` item, nothing is laid. Until the double jump and the wall jump are merged, nobody can hold all six.

## Decorative limbs

There are none. Every limb of the branch story is a main branch with a course. The canopy's own boughs and the six long branches give the tree its silhouette, and a short limb that leads nowhere would read as a way to try.

The branches are the zone the HUD names "the branches". The sky starts to turn to night here.

Tested in `tests/tree-climb.test.ts`:

- Every seed grows the same six branches, each with its own mechanic and its still pieces in place. The seed changes only the beams' loose cubes, which lie high over the course.
- Every mechanic's block stands in the world once its course runs, for every seed.
- Each ball has a hollow centre reached on foot from the perch through its hole.
- The six practices are all different, and the built ones exist.
- The real Player at base stats (one ground jump, no block) crosses every branch, from its ledge to its ball's centre, with the moving pieces running.
- A fall lands on the limb, from which the stair leads back to the ledge. No piece is in jump reach from the limb.
- The pieces at run time: a slide carries its rider, a crumble goes and comes back, never inside a body, and the pairs alternate and reset.
- The gifts lie at the ball centres, and the hook's spot is open floor.

Code: `src/world/branches.ts` (the six plans, their layouts, `BRANCH_PRACTICES`), `src/world/course.ts` (the moving, giving-way, alternating and pulsing pieces at run time), `src/world/tree.ts` (the limbs, ledges, still pieces, balls and holes), `src/game/branch-gifts.ts` (the gifts, the moment, the Camina Despacio hook), `src/game/game.ts` (the courses before the body moves, the gifts at run start, the achievement's event).
