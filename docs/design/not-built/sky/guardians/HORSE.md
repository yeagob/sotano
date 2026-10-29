# Horse: the fifth guardian (sky floor 5)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The horse is the fifth and last deity of the sky tree's first five floors: a small, soft plush body with a giant horse head, over sky floor 5, a ground-based floor of paddocks, gusts of wind and fading platforms. It is the only deity that does not levitate: it walks on the ground and jumps a great deal.

Status: proposal, specified. Decided: the animal and the floor order, its look (a small body with a giant horse head, plush-like and cute), that it walks on the ground and does not levitate, that it jumps a great deal from platform to platform and from place to place, that it sends its minions to kick the player from its place, that it is defeated by stitching it with many positive shots and never dies, and the tower rule of the [sky laws](../README.md#39-a-tower-that-reaches-a-deity-is-knocked-down). The character, the mirror, the other minion habits and the puzzle are proposals.

## 1. Who it is

A small, round, soft plush body under a giant horse head, wide-eyed, nostrils open, mane streaming, cute like the other deities. It stands and walks on the ground on short legs. It never levitates. Horses are quick and sensitive. They startle at a shadow, bolt from a noise, and then come back to the herd. They are also the animal that people learn to ride: they trust a rider who stays calm.

**Mirror (proposal).** The horse mirrors bolting: the reflex of running from a feeling the moment it appears, so fast that the feeling never gets a chance to be felt. The practice the horse points to is staying with a feeling long enough to know it, and gathering the reins, which is calm rather than speed.

The horse is not a villain. Its floor is the fastest of the five, and its lesson is that speed is not the answer to a feeling.

## 2. Floor order

Sky floor 5, the last of the five. The player arrives having climbed, jumped, carried water and held their nerve. Here the floor rewards a steady pace: fast routes are there, but the player does not need speed to pass.

## 3. Minions

The minions are the horse itself, embodied as horses of the herd. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Horses gallop in loops, rear up, and bolt. A minion runs around the floor in a wide loop and comes back toward the player at speed, then turns away.
- **Character.** Quick, alert, easily startled, and loyal to the herd. A minion that is startled runs, and it returns when the herd calls it.
- **Rules tied to the animal.** The horse sends its minions from its place to kick the player (decided). A minion kicks the player back with its hind legs (see [knockback](../abilities/KNOCKBACK.md)). It runs through the floor's fading platforms and does not fall with them, which the player can see coming. It never bolts off the floor.

## 4. Arena and puzzle

**The arena.** The floor is ground-based: a wide meadow with raised paddocks, low platforms of different heights, and runs of platforms that fade and reform, with gusts of wind over the gaps. It is wider than any other floor and has few walls.

**The platforming.** Running across the ground, jumps from platform to platform, and runs timed to the next platform's return, against the wind. The horse itself jumps a great deal: it leaps from paddock to paddock across the floor, so the player follows it on the ground and over the platforms. The fastest routes are shortest; the slowest routes are the safest.

**The puzzle (proposal).** From its paddock the horse sends its herd to kick the player, platforms fade one after another, each after a warning, and a gust pushes the player toward the gap. The player builds a platform ahead of the one that fades, so the route is a chain of blocks the player keeps. The steady route is always there: the player who walks, builds and waits is not punished for not running.

**Hindrances used (proposal).**

- [Fading platforms](../abilities/FADING-PLATFORMS.md): platforms disappear, or parts of them, always after a clear warning.
- [Wind](../abilities/WIND.md): gusts push the player across the floor, always after a visible sign.
- [Knockback](../abilities/KNOCKBACK.md): the minions' kicks and the horse's stamp.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at a horse minion turns it into an ally (decided, see [minions](../minions/README.md)). This horse ally, proposal:

- runs under a fading platform and holds it up for a moment, so the player can cross;
- carries the player across a gap on its back, for a short run.

## 6. The stitch

The player defeats the horse by stitching it with many positive intentions ([guardians](README.md#1-the-shared-contract)). It does not die. When it is stitched it transforms, changes its attitude, or leaves; which one is open. Proposal: it changes its attitude: it stops leaping away, walks up to the player, and the floor's wind stops with it.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, the stitch, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A wide-eyed giant head with a streaming mane on a small plush body, standing on a paddock of a wide meadow, and leaping to another paddock far across the floor when the player rushes at it. From where it stands it whinnies, and its herd gallops out to kick the player. It comes closer when the player is still. The fastest floor of the five is won by calm: a player who stands still is the one the horse lowers its head to.

### B2. The deity

**Position.** The horse stands and walks on the ground (decided: it does not levitate). Its places are the Paddocks: target 6 raised, fenced platforms target 5 by 5, at heights from 0 to target 12 blocks, spread across the meadow at target 12 to 20 blocks from each other. The horse stands on one Paddock at a time and leaps between them.

**The great leap (decided that it jumps a great deal; the numbers are targets).** The horse jumps from platform to platform and from place to place. A leap crosses up to target 20 blocks and rises up to target 8 blocks, far beyond the player's jump of about 1.26 blocks high and about 2.7 blocks across. It always lands on a Paddock or on open ground, never on the player.

**Teleport (which deity: open).** The horse already moves far by its great leap. If the horse is also one of the deities that teleport, a teleport would fit when it is startled: it vanishes from its Paddock and reappears on the Paddock farthest from the player, always far from them.

**The tower rule.** A tower of player blocks that brings the player to the horse's height (the shared rule in [guardians, section 6.2](README.md#62-states-every-deity-shares)) is knocked down: the horse leaps to it, kicks the stack with its hind legs until it topples, and pushes the player off, after the full warning. The horse's Paddocks are low, so the rule triggers only on a tower raised beside a Paddock.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Grazing | Head down, tail swishing, walking slowly round its Paddock | 3 s |
| Alert | Ears up, head high; starts when the player is within 14 blocks or on its Paddock | 1 s |
| Attacking | One attack (B3), telegraph 0.9 s | per attack |
| Sending | Whinnies with its head toward the player; one or two minions gallop out to kick (B5) | 1.5 s |
| Leaping away | Crouches, then makes a great leap to another Paddock, far from the player | 1.5 to 2 s |
| Recovering | Blows through its nose and shakes its mane | 2 s |
| Gentled | Walks up to a still player and lowers its head | 3 s |
| Hurt | A flinch and a soft snort; it does not leap away | 0.3 s |
| Rallying | Rears and whinnies when the stitches reach a third and two thirds of the target; the herd circles, and the wind turns | 2 s |

**The cycle.** Grazing, Alert, Sending or Attacking in turn, Recovering, Alert. The rest before the next telegraph is target 2.5 s in the first stage, 2 s in the second and 1.5 s in the third (stages: [guardians, section 6.5](README.md#65-the-stitch)).

**Startle and calm (the horse's own rules).**
- *Startle:* when the player comes within target 6 blocks of the horse while moving, or lands a jump within 6 blocks, it leaps away to a Paddock far from the player. The leap's telegraph is its crouch and a landing mark drawn on the far Paddock, target 0.9 s.
- *Calm:* when the player stands still on the horse's Paddock or within target 8 blocks of it for target 1.5 s, in the horse's sight, and no attack is in its telegraph, the horse walks up to target 3 blocks from them and is Gentled for 3 s. It makes no attack and sends no minion while Gentled.
- The mirror is bolting; the practice is staying with a feeling. The floor's verb for it is standing still.

**Sending the herd (decided that it sends its minions to kick; the timings are targets).** From its place the horse whinnies toward the player (telegraph target 0.9 s: the head turns to the player, the ears point forward). One minion in the first stage, and up to two from the second stage, break off their loop and gallop to the player to kick (B5, rule 2). The horse itself stays on its Paddock while they go.

### B3. Attacks

The horse has four attacks besides sending the herd. The first stage uses Rear and stamp and Tail gust. The second adds Leap and land. The third adds Whinny wave.

**1. Rear and stamp ([knockback](../abilities/KNOCKBACK.md) and [fading platforms](../abilities/FADING-PLATFORMS.md)).**
- *Telegraph (0.9 s):* the horse rears, front hooves high; dust shows the arc of the push round it, and the two platform segments nearest the player turn grey at the edges and flicker with a speeding tick.
- *Act:* the hooves land. A player within target 3 blocks is pushed target 2.5 blocks along the shown arc. The two flickering segments fade for target 3 s and reform with a chime.
- *Answer:* keep out of the 3 blocks, or stand with a block behind you; move off the flickering segments, or build ahead (player blocks never fade). A positive intention on the raised hooves turns the push into a soft one of 1 block, and one on a flickering segment holds it for target 2 s (both proposal).

**2. Tail gust ([wind](../abilities/WIND.md)).**
- *Telegraph (0.9 s):* the tail swishes; petals lift on a line across the meadow toward the nearest gap, with a growing whistle.
- *Act:* a gust for target 3 s pushes the player along the line at target 3 blocks a second. A player pushed off a platform falls to the ground or a lower platform, unhurt.
- *Answer:* walk against it, or build a wall in its line (a gust stops at the first block). A positive intention on the tail during the telegraph shortens the gust to target 1 s (proposal).

**3. Leap and land (a lob of the whole body, with [knockback](../abilities/KNOCKBACK.md)).**
- *Telegraph (0.9 s):* the horse crouches and paws the ground; a warm landing mark target 3 blocks wide is drawn near the player, never on them.
- *Act:* the horse makes a great leap and lands on the mark. The landing sends a ring target 0.8 blocks high that pushes target 2 blocks. Then it recovers there for 2.5 s, close to the player, and leaps back to a Paddock.
- *Answer:* move off the mark and jump the ring, or stand behind a block. A positive intention on the crouching body during the telegraph makes it land softly: no ring. The landing is also a gift: it brings the horse close.

**4. Whinny wave ([fading platforms](../abilities/FADING-PLATFORMS.md)).**
- *Telegraph (0.9 s for each segment):* a rising whinny; the platform segments ahead of the player start to flicker one after another, every target 0.4 s, each one with its own full warning.
- *Act:* the segments fade in the same order, target 5 of them, and each reforms target 3 s after it went.
- *Answer:* stand still on a fixed segment, on the ground or on a player block, build ahead, or let an ally hold a segment. A positive intention holds one flickering segment for target 2 s. The wave never fades the segment the player is on and the one behind it at the same time.

### B4. The stitch

- **Count:** target 48 stitches.
- **What counts:** a positive intention that touches the horse's body or head in any state. While Gentled, each stitch counts as two.
- **Progress (target):** each stitch leaves one short gold stitch mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the horse's wide eyes soften and its ears turn forward. The sign is a target until the owner confirms it.
- **Allies:** an ally that reaches the horse's Paddock grazes beside the deity, which makes it Gentled for 3 s every target 10 s. Allies do not stitch by themselves on this floor; they bring calm.
- **When stitched:** as proposed in section 6 of this document (it stops leaping away, and the wind stops). Which of the three outcomes it takes is open.

### B5. Minions

- **How many:** at most target 5 on the floor, a herd, allies included. At most target 3 hostile.
- **Spawn:** from the paddock gate on the ground at the edge of the meadow. Hoofbeats rise and dust lifts for target 1.5 s, and a horse trots out. One every target 15 s while fewer than 3 are hostile.
- **Movement (the horse's own):**
  - gallops in a wide loop across the meadow and the platforms at target 6 blocks a second;
  - comes back toward the player at speed, then turns away at target 3 blocks, passing by;
  - grazes for target 3 s once each loop, standing still;
  - at a gallop it crosses gaps of up to 3 blocks and runs over fading segments without falling.
- **Behaviour rules:**
  1. A horse that passes the player on its loop does not touch them: the turn is its rule.
  2. Kick: a minion the deity sends (B2), or a minion with the player behind it within 2 blocks, turns its back to the player, gathers its hind legs and lifts its tail (telegraph target 0.9 s), then kicks: a push of target 2.5 blocks along the shown arc. A sent minion kicks once and returns to its loop.
  3. Startle: a block placed within 3 blocks, or a jump that lands within 3 blocks, makes it bolt a full loop away. A startled horse never kicks.
  4. It never bolts off the floor, and it returns to the herd when the deity rallies.
  5. It never stops on a segment the player needs; it grazes only on fixed segments or on the ground.
- **A positive intention:** each hit makes it slow and turn an ear. After target 4 hits it turns ally. The best moment is its graze, or the gathered legs before a kick.
- **A negative intention:** goes out with a puff against its coat. Nothing changes.
- **What an ally does:**
  - *Hold:* it stands under a fading segment; the segment it stands on does not fade.
  - *Carry:* when it stands with its head lowered, the player can walk onto its back; it runs target 8 blocks forward and stops, once every target 10 s. Standing on its back uses the player's walk and jump only.
  - *Clear:* it runs at a sent minion and turns it away before it kicks.
  - *Help:* it reaches the horse's Paddock and grazes beside the deity (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the gate is removed and the horse sends no one; calm alone gentles the horse.

### B6. Platforming layout (rules)

- **Size:** target 60 blocks across (radius 30), the widest floor, and the lowest: ground-based, with the Paddocks no higher than target 12 blocks.
- **The meadow:** open ground with grass, the floor the horse and the player run on. A fall from any platform lands on the meadow and does not hurt.
- **The Paddocks:** target 6 raised, fenced platforms (B2), each reached from the meadow by a run of platform segments.
- **The runs:** chains of segments target 3 blocks long and 2 wide, rising 1 block every two segments, with gaps of 1 to 2 blocks between segments. Every gap is a jump. They join the meadow to the Paddocks and the Paddocks to each other.
- **Fixed segments:** every fourth segment is fixed and carries a hitching post. Fixed segments never fade. They are the safe places to stand still, with the meadow itself.
- **The rhythm:** from the second stage on, the floor itself fades one segment of each run every target 12 s, with the full warning, besides the horse's attacks.
- **Straight up:** a central mast with one-block rungs, staggered every 1 block of height from the meadow to the floor's way up, joined to the nearest Paddock by a fixed spoke. Gusts cross the mast; the rungs never fade. A tower of player blocks is not needed to go up, and a tower raised to the horse's height beside a Paddock is knocked down (B2).
- **Nests:** target 4, on fixed segments, each with 3 cubes.

**Example route.** Walk across the meadow, never running at the herd, and turn a grazing horse into an ally. Ride it across the long open run to the nearest Paddock. When the whinny starts, stop on a hitching-post segment and let the wave pass. When the horse sends a minion, stand with a placed block behind you so its kick stops, and turn the minion with positive shots while its legs are gathered. Near the horse's Paddock, stand still until it comes, and stitch it while it is Gentled. When it leaps to land near you, move off the mark, jump the ring and stitch it during its recovery.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Fading platforms](../abilities/FADING-PLATFORMS.md) | Grey edges, flicker, speeding tick, 0.9 s per segment | Move on, stand on a fixed segment or the ground, build ahead, positive shot holds it, an ally |
| [Wind](../abilities/WIND.md) | Petals lift on the line, growing whistle, 0.9 s | Walk against it, a wall, positive shot on the tail |
| [Knockback](../abilities/KNOCKBACK.md) | Rear and dust arc; a landing mark; a sent minion's gathered hind legs, 0.9 s | Keep out of reach, block behind you, positive shot on the hooves, the crouch or the gathered legs |

### B8. Routes

- **With nothing:** the runs are all jumps and the mast is all rungs, so a player with no practices reaches every Paddock with no placed block. They win by standing still and stitching a Gentled horse, or by stitching it each time it lands near them.
- **With practices:** speed and a longer jump make the fast line across the gaps of the runs; carrying more builds walls that stop every kick; a faster shot hits a horse in mid-leap; anything that steadies the player against a push makes the wind and the kicks lose their hold.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 0.9 s | windup 0.4 to 0.9 s |
| Recovery | 2 s (2.5 s after a landing) | up to about 1 s |
| Great leap | up to 20 blocks across, 8 high | player jump about 1.26 high, about 2.7 across |
| Rest between attacks | 2.5, 2, 1.5 s by stage | a short walk, shorter each phase |
| Stitches | 48, two each while Gentled | 374 health: about 107 bad hits |
| Minions sent to kick | 1, then up to 2 from the second stage | no built equivalent |
| Hits to turn a minion | 4 | 5 good hits for a projection |
| Minions at once | 5 (3 hostile) | no built equivalent |
| Floor size | radius 30, Paddocks up to 12 high | trunk story 22 high |
| Harm | 2 points, if harm is kept | boss touch 8 |

## Open questions

1. Is the horse's floor the fastest the player must move, or is every route on it also a steady route? The realm's rule that the floor can be passed with nothing applies either way.
2. Does the wind belong to the horse or to the floor? (See [wind](../abilities/WIND.md).)
3. Is a horse minion allowed to carry the player, or is that only the ally's act?
4. Does the sky tree end here, at the fifth floor, or does the sky continue above it? This is open with the mapping of the built stories ([guardians](README.md#5-open-questions)).
5. Calm as the verb. The horse comes closer to a player who stands still for 1.5 s. Standing still is also the verb of the built silence. Is the echo wanted?
6. The floor's rhythm. From the second stage the floor fades a segment of each run every 12 s on its own. Is that the floor's, or should every fade come from the horse? (See open question 2.)
7. Gentled stitches count twice. Is that the right reward for calm, or should Gentled only make the horse easy to hit?
8. Fight length. 48 stitches is the highest count of the five. Check that the fight with a deity that leaps away stays under the length the owner wants.
9. Teleport (which deity: open). Is the horse one of the deities that teleport, on top of its great leap? A teleport would always land it far from the player.
10. When the horse is stitched, does it transform, change its attitude, or leave?
11. The floor's height. A ground-based floor with Paddocks up to 12 blocks is lower than the other four sky floors. How high the mast must rise to the floor's way up depends on the open mapping of sky floors onto the built tree.
