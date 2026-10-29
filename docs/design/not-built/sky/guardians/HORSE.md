# Horse: the fifth guardian (sky floor 5)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The horse is the fifth and last deity of the sky tree's first five floors: a horse with a giant head on a small, soft plush body, over sky floor 5, a floor of fast runs, gusts of wind and fading platforms.

Status: proposal, specified. The animal and the floor order are decided. The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

A horse head, wide-eyed, nostrils open, mane streaming. Horses are quick and sensitive. They startle at a shadow, bolt from a noise, and then come back to the herd. They are also the animal that people learn to ride: they trust a rider who stays calm.

**Mirror (proposal).** The horse mirrors bolting: the reflex of running from a feeling the moment it appears, so fast that the feeling never gets a chance to be felt. The practice the horse points to is staying with a feeling long enough to know it, and gathering the reins, which is calm rather than speed.

The horse is not a villain. Its floor is the fastest of the five, and its lesson is that speed is not the answer to a feeling.

## 2. Floor order

Sky floor 5, the last of the five. The player arrives having climbed, jumped, carried water and held their nerve. Here the floor rewards a steady pace: fast routes are there, but the player does not need speed to pass.

## 3. Minions

The minions are the horse itself, embodied as horses of the herd. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Horses gallop in loops, rear up, and bolt. A minion runs around the floor in a wide loop and comes back toward the player at speed, then turns away.
- **Character.** Quick, alert, easily startled, and loyal to the herd. A minion that is startled runs, and it returns when the herd calls it.
- **Rules tied to the animal.** A minion rears to knock the player back (see [knockback](../abilities/KNOCKBACK.md)). It runs through the floor's fading platforms and does not fall with them, which the player can see coming. It never bolts off the floor.

## 4. Arena and puzzle

**The arena.** The floor is a long, open run of platforms that fade and reform, with gusts of wind over the gaps. It is wider than any other floor and has few walls.

**The platforming.** Fast runs across platforms, jumps timed to the next platform's arrival, and climbs against the wind. The fastest routes are shortest; the slowest routes are the safest.

**The puzzle (proposal).** Platforms fade one after another, each after a warning, and a gust pushes the player toward the gap. The player builds a platform ahead of the one that fades, so the route is a chain of blocks the player keeps. The steady route is always there: the player who walks, builds and waits is not punished for not running.

**Hindrances used (proposal).**

- [Fading platforms](../abilities/FADING-PLATFORMS.md): platforms disappear, or parts of them, always after a clear warning.
- [Wind](../abilities/WIND.md): gusts push the player across the floor, always after a visible sign.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at a horse minion turns it into an ally (decided, see [minions](../minions/README.md)). This horse ally, proposal:

- runs under a fading platform and holds it up for a moment, so the player can cross;
- carries the player across a gap on its back, for a short run.

## 6. The stitch

The horse falls when the player hits it with enough positive intentions. The meaning of the stitch is open ([guardians](README.md#1-the-shared-contract)). The horse's fall is proposal: it stops running, and the floor's wind stops with it.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, block nests, telegraphs, seams, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A wide-eyed head with a streaming mane, on a ring of track high above a spiral of platforms that come and go. The horse startles and bolts when the player rushes at it, and it comes closer when the player is still. The fastest floor of the five is won by calm: a player who stands still is the one the horse lowers its head to.

### B2. The deity

**Position.** The High Paddock is a ring of track target 3 blocks wide at target 36 blocks up, round the top of the floor. The horse moves round it. Option A (levitates): the horse floats target 1 block over the track and its hooves never touch. Option B (stands): it trots and gallops on the track. Both options are open.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Grazing | Head down, tail swishing, walking slowly round the track | 3 s |
| Alert | Ears up, head high; starts when the player is within 14 blocks or on the High Paddock | 1 s |
| Attacking | One attack (B3), telegraph 0.9 s | per attack |
| Bolting | Gallops away round the track at target 7 blocks a second, faster than the player's walk of about 4.6 | 2 to 3 s |
| Recovering | Blows through its nose and shakes its mane | 2 s |
| Gentled | Walks up to a still player and lowers its head | 3 s |
| Hurt | A flinch and a soft snort; it does not bolt | 0.3 s |
| Rallying | Rears and whinnies when a seam is complete; the herd circles, and the wind turns | 2 s |

**The cycle.** Grazing, Alert, Attacking, Recovering, Alert. The rest before the next telegraph is target 2.5 s in seam 1, 2 s in seam 2 and 1.5 s in seam 3.

**Startle and calm (the horse's own rules).**
- *Startle:* when the player comes within target 6 blocks of the horse while moving, or lands a jump within 6 blocks, it bolts to the far side of the track.
- *Calm:* when the player stands still on the High Paddock for target 1.5 s, in the horse's sight, and no attack is in its telegraph, the horse walks up to target 3 blocks from them and is Gentled for 3 s. It makes no attack while Gentled.
- The mirror is bolting; the practice is staying with a feeling. The floor's verb for it is standing still.

### B3. Attacks

The horse has four attacks. Seam 1 uses Rear and stamp and Tail gust. Seam 2 adds Gallop. Seam 3 adds Whinny wave.

**1. Rear and stamp ([knockback](../abilities/KNOCKBACK.md) and [fading platforms](../abilities/FADING-PLATFORMS.md)).**
- *Telegraph (0.9 s):* the horse rears, front hooves high; dust shows the arc of the push round it, and the two platform segments nearest the player turn grey at the edges and flicker with a speeding tick.
- *Act:* the hooves land. A player within target 3 blocks is pushed target 2.5 blocks along the shown arc. The two flickering segments fade for target 3 s and reform with a chime.
- *Answer:* keep out of the 3 blocks, or stand with a block behind you; move off the flickering segments, or build ahead (player blocks never fade). A positive intention on the raised hooves turns the push into a soft one of 1 block, and one on a flickering segment holds it for target 2 s (both proposal).

**2. Tail gust ([wind](../abilities/WIND.md)).**
- *Telegraph (0.9 s):* the tail swishes; petals lift on a line across the track toward its outer edge, with a growing whistle.
- *Act:* a gust for target 3 s pushes the player along the line at target 3 blocks a second, toward the outer edge. A player pushed off the edge falls to the lap below, unhurt.
- *Answer:* walk against it, or build a wall in its line (a gust stops at the first block). A positive intention on the tail during the telegraph shortens the gust to target 1 s (proposal).

**3. Gallop (a line).**
- *Telegraph (0.9 s):* the head lowers and a hoof paws the track; a dashed line is drawn along the track toward the player.
- *Act:* the horse gallops the line at target 7 blocks a second. Contact pushes the player target 3 blocks to the side.
- *Answer:* step off the line onto the track's inner edge, or block it: a player block across the track stops the gallop, as the built charge stops at a block ([attacks](../../../built/encounters/ATTACKS.md)). The horse then stops short and recovers against the block, close to the player. A positive intention on the lowered head during the telegraph makes it hesitate target 1 s before it runs.

**4. Whinny wave ([fading platforms](../abilities/FADING-PLATFORMS.md)).**
- *Telegraph (0.9 s for each segment):* a rising whinny; the segments of the lap ahead of the player start to flicker one after another, every target 0.4 s, each one with its own full warning.
- *Act:* the segments fade in the same order, target 5 of them, and each reforms target 3 s after it went.
- *Answer:* stand still on a fixed segment or a player block, build ahead, or let an ally hold a segment. A positive intention holds one flickering segment for target 2 s. The wave never fades the segment the player is on and the one behind it at the same time.

### B4. The stitch

- **Count:** target 48 stitches, 16 per seam.
- **What counts:** a positive intention that touches the horse's body or head in any state. While Gentled, each stitch counts as two.
- **Progress:** a seam of light runs along the plush back under the mane; each stitch is one short gold stitch. A complete seam glows. Over the three seams the horse's wide eyes soften and its ears turn forward.
- **Allies:** an ally that reaches the High Paddock grazes beside the deity, which makes it Gentled for 3 s every target 10 s. Allies do not stitch by themselves on this floor; they bring calm.
- **The fall:** as proposed in section 6 of this document (it stops running, and the wind stops).

### B5. Minions

- **How many:** at most target 5 on the floor, a herd, allies included. At most target 3 hostile.
- **Spawn:** from the paddock gate on the ground at the foot of the spiral. Hoofbeats rise and dust lifts for target 1.5 s, and a horse trots out. One every target 15 s while fewer than 3 are hostile.
- **Movement (the horse's own):**
  - gallops in a wide loop along the laps at target 6 blocks a second;
  - comes back toward the player at speed, then turns away at target 3 blocks, passing by;
  - grazes for target 3 s once each loop, standing still;
  - at a gallop it crosses gaps of up to 3 blocks and runs over fading segments without falling.
- **Behaviour rules:**
  1. A horse that passes the player does not touch them: the turn is its rule.
  2. Kick: when the player is behind it within 2 blocks, it gathers its hind legs and lifts its tail (telegraph target 0.9 s), then kicks: a push of target 2.5 blocks along the shown arc.
  3. Startle: a block placed within 3 blocks, or a jump that lands within 3 blocks, makes it bolt a full loop away. A startled horse never attacks.
  4. It never bolts off the floor, and it returns to the herd when the deity rallies.
  5. It never stops on a segment the player needs; it grazes only on fixed segments.
- **A positive intention:** each hit makes it slow and turn an ear. After target 4 hits it turns ally. The best moment is its graze.
- **A negative intention:** goes out with a puff against its coat. Nothing changes.
- **What an ally does:**
  - *Hold:* it stands under a fading segment; the segment it stands on does not fade.
  - *Carry:* when it stands with its head lowered, the player can walk onto its back; it runs target 8 blocks forward along the track and stops, once every target 10 s. Standing on its back uses the player's walk and jump only.
  - *Clear:* it runs at a hostile horse's loop and turns it away.
  - *Help:* it reaches the High Paddock and grazes beside the deity (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the gate is removed; calm alone gentles the horse.

### B6. Platforming layout (rules)

- **Size:** target 60 blocks across (radius 30) and 40 blocks high, the widest floor.
- **The spiral:** two full laps of track rise from the ground to the High Paddock. The track is made of segments target 3 blocks long and 2 wide, rising 1 block every two segments, with gaps of 1 to 2 blocks between segments. Every gap is a jump.
- **Fixed segments:** every fourth segment is fixed and carries a hitching post. Fixed segments never fade. They are the safe places to stand still.
- **The rhythm:** from seam 2 on, the floor itself fades one segment of each lap every target 12 s, with the full warning, besides the horse's attacks.
- **Falls:** a fall from the track lands on the lap below, or on the ground for the first lap, and does not hurt. It costs a part of a lap.
- **Straight up:** a central mast with one-block rungs, staggered every 1 block of height from the ground to the High Paddock, joined to each half lap by a fixed spoke. Gusts cross the mast; the rungs never fade.
- **Nests:** target 4, on fixed segments, each with 3 cubes.

**Example route.** Walk the first lap, never running at the herd, and turn a grazing horse into an ally. Ride it across the long open stretch of the second lap. When the whinny starts, stop on a hitching-post segment and let the wave pass. Take a cube from the nest at the top of the spiral and carry it. On the High Paddock, stand still until the horse comes, and stitch it while it is Gentled. When it gallops, place your cube across the track: it stops against it, and you stitch it there.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Fading platforms](../abilities/FADING-PLATFORMS.md) | Grey edges, flicker, speeding tick, 0.9 s per segment | Move on, stand on a fixed segment, build ahead, positive shot holds it, an ally |
| [Wind](../abilities/WIND.md) | Petals lift on the line, growing whistle, 0.9 s | Walk against it, a wall, positive shot on the tail |
| [Knockback](../abilities/KNOCKBACK.md) | Rear and dust arc; a minion's gathered hind legs, 0.9 s | Keep out of reach, block behind you, positive shot on the hooves |

### B8. Routes

- **With nothing:** the spiral is all jumps and the mast is all rungs, so a player with no practices reaches the High Paddock with no placed block. They win by standing still and stitching a Gentled horse.
- **With practices:** speed and a longer jump make the fast line across the gaps of the spiral; carrying more builds walls that stop every gallop; a faster shot hits a bolting horse; anything that steadies the player against a push makes the wind lose its hold.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 0.9 s | windup 0.4 to 0.9 s |
| Recovery | 2 s | up to about 1 s |
| Gallop speed | 7 blocks a second | player walk about 4.6 blocks a second |
| Rest between attacks | 2.5, 2, 1.5 s by seam | a short walk, shorter each phase |
| Stitches | 48 (16 a seam), two each while Gentled | 374 health: about 107 bad hits |
| Hits to turn a minion | 4 | 5 good hits for a projection |
| Minions at once | 5 (3 hostile) | no built equivalent |
| Floor size | radius 30, 40 high | trunk story 22 high |
| Harm | 2 points, if harm is kept | boss touch 8 |

## Open questions

1. Is the horse's floor the fastest the player must move, or is every route on it also a steady route? The realm's rule that the floor can be passed with nothing applies either way.
2. Does the wind belong to the horse or to the floor? (See [wind](../abilities/WIND.md).)
3. Is a horse minion allowed to carry the player, or is that only the ally's act?
4. Does the sky tree end here, at the fifth floor, or does the sky continue above it? This is open with the mapping of the built stories ([guardians](README.md#5-open-questions)).
5. Calm as the verb. The horse comes closer to a player who stands still for 1.5 s. Standing still is also the verb of the built silence. Is the echo wanted?
6. The floor's rhythm. From the second seam the floor fades a segment of each lap every 12 s on its own. Is that the floor's, or should every fade come from the horse? (See open question 2.)
7. Gentled stitches count twice. Is that the right reward for calm, or should Gentled only make the horse easy to hit?
8. Fight length. 48 stitches is the highest count of the five. Check that the fight with a moving deity stays under the length the owner wants.
9. Levitation stays open: the specification writes the deity's position as option A (levitates) and option B (stands or sits). The behaviour is the same in both.
