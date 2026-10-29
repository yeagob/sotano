# Giant panda: the first guardian (sky floor 1)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The giant panda is the first deity the player meets above the surface: a giant panda head on a small, soft plush body, over sky floor 1. It is the gentlest guardian and the one that teaches the sky's platforming.

Status: proposal, specified. Decided: the animal and the floor order, that the panda levitates, that it is defeated by stitching it with many positive shots and never dies, and the tower rule (B2). The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

A small, soft, black-and-white plush body under a giant panda head, heavy-lidded, levitating at the height of the floor's tallest column. The panda is unhurried. In the wild it spends most of its day eating and resting, moving only when it has to. As a guardian it does not chase the player. It waits, and it asks the player to slow down.

**Mirror (proposal).** The panda mirrors rushing: the habit of never stopping long enough to rest, eat well or notice where you are. Its floor answers that pattern with pauses. The player who climbs slowly, one block at a time, is the player who passes. The practice the panda points to is patience: taking the time a climb needs.

The panda does not judge the player's speed. It is a guardian of rest, not a test of reflexes.

## 2. Floor order

Sky floor 1, the first of the five. It is the first floor the player meets in the sky, so it is the easiest and it teaches the sky's rules: nothing stays broken, negative shots do nothing, and every hindrance warns first.

## 3. Minions

The minions are the panda itself, embodied as smaller pandas. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Pandas roll, sit and slide down slopes. A panda minion moves slowly and sits down when it is not moving, blocking a path by being there. When it gets up it rolls along the floor, and it can roll down a column with the player on it.
- **Character.** Calm, not aggressive, curious when approached. It does not strike the player. Its danger is weight and position: it sits in the way and rolls in the way.
- **Rules tied to the animal.** A minion breaks blocks by chewing them, one at a time, which is slow and visible. A minion does not leave the floor and does not chase the player up a column faster than a panda moves.

## 4. Arena and puzzle

**The arena.** The whole floor is a grove of columns made of stacked blocks, some tall, some low, with slopes between them. The player climbs by building and by jumping, and the highest column is the route to the panda's level.

**The platforming.** Vertical climbing on stacked columns. The floor is the easiest of the five: its gaps are short, its heights are small steps, and its routes are wide.

**The puzzle (proposal).** The panda makes the floor dense around its seat, so walking slows, and the player must climb by building a staircase rather than walking across. The answer is to build up, not to cross: each step built is a block the player keeps (section 3.2 of the realm README).

**Hindrances used (proposal).**

- [Dense ground](../abilities/DENSE-GROUND.md): the panda's weight presses the floor into a denser state around it.
- [Opening holes](../abilities/OPENING-HOLES.md): when the panda sits down, a cell of the floor gives way, always after a warning.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at a panda minion turns it into an ally (decided, see [minions](../minions/README.md)). This panda ally, proposal:

- sits on a block the player is building, so the block stays put while the player climbs over it;
- rolls down a slope to clear a minion that stands in the way.

## 6. The stitch

The player defeats the panda by stitching it with many positive intentions ([guardians](README.md#1-the-shared-contract)). It does not die. When it is stitched it transforms, changes its attitude, or leaves; which one is open. Proposal: it changes its attitude: it sinks slowly from the air onto its seat, wide awake and friendly, and it stays on the floor.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, the stitch, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A big, sleepy head that chews. The panda never hurries: every attack is slow, long-telegraphed and soft, and its longest state is rest. The floor teaches the sky's three rules in order: blocks come back, negative shots go out with a puff, and every hindrance warns first.

### B2. The deity

**Position.** The panda's seat is the top of the Bamboo Seat, the tallest column, in the centre of the floor, at target 24 blocks above the ground. The panda levitates (decided): it floats target 1.5 blocks over the seat and drifts slowly round it.

**Teleport (which deity: open).** If the panda is one of the deities that teleport, a teleport would fit after the tower rule: instead of floating back to its seat, it vanishes and reappears over the seat, always far from the player.

**The tower rule (decided).** If the panda detects that the player is building a tower that reaches its height, it leaves its floor, knocks the tower down and pushes the player off it.
- *Trigger:* the player stands on a tower, a stack of target 3 or more player blocks, whose top puts them within target 2 blocks of the panda's height (target 22 blocks or higher). The floor's own columns, the ledge strip and single placed steps never trigger it.
- *Telegraph (target 2 s, longer than its attacks):* the panda stops chewing, turns its whole body to the tower and stares; the tower's blocks shake and a warm outline runs down the stack from top to bottom, with a rising grumble.
- *Act:* the panda leaves its seat and floats to the tower, nudges it with its shoulder so the stack topples from the top down, and gives the player a soft push of target 2 blocks off it. The player falls to the ground or a lower column, unhurt. Then the panda floats back to its seat and is Recovering there. What becomes of the toppled blocks is open ([sky, open questions](../README.md#5-open-questions)).
- *Answer:* step off the tower onto an original column or the seat's ledge strip before the telegraph ends, or do not stack a tower to its height: climb the grove, the gentle path or the ledge strip, which the panda never knocks down. While it floats to the tower and back, its seat is empty and the panda is close to the player: a positive intention stitches it as usual.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Idle | Chews a bamboo stalk, eyes half shut | 4 to 6 s |
| Watching | The head turns slowly to follow the player; starts when the player is within 12 blocks or above height 8 | until an attack, after a rest |
| Attacking | One attack (B3), telegraph 1.4 s | per attack |
| Recovering | Leans back, belly up, a contented sigh | 2.5 s |
| Hurt | A slow blink and a soft "mm" when a stitch lands | 0.3 s |
| Rallying | Yawns and stretches when the stitches reach a third and two thirds of the target; the minions sit up and look at it | 2 s |
| Napping | At two thirds of the stitches: falls asleep over the seat. No attacks; the minions slow down | 5 s, once |
| Tower watch | Stares at a tower that reaches its height (tower rule, above) | 2 s, then it leaves its seat |

**The cycle.** Idle, Watching, Attacking, Recovering, Watching. The rest between the end of one recovery and the next telegraph is target 3.5 s in the first stage, 3 s in the second and 2.5 s in the third (stages: [guardians, section 6.5](README.md#65-the-stitch)). For comparison, built bosses rest only a short walk between moves, shorter in each phase ([fight flow](../../../built/bosses/FIGHT-FLOW.md)).

**The rest beat (the panda's own rule).** When the player stands still on any column top for target 2 s while the panda is Watching, the panda's next attack waits target 2 s more. The mirror is rushing; the floor answers it with pauses that are rewarded.

### B3. Attacks

The panda has four attacks. The first stage uses Bamboo toss and Heavy press. The second adds Sit-down. The third adds Yawn. An attack is never repeated back to back when another is available (as in the built fight flow).

**1. Bamboo toss (a lob).**
- *Telegraph (1.4 s):* the panda lifts a stalk over its head; a warm mark appears where it will land, aimed at where the player is going.
- *Act:* the stalk lands and stands upright as a one-block bamboo stump for target 6 s, then dissolves. A stump that lands on the player gives a soft knockback of target 1 block and may take target 2 points (harm is open).
- *Answer:* move off the mark. A block in the arc stops it: lobs stop at solid blocks ([attacks](../../../built/encounters/ATTACKS.md)). A positive intention that meets the stalk in flight turns it into a falling leaf (proposal). A stump that lands is also a step: the player may use the panda's own bamboo to climb.

**2. Heavy press ([dense ground](../abilities/DENSE-GROUND.md)).**
- *Telegraph (1.4 s):* the panda presses both paws down; the chosen cells ripple, darken and turn glassy, with a low rising sound. The cells are a band of target 3 by 3 on the column top the player stands on or is jumping to, or the ground ring within target 5 blocks of the seat.
- *Act:* the cells are dense for target 5 s. Walking on them is slowed to target 50% of the player's pace. Jumps keep their normal height.
- *Answer:* jump out, or build over (player blocks are not changed). A positive intention at a dense cell returns it to ordinary ground at once (proposal). A block does not stop it: it changes the floor, not the air.

**3. Sit-down ([opening holes](../abilities/OPENING-HOLES.md)).**
- *Telegraph (1.4 s):* the panda shifts its weight with a deep "whump"; crack lines and dust mark target 1 to 2 cells on a column top, never the whole top.
- *Act:* the cracked cells sink out for target 4 s, then close. The rest of the column top stays, so a route off it is always there.
- *Answer:* step off the cracks, jump across (1 or 2 cells), or build over (a hole never opens in a player block). A positive intention at a cracked cell closes it before it opens (proposal). A player standing on a player block is never under a hole.

**4. Yawn (a ring, with [knockback](../abilities/KNOCKBACK.md)).**
- *Telegraph (1.4 s):* the mouth opens wide, slowly; a ring of drowsy air forms round the seat at the seat's height and at the height of the player's column top.
- *Act:* the ring grows outward at target 6 blocks a second, target 0.8 blocks high (the built ring's jump height), out to target 10 blocks. It gives a soft push of target 1.5 blocks away from the seat.
- *Answer:* jump it, or stand behind a block (a block stops the push, per the knockback rule). A positive intention that lands in the open mouth during the telegraph ends the yawn early: the panda closes its mouth with a small "hm" and no ring is sent.

### B4. The stitch

- **Count:** target 24 stitches. For comparison, a built floor 1 boss has 140 health, about 40 bad hits; a good intention's warmth converts any built boss in about 5 hits, which is an open question of the built fight flow.
- **What counts:** a positive intention that touches the panda's body or head in any state. The panda has no guard; it is the gentlest floor.
- **Progress (target):** each stitch leaves one short gold stitch mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the heavy lids open a little more, as if it were waking. The sign is a target until the owner confirms it.
- **Allies:** an ally that reaches the seat and sits against the panda adds one stitch every target 4 s while it sits. At most target 2 allies sit at once.
- **When stitched:** as proposed in section 6 of this document (it settles onto its seat, wide awake and friendly, and stays on the floor). Which of the three outcomes it takes is open.

### B5. Minions

- **How many:** at most target 4 on the floor at once, allies included. At most target 3 hostile.
- **Spawn:** from two bamboo clumps on the ground, on opposite sides of the seat. A clump rustles and shakes for target 1.5 s, and a panda tumbles out of it. One spawn every target 12 s while fewer than 3 are hostile and fewer than 4 are on the floor.
- **Movement (the panda's own):**
  - walks at target 1.5 blocks a second, about a third of the player's pace;
  - climbs any column face by pulling itself up, one block every target 1.2 s, never faster;
  - sits down whenever it is not moving;
  - rolls when it stands on a slope or a column edge: it tucks into a ball and rolls downhill at target 4 blocks a second until it reaches level ground.
- **Behaviour rules:**
  1. It never strikes the player. Its danger is weight and position.
  2. It climbs toward the column top nearest the player that is higher than the player, and sits there, in the way.
  3. Curious: if the player stands still within 3 blocks of it for 2 s, it sits and watches and does not move until the player moves.
  4. Roll: when the player is below it on the same slope or column, it tucks (telegraph: curls up with a small huff, target 1.4 s), then rolls. Contact is a soft push of target 1.5 blocks.
  5. Chewing: it chews an original block in front of it over target 3 s, with visible bites, and the block regrows after 5 s. It never chews a player block.
  6. It never leaves the floor and never follows the player above the seat's height.
  7. During the panda's nap it walks at half pace.
- **A positive intention:** each hit makes it sit and munch for target 1 s. After target 3 hits it turns into an ally, with a small happy roll. (Built projections convert at 5 good hits.)
- **A negative intention:** goes out with a puff against its fur. Nothing changes.
- **What an ally does:**
  - *Hold:* it follows the player at target 2 blocks and sits on the column top the player is on. A cell under a sitting ally cannot crack or turn dense.
  - *Clear:* it rolls into a hostile minion on a slope and knocks it down to level ground, unharmed.
  - *Help:* it climbs to the seat (at its own slow pace) and sits against the panda, adding stitches (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the clumps are removed and everything else stays.

### B6. Platforming layout (rules)

- **Size:** target 40 blocks across (radius 20) and 28 blocks high. For comparison, the built tree's trunk stories are 22 blocks high with a radius of 23 to 34 ([giant tree](../../../built/levels/giant-tree/README.md)).
- **The Bamboo Seat:** a 3 by 3 column in the centre, its top at target 24.
- **The grove:** target 12 to 16 columns of 2 by 2 stacked blocks, tops from 3 to 20 blocks high.
- **The gentle path:** a chain of columns, each 1 block higher than the last, with gaps of 1 to 2 blocks, winding from the ground to the seat. It is climbable with jumps alone.
- **The building path:** shorter, with steps of 2 blocks that need one placed block each. Nests sit at its foot.
- **Slopes:** half of the columns have a stair of soft original blocks down to the ground. Rolling pandas use these.
- **Straight up:** one face of the Bamboo Seat carries one-block ledges, staggered left and right in a 2-wide strip, every 1 block of height from the ground to the seat. This is the floor's vertical route. The yawn, the toss and the press all reach it.
- **Nests:** target 3, at heights 0, 8 and 16, each with 3 cubes.
- **The ground:** grass and earth in a ring. A fall lands on the ground or a lower column and does not hurt.

**Example route.** From the ground, take the gentle path anticlockwise to a column at height 8 (8 jumps). Stand still for 2 s to delay the next attack. Take a cube from the nest at 8 and place it to climb a 2-block step onto the building path. Continue to height 20, two columns from the seat, and stitch from there (the seat is within the shot's straight flight of about 8 blocks). Jump the last gap and stitch the panda from beside it during its recovery.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Dense ground](../abilities/DENSE-GROUND.md) | Ripple, glassy sheen, rising sound, 1.4 s | Jump, build over, positive shot at the cell |
| [Opening holes](../abilities/OPENING-HOLES.md) | Crack lines, dust, a deep sound, 1.4 s | Step off, jump, build over, positive shot at the crack |
| [Knockback](../abilities/KNOCKBACK.md) (soft: yawn and roll) | Open mouth with a ring; a tucked panda, 1.4 s | Jump the ring, block behind you, positive shot in the mouth |

### B8. Routes

- **With nothing:** the gentle path and the ledge strip reach the seat with jumps alone. A player with no practices can win by stitching from the high columns, or by turning two minions into allies and sitting them against the panda.
- **With practices:** a higher jump turns the building path into a jump path; carrying more blocks lets the player stack a stair up to just below the panda's height (a tower at its height is knocked down); a longer range or a faster shot stitches the panda from lower columns; more fire rate lands more stitches in one recovery.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.4 s | windup 0.4 to 0.9 s |
| Recovery | 2.5 s | up to about 1 s |
| Rest between attacks | 3.5, 3, 2.5 s by stage | a short walk, shorter each phase |
| Stitches | 24 | 140 health: about 40 bad hits, or 5 good hits that convert it (an open question) |
| Hits to turn a minion | 3 | 5 good hits for a projection |
| Minions at once | 4 (3 hostile) | no built equivalent |
| Floor size | radius 20, 28 high | trunk story 22 high, radius 23 to 34 |
| Harm of a lob | 2 points, if harm is kept | boss touch 8 |
| Tower rule | triggers within 2 blocks of the panda's height, on a stack of 3 or more player blocks; telegraph 2 s; push 2 blocks | no built equivalent |

## Open questions

1. Is the panda the gentlest floor, with no minion that rolls over the player, or does it need one?
2. Does the panda sit down on the floor (and open holes) or only make it dense? Both hindrances are proposal.
3. Is this the floor where the player learns nothing new, or does it introduce building as its only puzzle?
4. Is this floor one of the platforming-only floors, with no minions at all? (See [guardians](README.md).)
5. When the panda is stitched, does it transform, change its attitude, or leave? And does the floor stay after it is stitched?
6. Bamboo stumps. A stalk from Bamboo toss stands as a step for 6 s. Is a step the deity gives a good fit for the gentlest floor, or should its lobs leave nothing?
7. The rest beat. Standing still for 2 s delays the panda's next attack. Does the owner want stillness rewarded on this floor, given that silence already rewards it in the built game?
8. The nap. At two thirds of the stitches the panda naps for 5 s with no attacks. Keep it, or is a pause in the fight too gentle?
9. Ally stitches. Allies sitting against the panda add stitches with no cap. Can the floor be won by allies alone? (Shared question in [guardians](README.md#5-open-questions).)
10. Heights. The floor's target height of 28 blocks is taller than a built trunk story (22). Whether it must fit a built story depends on the open mapping of sky floors onto the built tree.
11. Teleport (which deity: open). Is the panda one of the deities that teleport? A teleport would always land it far from the player.
12. The tower's measures. The trigger (a stack of 3 or more player blocks, within 2 blocks of the panda's height) and the 2 s telegraph are targets. Can a positive intention during the telegraph delay the panda, or is stepping off the only answer?
