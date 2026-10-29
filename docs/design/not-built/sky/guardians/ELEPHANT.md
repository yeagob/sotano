# Elephant: the third guardian (sky floor 3)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The elephant is the third deity: an elephant with a giant head on a small, soft plush body, over sky floor 3, a floor of channels and rivers that carry the player.

Status: proposal, specified. The animal and the floor order are decided. The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

An elephant head, huge, grey, with ears that open like sails and a trunk that curls down to the floor. Elephants remember. They travel long distances, they keep to their herd, and they are slow to anger and slow to forget.

**Mirror (proposal).** The elephant mirrors carrying an old weight: grudges, old hurts and the rehearsal of what happened long ago, carried into every new room. The pattern is memory that never gets put down. The practice the elephant points to is remembering with care and putting the weight down on purpose.

The elephant is wise and strong rather than cruel. Its floor is about carrying: what the player carries, and what the floor carries away.

## 2. Floor order

Sky floor 3, the middle of the five. The player arrives having learned to climb (panda) and to commit to a jump (koala). Here the floor moves: water and its currents make every route a question of direction.

## 3. Minions

The minions are the elephant itself, embodied as smaller elephants of the herd. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Elephants walk heavily, in lines, with a steady pace that does not change. A minion walks the floor like the herd walks a path, and it wades through water without slowing.
- **Character.** Patient, protective of the herd, not quick to attack. It flaps its ears, which is the sign it is about to push.
- **Rules tied to the animal.** A minion pushes the player with its shoulder or its trunk (see [knockback](../abilities/KNOCKBACK.md)). It sprays water from its trunk (see [water currents](../abilities/WATER-CURRENTS.md)). It does not climb: it stays on the floor, so the player can always escape up.

## 4. Arena and puzzle

**The arena.** The floor is a set of channels cut into the blocks, with banks between them and a central pool. Water runs through the channels. Some channels are dry at the start, and water fills them when the elephant calls it.

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

## 6. The stitch

The elephant falls when the player hits it with enough positive intentions. The meaning of the stitch is open ([guardians](README.md#1-the-shared-contract)). The elephant's fall is proposal: the water drains from the channels, and the herd of minions stays on the floor until it is done.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, block nests, telegraphs, seams, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A great grey head with ears like sails, standing in a high basin of water. Everything on the floor runs downhill from the elephant: the channels are its stairs, and water is its weight. The elephant remembers where the player rested, and aims there. The floor rewards a player who reads the water and puts a dam where it matters.

### B2. The deity

**Position.** The elephant's Basin is a round pool on a mesa at the top of the floor, target 30 blocks up, with a rim 2 blocks high round it. Option A (levitates): the elephant floats target 1 block over the water, its trunk reaching down into it. Option B (stands): it stands in the Basin, the water to its small knees. Both options are open.

**The rim (the elephant's guard).** A positive intention fired from below the rim's top strikes the rim, which is a solid block, and dies on it ([attacks](../../../built/encounters/ATTACKS.md)). The small body is in line only from the top terrace, from a player block raised high enough, or from the air. The head, which rises above the rim, can be stitched from lower, but only while the trunk is raised (in Trunk spray and Trumpet).

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Idle | Sways from foot to foot, trunk swinging | 4 s |
| Listening | Ears fan open wide; starts when the player climbs onto a new terrace | 1.5 s |
| Attacking | One attack (B3), telegraph 1.1 s | per attack |
| Drinking | Trunk down in the Basin, a long drink | 2.5 s |
| Hurt | Ears flap once, a low rumble | 0.3 s |
| Rallying | Trumpets when a seam is complete; the herd turns toward the waterhole | 2 s |

**The cycle.** Idle, Listening, Attacking, Drinking, Listening (or Idle when the player is out of sight). Drinking is its recovery. The rest before the next telegraph is target 3 s in seam 1, 2.5 s in seam 2 and 2 s in seam 3.

**Memory (the elephant's own rule).** The elephant keeps the place where the player stood longest in the last target 10 s. Memory stone and Trunk spray aim there, not at the player. The mirror is carrying an old weight: the attack lands where the player was, and a player who keeps moving is never where it lands.

### B3. Attacks

The elephant has four attacks. Seam 1 uses Trunk spray and Trunk swat. Seam 2 adds Memory stone. Seam 3 adds Trumpet.

**1. Trunk spray ([water currents](../abilities/WATER-CURRENTS.md)).**
- *Telegraph (1.1 s):* the trunk lifts and curls toward one channel's head; faint flow arrows ripple down the channel's bed, and a rising sound of water comes. The chosen channel is the one that passes the remembered place.
- *Act:* water fills that channel from its head and runs downhill for target 6 s, then drains in visible steps. The current carries the player down at target 3 blocks a second. For comparison, the built player wades at 60% of their pace, about 2.8 blocks a second, so a player in the current is carried, slowly, until they step out.
- *Answer:* step up onto a bank, jump across, or dam the channel above you (a player block stops the flow there; the bed below the dam stays dry). A positive intention at the channel's head stops the flow for target 3 s (proposal). A block in the channel stops it.

**2. Trunk swat ([knockback](../abilities/KNOCKBACK.md)).**
- *Telegraph (1.1 s):* the trunk lowers and swings back; dust lifts and the arc of the kick is drawn from the player's feet to where they will land.
- *Act:* the player is sent target 3 blocks along the arc, away from the Basin. It reaches only the top two terraces (within target 7 blocks of the Basin).
- *Answer:* step out of the arc's line, or stand with a block behind you (the kick stops at the first solid block). A positive intention on the lowered trunk during the telegraph turns the kick into a soft push of 1 block (proposal). The arc never ends over a drop that it did not show.

**3. Memory stone (a lob).**
- *Telegraph (1.1 s):* the trunk lifts a wet round stone out of the Basin; a warm mark appears on the remembered place.
- *Act:* the stone lands and stays as a one-block sky stone for target 8 s, then dissolves. It may take target 2 points if it lands on the player (harm is open). A stone that lands in a channel dams it while it lasts.
- *Answer:* do not be where you rested. A block overhead stops it (lobs die on solid blocks). A positive intention that meets it in the air bursts it into a splash (proposal). A stone the elephant drops into a channel can be used as the player's dam.

**4. Trumpet (a ring).**
- *Telegraph (1.1 s):* the ears fan, the trunk rises straight up, and a deep note gathers.
- *Act:* a ring of sound runs along the terrace the player is on, at target 7 blocks a second, target 0.8 blocks high, and pushes target 1.5 blocks outward.
- *Answer:* jump it, or stand on a block 1 high (a block stops the push). A positive intention on the raised trunk during the telegraph muffles it: the ring still runs but does not push. The raised trunk is also the head's open moment for stitches.

### B4. The stitch

- **Count:** target 36 stitches, 12 per seam.
- **What counts:** a positive intention that touches the small body (in line over the rim) or the head while the trunk is raised.
- **Progress:** a seam of light runs from one ear to the other over the plush shoulders; each stitch is one short gold stitch. A complete seam glows. Over the three seams the elephant's ears hang a little looser, as if a weight were set down.
- **Allies:** an ally standing in the waterhole on the ground answers the deity's trumpet with its own, adding one stitch every target 6 s. Allies cannot climb, so their help comes from below. At most target 3 count at once.
- **The fall:** as proposed in section 6 of this document (the water drains from the channels).

### B5. Minions

- **How many:** at most target 5 on the floor, a herd, allies included. At most target 3 hostile.
- **Spawn:** from the waterhole, the central pool at the bottom. Bubbles rise and a low rumble grows for target 2 s, and a young elephant wades out. One every target 15 s while fewer than 3 are hostile.
- **Movement (the elephant's own):**
  - walks heavily at a steady target 2 blocks a second that never changes, in water or out;
  - walks in file: the herd follows the oldest minion, nose to tail, along the banks of the two lowest terraces;
  - steps up at most 1 block and never climbs a ledge higher than that;
  - never steps onto a player block.
- **Behaviour rules:**
  1. It does not climb above the second terrace, so going up is always an escape.
  2. Protective: when the player stands in the herd's path or between two minions, the nearest one flaps its ears (telegraph target 1.1 s) and shoulders the player aside, target 2 blocks, away from the herd.
  3. When the player keeps out of the herd's path, the herd walks by.
  4. Spray: a minion that reaches a channel's foot sprays water up it for target 3 s (the same telegraph as the deity's spray, smaller: the trunk lifts, the arrows ripple).
  5. At the deity's trumpet the herd stops and turns toward the waterhole for target 2 s.
  6. Trumpet: when a minion of the herd is turned ally, the leader raises its trunk (telegraph target 1.1 s) and trumpets. The rest of the herd closes ranks round the leader for target 3 s and does not push in that time. The trumpet is a call, not an attack: it makes no ring.
- **A positive intention:** each hit makes it flap its ears slowly and lower its head. After target 5 hits it turns ally; the elephant is the heaviest minion to turn.
- **A negative intention:** goes out with a puff against its hide. Nothing changes.
- **What an ally does:**
  - *Hold:* it stands across a channel's bed on the lower terraces and holds the water back like a dam, while it stays.
  - *Clear:* it steps in front of a hostile minion about to push the player and takes the push itself.
  - *Carry:* a player who stands in front of an ally is lifted by its trunk one terrace up (target 3 blocks), once every target 6 s.
  - *Help:* it stands in the waterhole and adds stitches (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the herd is removed and the rim stays; the floor is then won by climbing alone.

### B6. Platforming layout (rules)

- **Size:** target 48 blocks across (radius 24) and 34 blocks high.
- **Terraces:** five rings rising toward the centre: the ground (with the waterhole, radius 6, 3 blocks deep), then terraces at 6, 12, 18 and 24, each target 4 blocks wide. The Basin's mesa (radius 4) rises to 30. Terrace walls are 6 blocks high, too high to jump.
- **Channels:** target 4 channels run from the Basin down to the waterhole, switching back across the terraces. Each bed is 1 block wide and is a stair of one-block steps: when dry it is the way up; when wet its current carries the player down.
- **Banks:** each channel runs between banks 2 blocks above its bed. Every target 6 blocks a bank has a cut, a one-block step, so the player can climb out of the bed onto a bank.
- **Dams:** one block across a bed stops the water there. A player who climbs a bed builds a staircase of dams as they go: each dam keeps the stretch below it dry.
- **Water:** channels are 1 block deep, so nobody swims or drowns in them. Only the waterhole is deep enough to swim ([swimming](../../../built/player/SWIMMING.md)).
- **Straight up:** one radial line, the tusk line, has one-block ledges staggered up every terrace wall and the Basin's mesa. It is dry and never carries water. Trunk swat and Trumpet reach its top.
- **Nests:** target 5, one on each terrace by a channel's head, each with 3 cubes.

**Example route.** Leave the ground by a dry channel bed. When the arrows ripple in it, step onto the bank through the nearest cut. Take a cube from the nest at 6 and dam the bed just above you, then climb the dry stretch. Turn a minion into an ally on the way and let it lift you a terrace. Keep moving so Memory stone falls behind you. On the top terrace, raise one block against the rim's line and stitch the small body over the rim during its drink.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Water currents](../abilities/WATER-CURRENTS.md) | Flow arrows in the bed, rising water sound, 1.1 s | Bank, jump, dam, positive shot at the channel's head |
| [Knockback](../abilities/KNOCKBACK.md) | Lowered trunk, dust, the arc drawn, 1.1 s; a minion's ear flap | Step out of the arc, block behind you, positive shot on the trunk |

### B8. Routes

- **With nothing:** the tusk line reaches the top terrace with jumps alone, and the nests give enough blocks to see over the rim. A player with no practices can also win slowly from below with three allies in the waterhole.
- **With practices:** carrying more blocks builds a whole dam staircase in one trip; a higher jump clears the bank cuts and the rim's line; swimming or water practices make the currents a ride up instead of a fall; a longer range or a lob-shaped shot reaches the body over the rim from lower terraces.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.1 s | windup 0.4 to 0.9 s |
| Recovery (Drinking) | 2.5 s | up to about 1 s |
| Rest between attacks | 3, 2.5, 2 s by seam | a short walk, shorter each phase |
| Current speed | 3 blocks a second | wading pace about 2.8 blocks a second |
| Stitches | 36 (12 a seam) | 229 health: about 65 bad hits |
| Hits to turn a minion | 5 | 5 good hits for a projection |
| Minions at once | 5 (3 hostile) | no built equivalent |
| Floor size | radius 24, 34 high | trunk story 22 high |
| Harm of a lob | 2 points, if harm is kept | boss touch 8 |

## Open questions

1. Is the water a hindrance the elephant creates, or a feature of the floor that the elephant only switches on?
2. Does the elephant's trunk push send the player off a ledge with no fall, or always onto a safe block? (Knockback rules: [knockback](../abilities/KNOCKBACK.md).)
3. Does the dam the player builds stay after the floor is cleared?
4. Is the elephant's floor the one that can be cleared without minions? (See [guardians](README.md).)
5. Memory. The elephant aims its spray and its stone at the place the player stood longest in the last 10 s. Does that read as the mirror of carrying an old weight, or as a punishment for resting, which the panda's floor rewards?
6. The rim. Shots from below the rim die on it. Is a guard made of a solid block right, or should the body always be in line?
7. The trunk lift. An ally lifts the player one terrace. Is a carry by an ally allowed here? (The same question is asked for the horse.)
8. Allies far away. Allies in the waterhole add stitches from the ground, 30 blocks below the deity. Is help at a distance acceptable?
9. Currents and minions. The herd wades without slowing and is not carried by the currents. The abilities folder leaves this open ([water currents](../abilities/WATER-CURRENTS.md)).
10. Levitation stays open: the specification writes the deity's position as option A (levitates) and option B (stands or sits). The behaviour is the same in both.
