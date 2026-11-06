# Elephant: the third guardian (sky floor 3)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The elephant is the third deity: an elephant with a giant head on a small, soft plush body, over sky floor 3, a floor of channels and rivers that carry the player.

Status: proposal, specified. Decided: the animal and the floor order, that the elephant levitates, that it is defeated by landing many positive hits on it and never dies, and the tower rule of the [sky laws](../README.md#39-a-tower-that-reaches-a-deity-is-knocked-down). The character, the mirror, the minions and the puzzle are proposals. Decided (owner, 2026-11-05): the floor's way up stays closed until the elephant is defeated. The special attacks (B3b) are provisional, to confirm; the owner accepts their drain amounts for now, to adjust later (2026-11-05). Built: the deity's machine, Memory, Listening, the rim guard, the ten attacks of B3 and B3b, defeat by 36 hits, the herd's rules and helps, and the models; what the player meets is in [built ELEPHANT](../../../built/sky/guardians/ELEPHANT.md). Not built: positive shots into the dust circle, at the grey water or at the stone in flight do not answer; the tower sweep is not wired; the floor's channels are not built (the attacks use a stand-in bed); the herd is not spawned; no sound. The art gate is pending owner review ([elephant art](../../../../art/sky/elephant.md)).

## 1. Who it is

An elephant head, huge, grey, with ears that open like sails and a trunk that curls down to the floor. Elephants remember. They travel long distances, they keep to their herd, and they are slow to anger and slow to forget.

**Mirror (proposal).** The elephant mirrors carrying an old weight: grudges, old hurts and the rehearsal of what happened long ago, carried into every new room. The pattern is memory that never gets put down. The practice the elephant points to is remembering with care and putting the weight down on purpose.

The elephant is wise and strong rather than cruel. Its floor is about carrying: what the player carries, and what the floor carries away.

## 2. Floor order

Sky floor 3, the middle of the five. The player arrives having learned to climb (panda) and to commit to a jump (koala). Here the floor moves: water and its currents make every route a question of direction.

**The floor's name (provisional, to confirm).** *The channels* (Spanish: *Los canales*), the name the HUD shows on this floor. It follows the built level names, a short plain noun with its article (*The trunk*, *The leaves*, *The winds*), and it names what carries the player here.

## 3. Minions

The minions are the elephant itself, embodied as smaller elephants of the herd. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Elephants walk heavily, in lines, with a steady pace that does not change. A minion walks the floor like the herd walks a path, and it wades through water without slowing.
- **Character.** Patient, protective of the herd, not quick to attack. It flaps its ears, which is the sign it is about to push.
- **Rules tied to the animal.** A minion pushes the player with its shoulder or its trunk (see [knockback](../abilities/KNOCKBACK.md)). It sprays water from its trunk (see [water currents](../abilities/WATER-CURRENTS.md)). It does not climb: it stays on the floor, so the player can always escape up.

## 4. Arena and puzzle

**The arena.** The floor is a stepped mountain of five rings rising to the elephant's Basin, a pool at its top and its centre. Channels run down from the Basin, switching back across the terraces, to the ground ring at the mountain's foot, where the herd's waterhole lies. Water runs through the channels. They are dry at the start, and water fills them when the elephant calls it. The layout is in B6 (provisional, to confirm).

**The platforming.** Crossings over water, jumps from one bank to the next, and ledges above the channels. Water carries the player along the channel, so the route is a question of direction and timing.

**The puzzle (proposal).** Water is coming down a channel toward a drop, and the player must build a dam to stop it, or cross on the bank before it fills. The elephant's trunk pushes the player off a bank at the wrong moment, so the player must stand where the push cannot send them into the water. The route up is a staircase of dams, built one block at a time. Each dam the player builds stays (section 3.2 of the realm README).

**Hindrances used (proposal).**

- [Water currents](../abilities/WATER-CURRENTS.md): instantiated water that pushes and carries the player along the channels.
- [Knockback](../abilities/KNOCKBACK.md): the trunk kicks the player off a bank.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at an elephant minion turns it into an ally (decided, see [minions](../minions/README.md)). This elephant ally, proposal:

- stands in a channel and holds the water back, so a dam does not have to be built there;
- pushes a minion that is about to push the player, so the knockback goes to a minion instead.

## 6. Defeat by many positive hits

The player defeats the elephant by landing many positive hits on it ([guardians](README.md#1-the-shared-contract)). It does not die. When the hit count is reached, it transforms, changes its attitude, or leaves; which one is open. It can also be turned to the player's side. Proposal: it changes its attitude: it sets its weight down, the water drains from the channels, and the herd of minions stays on the floor until the player is done.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, defeat by positive hits, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A great grey head with ears like sails, floating over a high basin of water. Everything on the floor runs downhill from the elephant: the channels are its stairs, and water is its weight. The elephant remembers where the player rested, and aims there. The floor rewards a player who reads the water and puts a dam where it matters.

### B2. The deity

Status (B3, built 2026-11-05): `src/sky/creatures/deities/elephant.ts`, `src/sky/creatures/minions/elephant.ts`, tests in `tests/sky-elephant.test.ts`. Readings taken where the text left room: Drinking is the machine's Recovering; the doc's longer telegraphs (1.3 s for a drain, 1.6 s for the capture) are the floor's 1.1 s body tell plus the extra, with the marks shown from the first frame; attacks that run a hindrance also show that hindrance's own warning after the tell; with no channels built, Trunk spray and Heavy water use a bed of 8 cells along the terrace through their aim; Trumpet is a push outward over the player's terrace (jumping it is not modelled); the trunk lift holds the player in place (the 1-block lift is not drawn); the answers in the world (a positive shot into the dust circle, at the grey's head, or meeting the stone in the air) are not built, the answers on the body are. Not built: the allies' remote help (the engine counts help only within 3 blocks of the deity), the tower sweep (the engine does not call it yet), the sounds.

**Position.** The elephant's Basin is a round pool cut into the top of the mesa at the centre of the floor, with a rim 2 blocks high round it (B6). Its water line is target 26 blocks up (provisional, to confirm). The elephant levitates (decided): it floats target 1 block over the water, its trunk reaching down into it, so its small body hangs from 27 up and its head reaches about 30.

**Teleport (provisional: no).** The elephant does not teleport; the koala and the horse do (owner, 2026-11-03, provisional).

**The tower rule.** A tower of player blocks that brings the player to the elephant's height (the shared rule in [guardians, section 6.2](README.md#62-states-every-deity-shares)) is knocked down: the elephant floats to it, sweeps the stack with its trunk, and pushes the player off, after the full warning. Raising one block against the rim's line, as in the example route, is not a tower.

**The way up (decided, owner, 2026-11-05).** The floor's way up, over the tusk line, is closed until the elephant is defeated: the player cannot change floor until then ([sky laws 3.5](../README.md#35-the-way-up-opens-when-the-deity-is-won), [sky architecture, section 7.1](../../../../architecture/SKY.md)).

**The rim (the elephant's guard).** A positive intention fired from below the rim's top strikes the rim, which is a solid block, and stops on it ([attacks](../../../built/encounters/ATTACKS.md)). The rim's top is at 28. The small body is in line only from the shore with one block raised under the player, from the tusk line's upper ledges (standing at 27 or higher), or from the air. The head, which rises above the rim, takes positive hits from the shore, but only while the trunk is raised (in Trunk spray and Trumpet). From the terraces below the shore the mesa's own edge hides the deity.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Idle | Sways from foot to foot, trunk swinging | 4 s |
| Listening | Ears fan open wide; starts when the player climbs onto a new terrace | 1.5 s |
| Attacking | One attack (B3), telegraph 1.1 s | per attack |
| Drinking | Trunk down in the Basin, a long drink | 2.5 s |
| Hurt | Ears flap once, a low rumble | 0.3 s |
| Rallying | Trumpets when the positive hits reach a third and two thirds of the target; the herd turns toward the waterhole | 2 s |

**The cycle.** Idle, Listening, Attacking, Drinking, Listening (or Idle when the player is out of sight). Drinking is its recovery. The rest before the next telegraph is target 3 s in the first stage, 2.5 s in the second and 2 s in the third (stages: [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits)).

**Memory (the elephant's own rule).** The elephant keeps the place where the player stood longest in the last target 10 s. Memory stone and Trunk spray aim there, not at the player. The mirror is carrying an old weight: the attack lands where the player was, and a player who keeps moving is never where it lands.

### B3. Attacks

The elephant has four attacks. The first stage uses Trunk spray and Trunk swat. The second adds Memory stone. The third adds Trumpet.

**1. Trunk spray ([water currents](../abilities/WATER-CURRENTS.md)).**
- *Telegraph (1.1 s):* the trunk lifts and curls toward one channel's head; faint flow arrows ripple down the channel's bed, and a rising sound of water comes. The chosen channel is the one that passes the remembered place.
- *Act:* water fills that channel from its head and runs downhill for target 6 s, then drains in visible steps. The current carries the player down at target 3 blocks a second. For comparison, the built player wades at 60% of their pace, about 2.8 blocks a second, so a player in the current is carried, slowly, until they step out.
- *Answer:* step up onto a bank, jump across, or dam the channel above you (a player block stops the flow there; the bed below the dam stays dry). A positive intention at the channel's head stops the flow for target 3 s (proposal). A block in the channel stops it.

**2. Trunk swat ([knockback](../abilities/KNOCKBACK.md)).**
- *Telegraph (1.1 s):* the trunk lowers and swings back; dust lifts and the arc of the kick is drawn from the player's feet to where they will land.
- *Act:* the player is sent target 3 blocks along the arc, away from the Basin. It reaches only the shore, the third terrace and the tusk line's last strip (within target 7 blocks of the rim).
- *Answer:* step out of the arc's line, or stand with a block behind you (the kick stops at the first solid block). A positive intention on the lowered trunk during the telegraph turns the kick into a soft push of 1 block (proposal). The arc never ends over a drop that it did not show.

**3. Memory stone (a lob).**
- *Telegraph (1.1 s):* the trunk lifts a wet round stone out of the Basin; a warm mark appears on the remembered place.
- *Act:* the stone lands and stays as a one-block sky stone for target 8 s, then dissolves. If it lands on the player, it pushes them and does no damage (decided, owner, 2026-11-03). A stone that lands in a channel dams it while it lasts.
- *Answer:* do not be where you rested. A block overhead stops it (lobs stop at solid blocks). A positive intention that meets it in the air bursts it into a splash (proposal). A stone the elephant drops into a channel can be used as the player's dam.

**4. Trumpet (a ring).**
- *Telegraph (1.1 s):* the ears fan, the trunk rises straight up, and a deep note gathers.
- *Act:* a ring of sound runs along the terrace the player is on, at target 7 blocks a second, target 0.8 blocks high, and pushes target 1.5 blocks outward.
- *Answer:* jump it, or stand on a block 1 high (a block stops the push). A positive intention on the raised trunk during the telegraph muffles it: the ring still runs but does not push. The raised trunk is also the head's open moment for positive hits.

### B3b. Special attacks

Status: provisional, to confirm. The owner did not name the special attacks; every choice below (which attacks, their kind, their phase) is a proposal, and every number is a target. The shared rules for drains and capture (telegraph lengths, spacing, `SPIRIT_MAX` 100, `CAPTURE_TIME`) are in [guardians, section 6.6](README.md#66-what-works-and-harm).

**Phases (provisional).** The elephant's fight has three phases (a deity has two or three, owner, 2026-11-05; three here, provisional), the three stages of [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits), each opened by a rally: phase 1, *Wading*, up to a third of the hit count; phase 2, *Remembering*, up to two thirds; phase 3, *Carrying*, to the end. An attack that enters in a phase stays in the list for the phases after it. These six are added to the four attacks of B3; the floor's platforming layout (B6) does not change.

| # | Special attack | Phase | Kind | Telegraph (target) | Spirit (target) |
|---|---|---|---|---|---|
| 5 | Mud wallow | 1 | Slows | 1.1 s | none |
| 6 | Dust bath | 1 | Drains spirit | 1.3 s | 16 |
| 7 | Ear fan | 2 | Moves | 1.1 s | none |
| 8 | Low rumble | 2 | Drains spirit | 1.3 s | 12 |
| 9 | Heavy water | 3 | Drains spirit | 1.3 s | 14 |
| 10 | Trunk lift | 3 | Captures | 1.6 s | none |

**5. Mud wallow ([dense ground](../abilities/DENSE-GROUND.md)). Slows.**
- *Habit:* elephants wallow in mud and roll in it to cool down and to protect their skin.
- *Phase:* 1.
- *Telegraph (target 1.1 s):* the elephant sinks its trunk into the Basin and blows a wet bubble; a patch of target radius 2 on the player's terrace darkens and turns glossy, with a slow squelch.
- *Act:* the patch is dense for target 5 s: walking on it is slowed to target 50%. Jumps keep their height. A dry channel bed inside the patch is dense too; a wet one is not changed.
- *Answer:* jump out of the patch, walk off it slowly, or build over it (a player block is never dense).
- *Positive intention:* a positive intention at a muddy cell dries it back to ordinary ground at once.

**6. Dust bath (a falling cloud). Drains spirit.**
- *Habit:* an elephant sucks up dust with its trunk and throws it over its back, again and again, to keep the sun and the flies off.
- *Phase:* 1.
- *Telegraph (target 1.3 s):* the trunk sweeps the rim and draws up a plume of pale dust; a pale circle of target radius 2 is drawn on the remembered place (B2, memory), and dust motes start to settle in it with a dry hiss.
- *Act:* the dust falls in the circle. A player inside it drains target 16 spirit (raised from 10: the owner found it too small, 2026-11-05). The dust settles and does nothing more.
- *Answer:* do not be where you rested; any move of 2 blocks leaves the circle. A block overhead shelters the player: the dust falls like a lob and stops at a solid block ([attacks](../../../built/encounters/ATTACKS.md)).
- *Positive intention:* a positive intention into the circle during the telegraph turns the dust into a fine harmless mist: no drain.

**7. Ear fan ([wind](../abilities/WIND.md)). Moves.**
- *Habit:* an elephant fans its huge ears to cool its blood; on a hot day it never stops.
- *Phase:* 2.
- *Telegraph (target 1.1 s):* both ears open wide and start to beat slowly; dust lifts on a line across the player's terrace toward the nearest channel, with a soft whoosh at each beat.
- *Act:* a gust for target 2.5 s pushes the player along the line at target 2.5 blocks a second, about half the player's walk. A player pushed into a channel is carried by its water if it is wet (B3, Trunk spray), and is not hurt.
- *Answer:* walk against it, or put a block in its line (a gust stops at the first block, and the block stays).
- *Positive intention:* a positive intention on an ear during the telegraph makes both ears fold back: no gust.

**8. Low rumble (a ground ring). Drains spirit.**
- *Habit:* elephants call each other with rumbles too low for a human to hear; the herd feels them through the ground, in the soles of their feet, kilometres away.
- *Phase:* 2.
- *Telegraph (target 1.3 s):* the elephant presses the tip of its trunk to the Basin's floor; pebbles hop on the player's terrace, the ground trembles under their feet, and a ring with a clear edge is drawn along the terrace, starting at the tusk line.
- *Act:* the ring travels along that terrace's original ground at target 7 blocks a second, once round. A player standing on the terrace's original ground or in its dry beds when the edge passes drains target 12 spirit. A player in the air, in water, or on a player block is not touched: the rumble travels only through the original ground.
- *Answer:* jump as the edge passes, or stand on a player block (one placed block is enough), or step into a wet channel.
- *Positive intention:* a positive intention on the trunk during the telegraph lifts it from the floor: no ring.

**9. Heavy water (a grey flow). Drains spirit.**
- *Habit:* elephants mourn: they come back to the bones of their dead, touch them with their trunks, and stand over them for a long time, still. This is the elephant's mirror: an old weight carried and never put down.
- *Phase:* 3.
- *Telegraph (target 1.3 s):* the elephant lowers its head and goes still; a slow toll sounds; the water at the head of the channel the player is in (wet or dry) turns grey and heavy, and the grey is drawn down the bed to the player's cell and beyond.
- *Act:* the grey flow runs down that channel's bed. A player still in the bed when it reaches their cell drains target 14 spirit. The grey drains into the waterhole and does nothing more; the channel's water, if any, flows on as before.
- *Answer:* climb out of the bed onto a bank through a cut, or dam the bed above you (a player block stops the grey there). Heavy water never chooses a stretch with no cut, no dam and no nest within target 4 blocks of the player.
- *Positive intention:* a positive intention into the grey at the channel's head during the telegraph clears it to clear water: no drain.

**10. Trunk lift. Captures.**
- *Habit:* an elephant wraps its trunk round what it wants to keep, and a mother lifts her calf out of the mud with her trunk.
- *Phase:* 3.
- *Telegraph (target 1.6 s):* the trunk uncurls from the Basin and reaches down toward the player, its tip glowing warm, with a long rising note; a ring of target radius 2 is drawn round the player's cell and shrinks to the cell over the telegraph. Trunk lift reaches only the top two terraces (within target 7 blocks of the Basin), as Trunk swat does.
- *Act:* if the player is inside the ring when it closes, the trunk curls round them and lifts them target 1 block off the ground, in place: the player is captured for `CAPTURE_TIME` (target 3 s) and one practice they hold is taken ([guardians, section 6.6](README.md#66-what-works-and-harm)). Then it sets them down on the same cell and draws the trunk back to Drinking.
- *Answer:* leave the ring before it closes; a jump or a run of 2 blocks is enough. A block overhead stops the trunk (it reaches down from above, like a lob), and the trunk then rests on the block for its recovery.
- *Positive intention:* a positive intention on the glowing tip while it reaches makes it curl back: no capture. While the trunk reaches and while it holds the player, the head leans out over the rim, so it takes positive hits from the top terraces as it does while the trunk is raised (B2, the rim).

**Without minions.** None of the six needs a minion.

### B4. Defeat by positive hits

- **Hit count:** target 36 positive hits.
- **What counts:** a positive intention that touches the small body (in line over the rim) or the head while the trunk is raised.
- **Progress (target):** each positive hit leaves one short gold mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the elephant's ears hang a little looser, as if a weight were set down. The sign is a target until the owner confirms it.
- **Allies:** an ally standing in the waterhole on the ground ring answers the deity's trumpet with its own, adding one positive hit every target 6 s. Allies cannot climb, so their help comes from below. At most target 3 count at once.
- **When defeated:** as proposed in section 6 of this document (it sets its weight down, and the water drains from the channels). It changes its attitude (provisional, owner, 2026-11-03).

### B5. Minions

- **How many:** at most target 5 on the floor, a herd, allies included. At most target 3 hostile.
- **Spawn:** from the waterhole, the herd's pool on the ground ring at the mountain's foot (B6). Bubbles rise and a low rumble grows for target 2 s, and a young elephant wades out. One every target 15 s while fewer than 3 are hostile.
- **Movement (the elephant's own):**
  - walks heavily at a steady target 2 blocks a second that never changes, in water or out;
  - walks in file: the herd follows the oldest minion, nose to tail, along the ground ring and the first terrace and their channel banks, and crosses between the two up a dry channel's stair;
  - steps up at most 1 block and never climbs a ledge higher than that;
  - never steps onto a player block.
- **Behaviour rules:**
  1. It does not climb above the first terrace, so going up is always an escape.
  2. Protective: when the player stands in the herd's path or between two minions, the nearest one flaps its ears (telegraph target 1.1 s) and shoulders the player aside, target 2 blocks, away from the herd.
  3. When the player keeps out of the herd's path, the herd walks by.
  4. Spray: a minion that reaches a channel's foot sprays water up it for target 3 s (the same telegraph as the deity's spray, smaller: the trunk lifts, the arrows ripple).
  5. At the deity's trumpet the herd stops and turns toward the waterhole for target 2 s.
  6. Trumpet: when a minion of the herd is turned ally, the leader raises its trunk (telegraph target 1.1 s) and trumpets. The rest of the herd closes ranks round the leader for target 3 s and does not push in that time. The trumpet is a call, not an attack: it makes no ring.
- **A positive intention:** each hit makes it flap its ears slowly and lower its head. After target 5 hits it turns ally; the elephant is the heaviest minion to turn.
- **A negative intention:** goes out with a puff against its hide. Nothing changes.
- **What an ally does:**
  - *Hold:* it stands across a channel's bed on the ground ring or the first terrace and holds the water back like a dam, while it stays.
  - *Clear:* it steps in front of a hostile minion about to push the player and takes the push itself.
  - *Carry:* a player who stands in front of an ally is lifted by its trunk one terrace up (target 6 blocks, one wall), once every target 6 s. An ally on the ground lifts to the first terrace, one on the first terrace to the second.
  - *Help:* it stands in the waterhole and adds positive hits (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the herd is removed and the rim stays; the floor is then won by climbing alone.

### B6. Platforming layout (rules)

Status: provisional, to confirm (design pass, 2026-11-04). The first build of this floor found that the earlier rules put both the waterhole and the Basin at the centre, gave the waterhole no ring it fitted in, and counted the hall's height two ways. This layout resolves all three; the resolutions and the owner's words each one keeps are listed after the rules. Every number is a target.

**How heights are counted.** Heights are in blocks from the hall's ground: height 0 is the first row above the slab below (realm row 110). A surface "at height h" is one the player stands on at h; its top block is at h − 1.

- **Size:** target 48 blocks across (radius 24) and 34 blocks high: the floor's blocks fill heights 0 to 33 (rows 110 to 143). Above them the hall keeps 4 rows of headroom, heights 34 to 37 (rows 144 to 147), under the slab of the next floor. The hall is 38 rows in all ([sky architecture, section 7.1](../../../../architecture/SKY.md)).
- **The base:** a disc of pale stone over the whole floor, 2 blocks thick (heights 0 and 1), so the ground is at height 2. The waterhole is cut into the base and never into the slab, which is heartwood and stays whole.
- **Five rings rising toward the centre.** Each ring is a disc of one height; each wall between two rings is 6 blocks high, too high to jump.

| Ring | Radius (from the axis) | Surface at | What is on it |
|---|---|---|---|
| The ground ring | 19 to 24 | 2 | The waterhole, the herd, the channels' feet, the tusk line's first strip |
| The first terrace | 15 to 18 | 8 | Channel stairs; the highest ring the herd walks |
| The second terrace | 11 to 14 | 14 | Channel stairs |
| The third terrace | 7 to 10 | 20 | Channel stairs; Trunk swat reaches it |
| The Basin's mesa | 0 to 6 | 26 | The shore (radius 5 to 6), the rim (radius 4), the pool (radius 0 to 3) |

- **The Basin:** a pool of radius 3 cut 2 blocks deep into the mesa's top. Its water line is at 26, level with the shore. The rim is a ring one block thick at radius 4, 2 blocks high (its top at 28). Over each channel's head the rim has a spout: a culvert one block high at the water line, under the rim's upper row, so the rim's line stays whole. The Basin's water stays in the Basin; a channel fills only when the elephant or a minion calls the current (B3, B5).
- **The waterhole:** a pool of radius 2, 2 blocks deep, cut through the base on the ground ring, centred about 21 blocks from the axis on the diagonal opposite the tusk line. Its surface is level with the ground. Its water is part of the floor and always there. It is the only water deep enough to swim ([swimming](../../../built/player/SWIMMING.md)).
- **Channels:** target 4, one from each spout, the spouts on the four axes. A channel runs down the rings as a chain of straight stretches, each along one axis: across the shore (2 blocks); then, at each wall, a **stair stretch** of 6 one-block steps running along the foot of the wall, from the upper ring's surface down to the lower one's; between two stairs, a **level stretch** across the terrace to its outer edge. Each stair turns back the opposite way from the one above (the switchback), so a channel stays within target 7 blocks of its axis. A channel falls 24 blocks (26 to 2) in four stairs and ends on the ground ring. When dry, a bed is the way up; when wet, its current carries the player down.
- **Troughs and banks:** every stretch is a trough three blocks wide: a bed 1 block wide between two banks 2 blocks above it. A stair stretch is solid down to the ring below. Along its six blocks it takes three of the terrace's four blocks of width; the rest of each terrace stays open. Every target 6 blocks a bank has a cut, a one-block step, so the player can climb out of the bed onto a bank, or cross the trough from cut to cut.
- **Dams:** one block across a bed stops the water there. A player who climbs a bed builds a staircase of dams as they go: each dam keeps the stretch below it dry.
- **Water:** channels are 1 block deep, so nobody swims or drowns in them. Only the waterhole is deep enough to swim.
- **Straight up: the tusk line.** One dry radial line on the diagonal between two channels, opposite the waterhole. It is five ledge strips (one-block ledges, one per height, turning round a 2 × 2 square): one against the foot of each wall (ledges at heights 2 to 7, 8 to 13, 14 to 19 and 20 to 25), and the last standing on the shore, from 26 to 33, under the way up to floor 4. From its top ledge the player stands at 34 with 4 rows of headroom. It never carries water, and the channels keep target 2 blocks clear of it. Trunk swat and Trumpet reach its last strip. From that strip's upper ledges (standing at 27 or higher) the small body is in line over the rim.
- **Nests:** target 5, one on each ring, beside a channel and never in a bed, each with 3 cubes. The shore's nest sits by the tusk line's last strip and gives the block that lifts the player over the rim's line.
- **The arrival (to confirm with the sky tree).** The way up from the koala's floor comes through the slab about 14 blocks from the axis, under the terraces. That column stays clear: a shaft of air as wide as the way up, through the base and the rings above it, with the way up's ledges continued to the surface the shaft reaches.

**How it is built.** Only the sky world's shape kinds ([sky architecture, section 3.3](../../../../architecture/SKY.md)), applied in this order:

| Element | Shapes |
|---|---|
| Base, terraces, mesa | One `ring` disc each (inner radius 0), from the base up: radius 24 at heights 0–1, 18 at 2–7, 14 at 8–13, 10 at 14–19, 6 at 20–25 |
| The Basin | An air `ring` disc of radius 3 at heights 24–25, then a water `elem` box over it; the rim a `ring` of radius 4 to 4 at heights 26–27; each spout an air `box` of one cell at height 26 |
| The waterhole | An air `ring` disc of radius 2 at heights 0–1 on its centre, then a water `elem` box over it |
| Each stretch of a channel | Three `run`s along one axis: the bed and its two banks. A stair's runs fall one block per step, and their height reaches down to the ring below, so the stair is solid; a bank's run is 2 blocks taller than the bed's |
| Bank cuts | An air `box` of one cell on a bank's top row |
| The tusk line | Five `ledges` strips |

**Example route.** Leave the ground ring by a dry channel's stair. When the arrows ripple in it, step onto the bank through the nearest cut. Take a cube from the first terrace's nest and dam the bed just above you, then climb the dry stretch. Turn a minion into an ally on the way and let it lift you a terrace. Keep moving so Memory stone falls behind you. On the shore, raise one block against the rim's line and land positive hits on the small body over the rim during its drink.

**Resolutions (provisional, to confirm).** The numbers the first rules gave were proposals, not the owner's; these resolutions change only proposals.

1. **One centre: the Basin at the top.** The Basin's mesa stays at the centre of the floor and at its top, and the waterhole leaves the centre for the ground ring at the mountain's foot. The deity, its rim and every attack were written around a central Basin, so this choice changes the least. Keeps the owner's words: the elephant levitates over its place (decided), the tower rule (decided), and the water currents, instantiated water that pushes and carries the player (the owner's hindrance).
2. **Rings that fit.** The rings rise toward the Basin, which they now meet. To give the waterhole room, the floor has three terraces instead of four, so the ground ring is 6 blocks wide (19 to 24), and the waterhole shrinks to radius 2. The ground stands on a 2-block base, so the waterhole is deep enough to swim without cutting the slab. The channels still run from the Basin to the ground, with their dams; the tusk line still goes straight up. Keeps the owner's words: every floor can be passed with nothing and leaves a route straight up ([laws 3.4 and 3.5](../README.md#34-each-floor-can-be-passed-with-nothing)), and the way up opens over that route only when the deity is won (decided).
3. **One height: 34 blocks and 4 of headroom.** The sky architecture's hall ground (110) and hall top (147) are both rows of the hall: 38 rows, which is 34 plus 4. The 37 was the difference between the two, not a count, so nothing in the architecture changes. The floor's blocks fill rows 110 to 143. Keeps the owner's words: the only way up is inside the tree ([law 3.8](../README.md#38-the-only-way-up-is-inside-the-tree)), through the way up over the tusk line.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Water currents](../abilities/WATER-CURRENTS.md) | Flow arrows in the bed, rising water sound, 1.1 s | Bank, jump, dam, positive shot at the channel's head |
| [Knockback](../abilities/KNOCKBACK.md) | Lowered trunk, dust, the arc drawn, 1.1 s; a minion's ear flap | Step out of the arc, block behind you, positive shot on the trunk |

### B8. Routes

- **With nothing:** the tusk line reaches the shore and its own upper ledges with one-block jumps alone, and from there the small body is in line over the rim. The dry channel stairs are a second way up, and the shore's nest gives the one block that lifts the player over the rim's line. A player with no practices can also win slowly from below with three allies in the waterhole.
- **With practices:** carrying more blocks builds a whole dam staircase in one trip; a higher jump clears the bank cuts and the rim's line; swimming or water practices make the currents a ride up instead of a fall; a longer range or a lob-shaped shot reaches the body over the rim from the third terrace.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.1 s | windup 0.4 to 0.9 s |
| Recovery (Drinking) | 2.5 s | up to about 1 s |
| Rest between attacks | 3, 2.5, 2 s by stage | a short walk, shorter each phase |
| Current speed | 3 blocks a second | wading pace about 2.8 blocks a second |
| Positive hits | 36 | 229 health: about 65 bad hits |
| Hits to turn a minion | 5 | 5 good hits for a projection |
| Minions at once | 5 (3 hostile) | no built equivalent |
| Floor size | radius 24, 34 high (rows 110 to 143), 4 rows of headroom (hall 110 to 147) | trunk story 22 high |
| Rings | ground 2, terraces 8, 14, 20, the Basin's shore 26; walls 6 | no built equivalent |
| The Basin | pool radius 3, water line 26, rim top 28; the deity floats 1 over the water | no built equivalent |
| The waterhole | radius 2, 2 deep, on the ground ring | water: wade at 60% of pace |
| Channels | 4, each four stairs of 6 one-block steps, bed 1 wide, banks 2 above, a cut every 6 | no built equivalent |
| The tusk line | five ledge strips, top ledge at 33 (the player stands at 34) | no built equivalent |
| Carry by an ally | one terrace, 6 blocks | no built equivalent |
| Harm of a lob | none (decided: it pushes or holds) | boss touch 8 |
| Special attacks (provisional) | 6: 3 drain spirit (16, 12, 14 of 100), 1 captures (3 s, one practice), 2 slow or move | no built equivalent |
| Special telegraphs | 1.1 s to slow or move, 1.3 s to drain, 1.6 s to capture | windup 0.4 to 0.9 s |

## Open questions

1. Is the water a hindrance the elephant creates, or a feature of the floor that the elephant only switches on?
2. Does the elephant's trunk push send the player off a ledge with no fall, or always onto a safe block? (Knockback rules: [knockback](../abilities/KNOCKBACK.md).)
3. Does the dam the player builds stay after the floor is cleared?
4. Is the elephant's floor the one that can be cleared without minions? (See [guardians](README.md).)
5. Memory. The elephant aims its spray and its stone at the place the player stood longest in the last 10 s. Does that read as the mirror of carrying an old weight, or as a punishment for resting, which the panda's floor rewards?
6. The rim. Shots from below the rim stop on it. Is a guard made of a solid block right, or should the body always be in line?
7. The trunk lift. An ally lifts the player one terrace. Is a carry by an ally allowed here? (The same question is asked for the horse.)
8. Allies far away. Allies in the waterhole add positive hits from the ground, about 25 blocks below the deity. Is help at a distance acceptable?
9. Currents and minions. The herd wades without slowing and is not carried by the currents. The abilities folder leaves this open ([water currents](../abilities/WATER-CURRENTS.md)).
10. Teleport (answered, provisional: no). The elephant does not teleport.
11. When the elephant is defeated, does it transform, change its attitude, or leave? Provisional (owner, 2026-11-03): it changes its attitude.
12. Special attacks (provisional, B3b). The owner accepts the drain amounts (Dust bath 16, Low rumble 12, Heavy water 14) for now, to adjust later (2026-11-05). Which drain and which capture stay provisional. Dust bath now drains more than the phase 2 rumble: keep that order, or raise Low rumble and Heavy water too?
13. Memory and spirit. Dust bath aims at the remembered place, like Memory stone and Trunk spray. The owner keeps it and raised its drain (2026-11-05). Still open: does a drain that punishes resting read well on the floor after the panda's, which rewards it?
14. Heavy water. Answered (owner, 2026-11-05): it is a special attack that drains; keep it.
15. Ear fan and Mud wallow. Answered (owner, 2026-11-05): reusing other animals' hindrances ([wind](../abilities/WIND.md), [dense ground](../abilities/DENSE-GROUND.md)) is fine; keep both.
16. The centre (provisional, to confirm). B6 puts the Basin at the top and the centre, and the waterhole at the mountain's foot. The other choice is a bowl: the waterhole at the centre and the bottom, the rings rising outward to the hall's wall, and the Basin on the top ring at one side. Which does the owner want?
17. The waterhole's size (provisional, to confirm). To fit on the ground ring it shrinks from radius 6 to radius 2, 2 deep. Is a small pool enough to read as the herd's waterhole?
18. Three terraces (provisional, to confirm). The floor has three terraces between the ground and the Basin instead of four, so the ground ring has room. Is that the right trade?
19. The tusk line's top (provisional, to confirm). The tusk line climbs past the shore to 34, under the way up, so from its upper ledges the small body is in line over the rim. That makes the with-nothing route a straight climb. Is that too easy a view of the guarded body?
20. The arrival (for the sky tree, to confirm). The way up from the koala's floor comes through the slab under the terraces. Does the sky tree carve the arrival shaft, or does this floor? Built reading (2026-11-06, the engineer's, to confirm): the sky tree carves it. The climb from the koala's floor cuts a 2 × 2 shaft through whatever of this floor stands over the way up and runs its ledges up to the surface it reaches ([sky architecture, section 7.1](../../../../architecture/SKY.md); [WAY-UP](../../../built/sky/laws/WAY-UP.md)).
21. The floor's name (provisional, to confirm). *The channels* (Spanish: *Los canales*).
