# Koala: the second guardian (sky floor 2)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The koala is the second deity: a koala with a giant head on a small, soft plush body, over sky floor 2, which is built like a crown of branches. It holds the floor by holding on to its branch.

Status: proposal, specified. The animal and the floor order are decided. The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

A koala head, round-eared, sleepy-eyed, with a grip that does not let go. In the wild a koala sleeps for most of the day, in the fork of one eucalyptus tree, and it will hold that branch against almost anything.

**Mirror (proposal).** The koala mirrors clinging: holding on to a place that feels safe, even when it is too small to live in. The pattern is comfort that becomes a cage. The practice the koala points to is letting go at the right time: moving to the next branch before the old one fails.

The koala is not a fighter. It is stubborn, and its floor makes the player feel how hard it is to leave a branch.

## 2. Floor order

Sky floor 2, the second of the five. The player arrives here knowing the panda's floor: slow climbing, building up. Here the floor asks for speed and for committing to a jump.

## 3. Minions

The minions are the koala itself, embodied as smaller koalas. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Koalas climb trunks and hang from branches, claws first. A koala minion climbs any block, including the underside of a ledge, and it hangs from one to drop onto the player. It walks slowly on flat ground.
- **Character.** Sleepy until disturbed, then quick to grab. It sleeps in clusters on the branches, and it wakes when the player comes near.
- **Rules tied to the animal.** A koala minion grabs and holds the player for a moment instead of hitting them. It does not let go until it is shaken off, which is a rule the player can see coming (see [cube cage](../abilities/CUBE-CAGE.md)).

## 4. Arena and puzzle

**The arena.** The floor is a ring of branches, joined by trunks, around a central gap. Branches are blocks with leaves on top. Some are thick and fixed, and some are thin.

**The platforming.** Long jumps between branches, some of which fade under the player after a warning. The player must commit to a jump and to the block they build for the next one.

**The puzzle (proposal).** The koala holds the player's branch. Branches start to fade one by one, each after a warning. The player builds the next branch before the old one fades, so the route is a chain of blocks the player keeps. If the koala catches the player in a cage of branch cubes, the player breaks out and goes on.

**Hindrances used (proposal).**

- [Fading platforms](../abilities/FADING-PLATFORMS.md): branches let go under the player, always with a warning.
- [Cube cage](../abilities/CUBE-CAGE.md): the koala wraps the player in cubes that lock them in until they break out.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at a koala minion turns it into an ally (decided, see [minions](../minions/README.md)). This koala ally, proposal:

- hangs from a branch the player is building, so the new branch is held in place;
- grabs a minion that is about to drop on the player, and holds it still.

## 6. The stitch

The koala falls when the player hits it with enough positive intentions. The meaning of the stitch is open ([guardians](README.md#1-the-shared-contract)). The koala's fall is proposal: it lets go of its branch, and the floor's branches give way in order from the top, which shows the player the way out of the fight.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, block nests, telegraphs, seams, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A sleepy ball of grey fur that holds on. The koala floor is about letting go: branches fade, cages close, and the player who keeps moving to the next branch, or builds it, passes. The koala's one defence is to cling, and the player learns that its own minions can loosen that grip.

### B2. The deity

**Position.** The koala's Fork is a 3 by 3 crown of living wood over the central gap, at target 30 blocks, held by four thick limbs that come from the four trunks. Option A (levitates): the koala floats target 1 block over the Fork, its arms round an upright branch. Option B (clings): it sits in the Fork, its arms round the same branch. Both options are open.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Asleep | Curled, eyes shut, slow breathing | until woken |
| Stirring | Ears twitch, one eye opens; when the player comes within 12 blocks, or the first stitch lands | 1.5 s |
| Watching | The head follows the player | until an attack, after a rest |
| Attacking | One attack (B3), telegraph 1.2 s | per attack |
| Clinging (guard) | Arms and ears wrap tight round its branch, face hidden | 2.5 s |
| Recovering | Head nods, it dozes off for a moment | 2 s |
| Hurt | A small squeak and a blink | 0.3 s |
| Rallying | Hugs its branch harder when a seam is complete; the sleeping minions wake | 2 s |

**The cycle.** Asleep once at the start, then Stirring, Watching, Attacking, then Clinging (from seam 2 on; in seam 1 it goes straight to Recovering), Recovering, Watching. The rest before the next telegraph is target 3 s in seam 1, 2.5 s in seam 2 and 2 s in seam 3.

**The guard.** While Clinging, a positive intention that touches the koala bounces off softly with an ear wiggle: no stitch. A koala ally that reaches the Fork and hugs the deity ends the guard for as long as it stays (B5).

### B3. Attacks

The koala has four attacks. Seam 1 uses Let-go and Leaf drop. Seam 2 adds Hug. Seam 3 adds Sleepy sigh.

**1. Let-go ([fading platforms](../abilities/FADING-PLATFORMS.md)).**
- *Telegraph (1.2 s):* the koala taps its branch; the thin branch the player stands on, or the next one on their way, turns grey at the edges and flickers, with a tick that speeds up. The full outline still shows.
- *Act:* the branch turns to mist for target 4 s, then reforms with a soft chime.
- *Answer:* move on early, or build ahead (a player block never fades). A positive intention at the flickering branch holds it for target 2 s more (proposal). The branch behind or ahead of the player always stays solid while this one fades, so a route off is always there. A block does not stop it.

**2. Leaf drop (lobs).**
- *Telegraph (1.2 s):* the koala shakes the Fork; three warm marks appear on the branches round the player.
- *Act:* three bundles of leaves drop onto the marks. A bundle that lands on the player pushes them down target 1 block and may take target 2 points (harm is open).
- *Answer:* move off the marks. A block overhead stops a bundle: lobs die on solid blocks ([attacks](../../../built/encounters/ATTACKS.md)), so a one-block roof is a shelter. A positive intention that meets a bundle scatters it into drifting leaves (proposal).

**3. Hug ([cube cage](../abilities/CUBE-CAGE.md)).**
- *Telegraph (1.2 s):* the koala opens its arms wide. Cube outlines appear round the player's cell one by one, with a soft tick for each: four sides, then the lid. The last side to appear is the way out while it is still an outline.
- *Act:* the outlined cubes turn solid. The cage is the player's cell, 1 by 1 by 2. It dissolves after target 4 s if it is not broken.
- *Answer:* step out through the last open side before it closes. Inside, a positive intention breaks a cage cube in one hit (target; the cage document allows any shot to break it). A cage never closes over a drop that was not shown first.

**4. Sleepy sigh ([wind](../abilities/WIND.md)).**
- *Telegraph (1.2 s):* the koala breathes in, deeply; leaves lift along a line from the player toward the central gap, and a soft whistle grows.
- *Act:* a gust for target 2 s pushes the player toward the gap at target 2 blocks a second, less than half the player's walk, so walking against it holds them in place.
- *Answer:* walk against it, or stand behind a block (a gust stops at the first block). A positive intention that lands on the koala during the telegraph turns the sigh into a yawn: no gust.

### B4. The stitch

- **Count:** target 30 stitches, 10 per seam.
- **What counts:** a positive intention that touches the koala's body or head in any state but Clinging.
- **Progress:** a seam of light runs round the plush belly; each stitch is one short gold stitch. A complete seam glows. Over the three seams the koala's grip on its branch loosens: one arm, then the other, then only its claws.
- **Allies:** an ally hugging the deity in the Fork adds one stitch every target 4 s and keeps the guard off. At most target 2 allies hug it at once.
- **The fall:** as proposed in section 6 of this document (it lets go of its branch, and the branches give way in order from the top). Whether the branches are released or held is still an open question.

### B5. Minions

- **How many:** at most target 6 on the floor, allies included.
- **Spawn:** the floor begins with three clusters of two sleeping koalas on thick branches. When a koala turns ally and leaves its cluster, a new sleeping koala appears there after target 20 s, while the floor holds fewer than 6. A new koala appears with a soft rustle of leaves and a curled shape that grows for target 1.5 s.
- **Movement (the koala's own):**
  - walks slowly on flat branches, target 1.2 blocks a second;
  - climbs any block face, including the underside of a branch, at target 2 blocks a second;
  - hangs from the underside of a branch, claws first;
  - drops onto the player from a branch above.
- **Behaviour rules:**
  1. It sleeps until the player comes within target 4 blocks, then wakes with a stretch (target 1 s).
  2. A waking koala climbs to the underside of the nearest branch above the player's path and hangs there.
  3. Drop: when the player passes under it within 1 block sideways, it lets go with one arm and swings (telegraph target 1.2 s, with a squeak), then drops.
  4. Hold: a koala that lands on or touches the player hugs them. While hugged the player walks at target 40% and jumps at half height for target 2 s, or until shaken off: three jumps shake it off, or one positive intention at it. It never holds the player over a drop that was not shown.
  5. It never walks on the ground and never crosses a gap: it climbs round through the trunks.
  6. It goes back to sleep where it is after target 10 s without the player within 6 blocks.
- **A positive intention:** each hit makes it blink and loosen its grip. After target 3 hits it turns ally.
- **A negative intention:** goes out with a puff against its fur. Nothing changes.
- **What an ally does:**
  - *Hold:* it hangs under the thin branch ahead of the player; a branch held by an ally does not fade.
  - *Clear:* it grabs a hostile koala that is about to drop, and both curl up asleep for target 6 s.
  - *Help:* it climbs to the Fork and hugs the deity, which ends the guard and adds stitches (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the clusters are removed and the guard is dropped (nothing could lift it).

### B6. Platforming layout (rules)

- **Size:** target 44 blocks across (radius 22) and 32 blocks high.
- **Trunks:** four 2 by 2 trunks of living wood at north, east, south and west, target 14 blocks from the centre, rising from the ground to the Fork's limbs at 28.
- **The branch spiral:** thin branches, 1 block wide and 4 to 6 long, run from trunk to trunk. Each branch is 2 blocks higher than the one before, so the player climbs one placed block or a trunk knot at each end.
- **Gaps:** between branch ends, 2 blocks on the same level (a jump), or 3 blocks with a drop of 1 (a jump that falls). Never more than 3 without a thick branch before it.
- **Thick branches:** every third branch is 2 wide and fixed, with leaves on top. They are the rest landings and they carry the sleeping clusters and the nests.
- **Thin branches** fade (B3, Let-go). Thick branches and trunks never fade.
- **The central gap:** radius target 8, open down to a soft moss floor on the ground. A fall lands there and does not hurt; the player climbs again from a trunk.
- **Straight up:** each trunk has knots, one-block ledges on its outer face, staggered every 1 block of height from the ground to the Fork's limbs. A trunk is the vertical route. The sleeping koalas hang near the knots, so the straight route passes them.
- **The Fork:** reached by walking in along one of the four thick limbs at 28, then one step up.
- **Nests:** target 4, one on each thick branch of the lower half, each with 3 cubes.

**Example route.** Start at the south trunk. Take the spiral east: jump the first two gaps, then take a cube from the nest on the first thick branch and carry it. When Let-go flickers under you, run on; place the cube to bridge the 3-block gap to the east trunk. Turn a cluster of koalas into allies from the thick branch (3 hits each). Climb the east trunk's knots to 28, walk in on the limb, and stitch the koala during its recovery while your allies hug it.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Fading platforms](../abilities/FADING-PLATFORMS.md) | Grey edges, flicker, speeding tick, 1.2 s | Move on, build ahead, positive shot holds it |
| [Cube cage](../abilities/CUBE-CAGE.md) | Cube outlines one by one with ticks, 1.2 s | Step out the last side, positive shot breaks a cube |
| [Wind](../abilities/WIND.md) | Leaves lift on a line, soft whistle, 1.2 s | Walk against it, a block, positive shot on the koala |

### B8. Routes

- **With nothing:** the trunk knots and the spiral's jumps reach the Fork without a single placed block; the nests only shorten it. A player with no practices wins by stitching from the limbs and by sending allies to break the guard.
- **With practices:** a higher or longer jump crosses the 3-block gaps flat; carrying more blocks builds a straight bridge across the central gap; a stronger shot breaks a cage cube from outside; a longer range stitches the koala from the thick branches below the Fork.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.2 s | windup 0.4 to 0.9 s |
| Recovery | 2 s | up to about 1 s |
| Guard (Clinging) | 2.5 s, from seam 2 | no built equivalent |
| Rest between attacks | 3, 2.5, 2 s by seam | a short walk, shorter each phase |
| Stitches | 30 (10 a seam) | 179 health: about 51 bad hits |
| Hits to turn a minion | 3 | 5 good hits for a projection |
| Minions at once | 6 | no built equivalent |
| Floor size | radius 22, 32 high | trunk story 22 high |
| Harm of a lob | 2 points, if harm is kept | boss touch 8 |

## Open questions

1. Does the koala's cage stop the player, or only slow them? Breaking out is allowed (the realm's law 3.1), but is the cage a timed hold or a break-out?
2. Which hindrance the koala uses is proposal. Is the fading branch the koala's, or the floor's?
3. Are the koala's branches the built world's blocks or player-made blocks? (The realm's law 3.1 and 3.2 decide the answer for each case.)
4. Does the koala's fall release the branches, or does it hold them until the player is done?
5. The clinging guard. From the second seam the koala cannot be stitched for 2.5 s after each attack unless an ally hugs it. Is a guard that only allies lift right for the second floor?
6. The minion's hug. A koala minion's hug slows the player and is shaken off by three jumps or one positive shot. Is it the same hindrance as the cube cage, or a hold of its own?
7. Sleepy sigh uses [wind](../abilities/WIND.md), which the abilities folder proposes for the lion and the horse, not the koala. Keep it, or replace it?
8. The Fork and its limbs are original wood. Can the player break a limb (it regrows in 5 s), and should a broken limb drop the koala's allies?
9. Levitation stays open: the specification writes the deity's position as option A (levitates) and option B (stands or sits). The behaviour is the same in both.
