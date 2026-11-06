# Giant panda: the first guardian (sky floor 1)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The giant panda is the first deity the player meets above the surface: a giant panda head on a small, soft plush body, over sky floor 1. It is the gentlest guardian and the one that teaches the sky's platforming.

Status: proposal, specified. Decided: the animal and the floor order, that the panda levitates, that it is defeated by landing many positive hits on it and never dies, and the tower rule (B2), that minions avoid the well's mouth (owner, 2026-11-05), that the panda has special attacks too, and that the floor's way up stays closed until the panda is defeated (owner, 2026-11-05). The character, the mirror, the minions and the puzzle are proposals. The special attacks and the two phases (B3b) are provisional, to confirm.

Built: the deity, its ten attacks, the rest beat, the rally at half the hits and the nap, defeat by 24 hits, and the minions; what the player meets is in [built PANDA](../../../built/sky/guardians/PANDA.md). This document keeps the full specification (its numbers are the targets the build follows) and what is not built: the panda's float to a tower and back and its float in Cradle, the tower trigger on the floor, the lob turning into a leaf, and the sounds. The art gate is pending owner review ([panda art](../../../../art/sky/panda.md)).

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

## 6. Defeat by many positive hits

The player defeats the panda by landing many positive hits on it ([guardians](README.md#1-the-shared-contract)). It does not die. When the hit count is reached, it transforms, changes its attitude, or leaves; which one is open. It can also be turned to the player's side. Proposal: it changes its attitude: it sinks slowly from the air onto its seat, wide awake and friendly, and it stays on the floor.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, defeat by positive hits, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A big, sleepy head that chews. The panda never hurries: every attack is slow, long-telegraphed and soft, and its longest state is rest. The floor teaches the sky's three rules in order: blocks come back, negative shots go out with a puff, and every hindrance warns first.

### B2. The deity

**Position.** The panda's seat is the top of the Bamboo Seat, the tallest column, in the centre of the floor, at target 24 blocks above the ground. The panda levitates (decided): it floats target 1.5 blocks over the seat and drifts slowly round it.

**The way up (decided, owner, 2026-11-05).** The floor's way up, over the ledge strip, is closed until the panda is defeated: the player cannot change floor until then ([sky laws 3.5](../README.md#35-the-way-up-opens-when-the-deity-is-won), [sky architecture, section 7.1](../../../../architecture/SKY.md)).

**Teleport (provisional: no).** The panda does not teleport; the koala and the horse do (owner, 2026-11-03, provisional).

**The tower rule (decided).** If the panda detects that the player is building a tower that reaches its height, it leaves its floor, knocks the tower down and pushes the player off it.
- *Trigger:* the player stands on a tower, a stack of target 3 or more player blocks, whose top puts them within target 2 blocks of the panda's height (target 22 blocks or higher). The floor's own columns, the ledge strip and single placed steps never trigger it.
- *Telegraph (target 2 s, longer than its attacks):* the panda stops chewing, turns its whole body to the tower and stares; the tower's blocks shake and a warm outline runs down the stack from top to bottom, with a rising grumble.
- *Act:* the panda leaves its seat and floats to the tower, nudges it with its shoulder so the stack topples from the top down, and gives the player a soft push of target 2 blocks off it. The player falls to the ground or a lower column, unhurt. Then the panda floats back to its seat and is Recovering there. The toppled blocks fall as loose cubes the player can gather again (provisional, owner, 2026-11-03).
- *Answer:* step off the tower onto an original column or the seat's ledge strip before the telegraph ends, or do not stack a tower to its height: climb the grove, the gentle path or the ledge strip, which the panda never knocks down. While it floats to the tower and back, its seat is empty and the panda is close to the player: a positive hit lands on it as usual.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Idle | Chews a bamboo stalk, eyes half shut | 4 to 6 s |
| Watching | The head turns slowly to follow the player; starts when the player is within 12 blocks or above height 8 | until an attack, after a rest |
| Attacking | One attack (B3), telegraph 1.4 s | per attack |
| Recovering | Leans back, belly up, a contented sigh | 2.5 s |
| Hurt | A slow blink and a soft "mm" when a positive hit lands | 0.3 s |
| Rallying | Yawns and stretches when the positive hits reach half the target, the one change of phase (B3b); the minions sit up and look at it | 2 s |
| Napping | Right after the rally at half the positive hits: falls asleep over the seat. No attacks; the minions slow down | 5 s, once |
| Tower watch | Stares at a tower that reaches its height (tower rule, above) | 2 s, then it leaves its seat |

**The cycle.** Idle, Watching, Attacking, Recovering, Watching. The rest between the end of one recovery and the next telegraph is target 3.5 s in the first phase and 2.5 s in the second (the panda has two phases, B3b; phases: [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits)). For comparison, built bosses rest only a short walk between moves, shorter in each phase ([fight flow](../../../built/bosses/FIGHT-FLOW.md)).

**The rest beat (the panda's own rule).** When the player stands still on any column top for target 2 s while the panda is Watching, the panda's next attack waits target 2 s more. The mirror is rushing; the floor answers it with pauses that are rewarded. **Calm feedback (design requirement, provisional; [guardians, section 6.6](README.md#66-what-works-and-harm)):** from the moment the player stops, the panda's chewing slows and its lids droop, and a ring of bamboo leaves settles round the player's feet one leaf at a time; when the 2 s are reached the panda gives a long, contented sigh. The player sees they are doing it right before the reward comes.

### B3. Attacks

The panda has four attacks. The first phase uses Bamboo toss, Heavy press and Sit-down. The second adds Yawn (the panda has two phases, B3b). An attack is never repeated back to back when another is available (as in the built fight flow).

**1. Bamboo toss (a lob).**
- *Telegraph (1.4 s):* the panda lifts a stalk over its head; a warm mark appears where it will land, aimed at where the player is going.
- *Act:* the stalk lands and stands upright as a one-block bamboo stump for target 6 s, then dissolves. A stump that lands on the player gives a soft knockback of target 1 block and does no damage (decided, owner, 2026-11-03).
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

### B3b. Special attacks

Status: provisional, to confirm. The owner decided that the panda has special attacks too, built from its habits, with a telegraph and a counter, under the same rules as the other four (owner, 2026-11-05). Every choice below (which attacks, their kind, their phase) is a proposal, and every number is a target. The shared rules for drains and capture (telegraph lengths, spacing, `SPIRIT_MAX` 100, `CAPTURE_TIME`, the calm feedback) are in [guardians, section 6.6](README.md#66-what-works-and-harm).

**Phases (provisional, to confirm).** A deity has two or three phases (owner, 2026-11-05). The panda, the gentlest floor, has two: phase 1, *Grazing*, up to half the hit count; phase 2, *Hurrying*, to the end, opened by the one rally (B2). An attack that enters in phase 1 stays in the list in phase 2. These six are added to the four attacks of B3; the floor's platforming layout (B6) does not change. The panda's drains are the smallest of the five floors.

| # | Special attack | Phase | Kind | What it does | Telegraph (target) | Answer | Counter (positive intention) | Spirit (target) |
|---|---|---|---|---|---|---|---|---|
| 5 | Playful shove | 1 | Moves | A soft push toward a column top's edge | 1.4 s | Step off the shown arc, or a block behind you | A shot on the raised paw: it pats the air instead | none |
| 6 | Thicket | 1 | Holds (blocks the way) | A line of 2-high bamboo stalks stands across the column top toward the seat for 4 s | 1.4 s | Go round its open end, or climb another column | A shot cuts one stalk | none |
| 7 | Slow chew | 1 | Drains spirit | Drains a player who rushes (two jumps, or more than 3 blocks) during the chew | 1.6 s | Slow down: walk, one jump, or stand | A shot in the mouth: it swallows, no drain | 6 |
| 8 | Peekaboo | 2 | Drains spirit | Drains a player hidden from the panda's sight when it uncovers its eyes | 1.6 s | Step out into its sight | A shot on the covering paws: it peeks early and smiles, no drain | 8 |
| 9 | Tumble | 2 | Drains spirit | A ball of air rolls down a shown slope or path; its touch drains | 1.6 s | Step off the line, jump it, or a player block in its way | A shot on the tucked body: it unrolls and sits | 8 |
| 10 | Cradle | 2 | Captures | Floats down and gathers the player onto its belly | 1.9 s | Leave the shrinking ring, or a player block in its float | A shot on the floating panda: it hugs a stalk instead | none |

**5. Playful shove ([knockback](../abilities/KNOCKBACK.md)). Moves.**
- *Habit:* panda cubs wrestle, roll over and shove each other in play.
- *Phase:* 1.
- *Telegraph (target 1.4 s):* the panda lifts one paw high with a playful huff; a soft arc is drawn on the player's column top from their cell toward the nearest edge, and the cells under it shimmer.
- *Act:* a puff of air pushes the player target 1.5 blocks along the arc. A player pushed off a column falls to the ground or a lower column, unhurt. The arc never ends over a drop it did not show.
- *Answer:* step off the arc's line, or stand with a block behind you (a push stops at the first solid block).
- *Positive intention:* a positive intention on the raised paw makes it pat the air instead: no push.

**6. Thicket. Holds (blocks the way).**
- *Habit:* pandas keep to dense bamboo thickets, where they feel safe, and rarely leave them.
- *Phase:* 1.
- *Telegraph (target 1.4 s):* the panda taps its seat; green shoots break through the column top the player is on, along a line between the player and the seat, with a soft rustle that grows.
- *Act:* the shoots grow into a line of bamboo stalks target 2 blocks high, for target 4 s, then wither. The line never closes a ring: one end is always open, and it never stands on the player's cell or on a player block. The stalks are not a step: the player cannot stand on them.
- *Answer:* go round the open end, jump to another column, or wait for it to wither.
- *Positive intention:* a positive intention cuts one stalk, which falls as a leaf: a one-cell gap the player can walk through.

**7. Slow chew. Drains spirit.**
- *Habit:* a panda eats for up to fourteen hours a day, sitting upright, one stalk at a time, chewing slowly. This is the panda's mirror: rushing, never slowing down long enough to eat and rest.
- *Phase:* 1.
- *Telegraph (target 1.6 s):* the panda sits up and chews a stalk with a slow, steady crunch, one every target 0.5 s; a ring of bamboo leaves, target radius 3, is drawn round the player's cell.
- *Act:* when the telegraph ends, a player who jumped twice or more, or moved farther than target 3 blocks, during the telegraph drains target 6 spirit. A player who walked a little, jumped once or stood is not touched. Being pushed by an attack or a minion does not count as moving. Slow chew is not chosen while a push, a hole or a dense cell is under the player.
- *Answer:* slow down to the panda's pace: walk, take one jump, or stand. A player in mid-jump at the start of the telegraph has time to land and walk.
- *Calm feedback (design requirement):* while the player keeps within the pace, the leaves of the ring turn green one by one in time with the crunch, and the panda's eyes close as it chews. A player who rushes sees the leaves stay pale.
- *Positive intention:* a positive intention in the chewing mouth makes it swallow with a small "mm": no drain.

**8. Peekaboo. Drains spirit.**
- *Habit:* a frightened panda cub climbs the nearest tree and clings there, hidden, until its mother calls. Here the panda turns the habit on the player: clinging to a hiding place.
- *Phase:* 2.
- *Telegraph (target 1.6 s):* the panda covers its eyes with both paws and hums a slow count; every cell the panda cannot see, behind a column, a block or the seat, is drawn cool and shaded, and the cells in its sight are drawn warm.
- *Act:* when it uncovers its eyes, a player in a shaded cell, hidden from its sight, drains target 8 spirit. A player in its sight is not touched. Peekaboo is not chosen when no cell in the panda's sight lies within a jump or a walk of target 3 blocks of the player.
- *Answer:* step out into the panda's sight: onto a column top it can see, or round the side of a column.
- *Positive intention:* a positive intention on the covering paws makes it peek early and smile: no drain.

**9. Tumble. Drains spirit.**
- *Habit:* pandas tumble and roll down slopes, on purpose and in play.
- *Phase:* 2.
- *Telegraph (target 1.6 s):* the panda tucks into a ball over its seat with a small huff; a dashed line is drawn from the seat's foot along the slope or the stretch of the gentle path the player is on, through the player's cell, with a rumble that rises.
- *Act:* a ball of drowsy air the size of the panda rolls along the line at target 5 blocks a second, target 1 block high, to its end. A player it touches drains target 8 spirit. It does not push.
- *Answer:* step off the line, jump it as it passes, or put a player block in its way (a roll stops at a solid block, as a charge stops: [attacks](../../../built/encounters/ATTACKS.md)).
- *Positive intention:* a positive intention on the tucked body during the telegraph makes it unroll and sit: no ball.

**10. Cradle. Captures.**
- *Habit:* a panda mother cradles her tiny cub against her chest with one paw for weeks, and does not put it down.
- *Phase:* 2.
- *Telegraph (target 1.9 s, the longest of the sky):* the panda leans back, opens its arms and floats down from its seat toward the player with a soft, rising hum; a ring of bamboo leaves of target radius 2 is drawn round the player's cell and shrinks to the cell over the telegraph.
- *Act:* if the player is inside the ring when it closes, the panda gathers them onto its belly: the player is captured for `CAPTURE_TIME` (target 3 s) and one practice they hold is taken ([guardians, section 6.6](README.md#66-what-works-and-harm)). Then it floats back to its seat and is Recovering there.
- *Answer:* leave the ring before it closes, by a walk or a jump of 2 blocks. A player block between the panda and the player stops its float at the block, as a charge stops ([attacks](../../../built/encounters/ATTACKS.md)), and it recovers there.
- *Positive intention:* a positive intention that lands on the floating panda makes it hug a bamboo stalk instead and float back: no capture. While it floats in and while it holds the player, positive hits land on it as usual (the panda has no guard).

**Without minions.** None of the six needs a minion. Tumble is the deity's own roll, not a minion's.

### B4. Defeat by positive hits

- **Hit count:** target 24 positive hits. For comparison, a built floor 1 boss has 140 health, about 40 bad hits; a good intention's warmth converts any built boss in about 5 hits, which is an open question of the built fight flow.
- **What counts:** a positive intention that touches the panda's body or head in any state. The panda has no guard; it is the gentlest floor.
- **Progress (target):** each positive hit leaves one short gold mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the heavy lids open a little more, as if it were waking. The sign is a target until the owner confirms it.
- **Allies:** an ally that reaches the seat and sits against the panda adds one positive hit every target 4 s while it sits. At most target 2 allies sit at once.
- **When defeated:** as proposed in section 6 of this document (it settles onto its seat, wide awake and friendly, and stays on the floor). Provisional: it changes its attitude (owner, 2026-11-03).

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
  8. **The well's mouth.** Decided (owner, 2026-11-05): a minion never steps into the foot well's mouth, the opening on the first hall's ground that the player climbs through. The mouth has a rim: one block of pale stone round it, on the same ground, one cell out from the mouth's edge. The rim's height is provisional (one block, to confirm with the owner).
- **A positive intention:** each hit makes it sit and munch for target 1 s. After target 3 hits it turns into an ally, with a small happy roll. (Built projections convert at 5 good hits.)
- **A negative intention:** goes out with a puff against its fur. Nothing changes.
- **What an ally does:**
  - *Hold:* it follows the player at target 2 blocks and sits on the column top the player is on. A cell under a sitting ally cannot crack or turn dense.
  - *Clear:* it rolls into a hostile minion on a slope and knocks it down to level ground, unharmed.
  - *Help:* it climbs to the seat (at its own slow pace) and sits against the panda, adding positive hits (B4).
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
- **The way in:** the player arrives from the deck up the tree's foot well, whose mouth (radius 4) opens on the ground beside the Bamboo Seat, not under it: target 2 blocks from the seat, in the part of the floor with no columns. Nothing stands over the mouth, and the seat keeps whole ground (provisional, to confirm).

**Example route.** From the ground, take the gentle path anticlockwise to a column at height 8 (8 jumps). Stand still for 2 s to delay the next attack. Take a cube from the nest at 8 and place it to climb a 2-block step onto the building path. Continue to height 20, two columns from the seat, and land positive hits from there (the seat is within the shot's straight flight of about 8 blocks). Jump the last gap and land positive hits on the panda from beside it during its recovery.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Dense ground](../abilities/DENSE-GROUND.md) | Ripple, glassy sheen, rising sound, 1.4 s | Jump, build over, positive shot at the cell |
| [Opening holes](../abilities/OPENING-HOLES.md) | Crack lines, dust, a deep sound, 1.4 s | Step off, jump, build over, positive shot at the crack |
| [Knockback](../abilities/KNOCKBACK.md) (soft: yawn and roll) | Open mouth with a ring; a tucked panda, 1.4 s | Jump the ring, block behind you, positive shot in the mouth |

### B8. Routes

- **With nothing:** the gentle path and the ledge strip reach the seat with jumps alone. A player with no practices can win by landing positive hits from the high columns, or by turning two minions into allies and sitting them against the panda.
- **With practices:** a higher jump turns the building path into a jump path; carrying more blocks lets the player stack a stair up to just below the panda's height (a tower at its height is knocked down); a longer range or a faster shot lands positive hits on the panda from lower columns; more fire rate lands more positive hits in one recovery.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.4 s | windup 0.4 to 0.9 s |
| Recovery | 2.5 s | up to about 1 s |
| Phases | 2 (provisional; a deity has 2 or 3) | 3 phases |
| Rest between attacks | 3.5, 2.5 s by phase | a short walk, shorter each phase |
| Positive hits | 24 | 140 health: about 40 bad hits, or 5 good hits that convert it (an open question) |
| Hits to turn a minion | 3 | 5 good hits for a projection |
| Minions at once | 4 (3 hostile) | no built equivalent |
| Floor size | radius 20, 28 high | trunk story 22 high, radius 23 to 34 |
| Harm of a lob | none (decided: it pushes or holds) | boss touch 8 |
| Special attacks (provisional) | 6: 3 drain spirit (6, 8, 8 of 100), 1 captures (3 s, one practice), 2 move or hold | no built equivalent |
| Special telegraphs | 1.4 s to move or hold, 1.6 s to drain, 1.9 s to capture | windup 0.4 to 0.9 s |
| Tower rule | triggers within 2 blocks of the panda's height, on a stack of 3 or more player blocks; telegraph 2 s; push 2 blocks | no built equivalent |

## Open questions

1. Is the panda the gentlest floor, with no minion that rolls over the player, or does it need one?
2. Does the panda sit down on the floor (and open holes) or only make it dense? Both hindrances are proposal.
3. Is this the floor where the player learns nothing new, or does it introduce building as its only puzzle?
4. Is this floor one of the platforming-only floors, with no minions at all? (See [guardians](README.md).)
5. When the panda is defeated, does it transform, change its attitude, or leave? Provisional (owner, 2026-11-03): it changes its attitude and stays on the floor.
6. Bamboo stumps. A stalk from Bamboo toss stands as a step for 6 s. Is a step the deity gives a good fit for the gentlest floor, or should its lobs leave nothing?
7. The rest beat. Standing still for 2 s delays the panda's next attack. Does the owner want stillness rewarded on this floor, given that silence already rewards it in the built game?
8. The nap. After the rally at half the positive hits the panda naps for 5 s with no attacks. Keep it, or is a pause in the fight too gentle?
9. Ally positive hits. Allies sitting against the panda add positive hits with no cap. Can the floor be won by allies alone? (Shared question in [guardians](README.md#5-open-questions).)
10. Heights. The floor's target height of 28 blocks is taller than a built trunk story (22). Whether it must fit a built story depends on the open mapping of sky floors onto the built tree.
11. Teleport (answered, provisional: no). The panda does not teleport; the koala and the horse do.
12. The tower's measures. The trigger (a stack of 3 or more player blocks, within 2 blocks of the panda's height) and the 2 s telegraph are targets. Can a positive intention during the telegraph delay the panda, or is stepping off the only answer?
13. Special attacks (provisional, B3b). Which of the six to keep, which drain spirit, which capture, and the drain amounts (6, 8, 8) are proposals. The owner accepts drain amounts for now, to adjust later (2026-11-05).
14. Two phases (provisional). The panda has two phases and the other four have three. Does the owner want the gentlest floor to be the short one, or another deity to have two?
15. A capture on the first floor. Cradle takes a practice on the gentlest floor, with the sky's longest telegraph (1.9 s). Keep a capture here, or let the panda's floor show what a capture is without taking a practice?
16. Peekaboo drains a player who hides from the panda, and the lion's Stare-down drains one who looks away from the lion. Is "come out where I can see you" the right mirror of clinging to a safe place?
