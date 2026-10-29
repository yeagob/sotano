# Lion: the fourth guardian (sky floor 4)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The lion is the fourth deity: a lion with a giant head on a small, soft plush body, over sky floor 4, a wide floor of ledges and gaps where a roar can freeze the player in place.

Status: proposal, specified. The animal and the floor order are decided. The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

A lion head, golden, with a mane that frames the face and a stare that does not blink. Lions live in a pride, hunt together and hold their ground. Their roar carries across the plain.

**Mirror (proposal).** The lion mirrors fear dressed as dominance: the show of strength used to hide the fear underneath, the need to be the one who decides, and the freeze that comes before a move. The practice the lion points to is courage: standing in front of the thing you fear and staying there, without the show.

The lion is proud, but its floor is not cruel. It tests whether the player can stand still under the roar and move anyway.

## 2. Floor order

Sky floor 4, the fourth of the five. The player arrives having climbed, jumped and carried water. Here the floor asks for nerve: wider gaps, higher ledges, and a roar that stops the player for a moment.

## 3. Minions

The minions are the lion itself, embodied as lions of the pride. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Lions stalk, crouch, circle and then pounce from above. A minion keeps low when it moves, circles the player at a distance, and pounces from a ledge.
- **Character.** Watchful, patient and disciplined. The pride works together: some lions hold the ledges while others close in.
- **Rules tied to the animal.** A minion pounces from a higher ledge onto the player (see [knockback](../abilities/KNOCKBACK.md)). Its roar freezes the player for a moment (see [paralysis](../abilities/PARALYSIS.md)). A roar always comes with a visible sign first: the mane lifts and the head turns.

## 4. Arena and puzzle

**The arena.** The floor is a plain of ledges at several heights, with wide gaps between them. Some ledges are wide and flat, some are narrow. There are no walls to hide behind, so the player's own blocks are the cover.

**The platforming.** Long jumps across gaps, climbs from one ledge to the next, and building a bridge across a gap that is too wide to jump. The floor is about nerve and timing.

**The puzzle (proposal).** The lion's roar freezes the player at the edge of a gap. The player must not stand on a ledge in the roar's ring when it sounds, and must build the next step before the pride closes in. A paralysed player is never left over a fatal drop without a warning (see [paralysis](../abilities/PARALYSIS.md)).

**Hindrances used (proposal).**

- [Paralysis](../abilities/PARALYSIS.md): the roar freezes the player for a short time, after a visible warning.
- [Wind](../abilities/WIND.md): gusts across the plain push the player toward the gaps, after a warning.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at a lion minion turns it into an ally (decided, see [minions](../minions/README.md)). This lion ally, proposal:

- holds a ledge the player needs to reach, so the player can climb it;
- roars at the pride, so the minions stop closing in on the player for a moment.

## 6. The stitch

The lion falls when the player hits it with enough positive intentions. The meaning of the stitch is open ([guardians](README.md#1-the-shared-contract)). The lion's fall is proposal: the pride lies down, and the ledges settle to the floor's level so the player can walk to the deity.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, block nests, telegraphs, seams, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A golden head with a mane like a sunburst, lying on the highest ledge of a wide plain. The lion's roar is big, but the plain shows it coming. The pride creeps forward when the player looks away and stops when the player looks at it. The floor rewards a player who faces what roars at them: looking at the lion makes its roar smaller.

### B2. The deity

**Position.** The lion's Sunning Ledge is the highest ledge of the plain, target 34 blocks up, flat and target 6 by 6. The lion paces along it, target 3 blocks each way at 1 block a second. Option A (levitates): the lion floats target 1 block over the ledge and drifts along the same pace. Option B (stands): it lies, sits and walks on the ledge. Both options are open.

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Basking | Lies in the sun, tail flicking | 4 s |
| Watching | The head lifts; the stare follows the player; starts when the player is within 14 blocks | until an attack, after a rest |
| Pacing | Walks the edge of its ledge between attacks | during rests |
| Attacking | One attack (B3), telegraph 1.0 s | per attack |
| Recovering | Sits and licks a paw | 2 s (2.5 s after a pounce) |
| Hurt | The mane puffs out and settles | 0.3 s |
| Rallying | Calls the pride when a seam is complete; two minions come out of the dens | 2 s |

**The cycle.** Basking, Watching, then Pacing and Attacking in turn, Recovering, Watching. The rest before the next telegraph is target 3 s in seam 1, 2.5 s in seam 2 and 2 s in seam 3.

**Facing the roar (the lion's own rule).** When the player's aim is on the lion during a roar's telegraph, the roar's ring is halved. The mirror is fear dressed as dominance; the practice is courage, and the verb of courage is the player's own aim.

### B3. Attacks

The lion has four attacks. Seam 1 uses Roar and Crosswind. Seam 2 adds Pounce. Seam 3 adds Mane flare.

**1. Roar ([paralysis](../abilities/PARALYSIS.md)).**
- *Telegraph (1.0 s):* the mane lifts, the head turns to the player, and a ring of light with a clear edge forms round the lion.
- *Act:* the ring spreads at target 8 blocks a second out to target 12 blocks (6 when the player faced it). A player inside the edge, standing on ground, freezes for target 1.5 s, with the cold grey tint on their hands. A player in the air when the edge passes is not frozen. A freeze never happens over a fall that was not shown: the ring only freezes a player on ground.
- *Answer:* step out of the edge, jump as it passes, or face the lion to halve it. A positive intention that lands on the lion during the telegraph turns the roar into a huff: no ring. A wall of player blocks 2 high between the lion and the player stops the ring there (proposal: a roar is carried in the air like a gust).

**2. Crosswind ([wind](../abilities/WIND.md)).**
- *Telegraph (1.0 s):* the tail lashes; dust and dry grass lift along a line across the ledge the player stands on, toward its nearest gap, and a whistle grows.
- *Act:* a gust for target 3 s pushes the player along the line at target 2.5 blocks a second, about half the player's walk.
- *Answer:* walk against it, or build a wall in its line (a gust stops at the first block, and the wall stays). A positive intention on the lion's tail during the telegraph shortens the gust to target 1 s (proposal).

**3. Pounce (a line, with [knockback](../abilities/KNOCKBACK.md)).**
- *Telegraph (1.0 s):* the lion crouches, haunches up; a dashed line is drawn from its ledge to the ledge the player is on.
- *Act:* the lion leaps along the line and lands on the player's ledge (in option A it glides). The landing sends a ring target 0.8 blocks high that pushes target 2 blocks. Then it recovers there for 2.5 s, beside the player, and walks back to its ledge along the same line.
- *Answer:* jump the ring, or stand behind a block. A wall of player blocks in its line stops the pounce at the wall, as the built charge stops at a block ([attacks](../../../built/encounters/ATTACKS.md)); the lion then recovers at the wall. A positive intention on the crouching body makes it land softly: no ring. The pounce is also a gift: it brings the lion close.

**4. Mane flare (bolts).**
- *Telegraph (1.0 s):* the mane fluffs out and three warm points brighten in it.
- *Act:* three sun bolts in a fan of target 30 degrees, at target 10 blocks a second. Each may take target 2 points (harm is open).
- *Answer:* step aside, or put a block between: bolts die on solid blocks ([attacks](../../../built/encounters/ATTACKS.md)). A positive intention that meets a bolt dissolves it (proposal).

### B4. The stitch

- **Count:** target 42 stitches, 14 per seam.
- **What counts:** a positive intention that touches the lion's body or head in any state. The lion has no guard; it is a moving target instead, pacing and pouncing.
- **Progress:** a seam of light runs round the plush chest under the mane; each stitch is one short gold stitch. A complete seam glows. Over the three seams the mane, wide and bristling at the start, lies softer and softer.
- **Allies:** an ally that reaches the Sunning Ledge rubs its head against the deity: the deity's next roar is skipped, and the ally adds one stitch every target 5 s while it stays. At most target 2 at once.
- **The fall:** as proposed in section 6 of this document (the pride lies down, and the ledges settle).

### B5. Minions

- **How many:** at most target 6 on the floor, allies included. At most target 4 hostile.
- **Spawn:** from two shade rocks on the plain. The grass round a rock parts and a low growl grows for target 1.5 s, and a lion walks out. One every target 14 s while fewer than 4 are hostile, and two at each rally.
- **Movement (the lion's own):**
  - keeps low and stalks: target 1 block a second while it is in the player's view (within target 60 degrees of the aim), target 3.5 blocks a second out of it;
  - circles the player at target 6 blocks when it is on the same ledge;
  - climbs a ledge of up to 2 blocks in one bound; never crosses a gap wider than 3;
  - pounces from a ledge at least 2 blocks above the player.
- **Behaviour rules:**
  1. The pride splits its work: up to target 2 minions are holders, which lie on the edges of the ledges the player needs and do not move until they pounce; the rest are stalkers, which close in.
  2. Pounce: when the player is within 5 blocks sideways and 2 or more below, the minion crouches and twitches its tail, and the arc of the leap is drawn (telegraph target 1.0 s), then it leaps. Landing on the player pushes them target 2 blocks along the shown arc.
  3. A minion's roar is small: mane lift and head turn (telegraph target 1.0 s), a ring out to target 4 blocks, a freeze of target 1 s, under the same rules as the deity's.
  4. A frozen player is never pounced on: the pride waits for the freeze to end.
  5. A stalker that the player looks at stops, sits and stares back.
- **A positive intention:** each hit makes it blink slowly and lower its head. After target 4 hits it turns ally.
- **A negative intention:** goes out with a puff against its mane. Nothing changes.
- **What an ally does:**
  - *Hold:* it lies at the edge of a ledge the player needs; its back is a one-block step the player can stand on to climb a 2-block ledge.
  - *Clear:* it roars at the pride; hostile minions within 6 blocks lie down for target 4 s.
  - *Help:* it climbs to the Sunning Ledge and adds stitches (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the dens are removed and the roar and the gaps carry the floor alone.

### B6. Platforming layout (rules)

- **Size:** target 52 blocks across (radius 26) and 36 blocks high. The widest gaps of the five floors.
- **The plain:** open ground with tall grass. No walls anywhere; the player's own blocks are the only cover.
- **Ledges:** target 12 to 16 flat-topped rocks, tops from 3 by 3 to 6 by 6, at heights from 4 to 30. Neighbouring ledges differ by 1 to 3 blocks in height.
- **Gaps:** 2 blocks (a jump), 3 blocks with a drop of at least 1 (a falling jump), or 4 to 5 blocks (a bridge of one or two placed blocks). The nerve line, the shortest route, has the most 4 to 5 block gaps. The long route winds round the plain and has only 2-block gaps and falling jumps, with 1-block steps.
- **Heights:** a 1-block step is a jump; a 2 or 3-block step needs one or two placed blocks, or an ally's back.
- **Falls:** a fall lands on a lower ledge or on the plain and does not hurt. It costs height and time.
- **Straight up:** a lone thorn tree stands beside the Sunning Ledge; its branches are one-block steps in a spiral, 1 block apart in height, from the ground to the ledge. It is inside the roar's full ring all the way up.
- **Nests:** target 6, one on the near side of each 4 to 5 block gap on the nerve line, each with 3 cubes.

**Example route.** From the plain, climb a 3-block ledge with one cube from the first nest. Face the lion when its mane lifts, so the ring stops short. Bridge the first 4-block gap with two cubes from the nest beside it, in two trips. Turn a holder into an ally and use its back to climb the next 2-block step. Build a 2-high wall between yourself and the Sunning Ledge, then let the lion pounce into it: it recovers against your wall, and you stitch it there.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Paralysis](../abilities/PARALYSIS.md) | Mane lifts, head turns, ring with a clear edge, 1.0 s | Step out, jump as it passes, face it, positive shot on the lion, a wall |
| [Wind](../abilities/WIND.md) | Tail lash, grass lifts on the line, whistle, 1.0 s | Walk against it, a wall, positive shot on the tail |
| [Knockback](../abilities/KNOCKBACK.md) (pounces) | Crouch, tail twitch, the line or arc drawn, 1.0 s | Jump the ring, a wall in the line, positive shot on the crouch |

### B8. Routes

- **With nothing:** the thorn tree reaches the Sunning Ledge with jumps alone, under the roar, and every gap on the long route is a jump or a falling jump. A player with no practices wins by facing the roars and stitching the lion when it pounces near them.
- **With practices:** a longer jump crosses 4-block gaps; carrying more builds bridges in one trip; a faster shot hits a pacing lion more often; anything that shortens a freeze or a push makes the nerve line quick.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.0 s | windup 0.4 to 0.9 s |
| Recovery | 2 s (2.5 s after a pounce) | up to about 1 s |
| Freeze | 1.5 s (minion 1 s) | no built freeze; the built Paralysis projection slows |
| Rest between attacks | 3, 2.5, 2 s by seam | a short walk, shorter each phase |
| Stitches | 42 (14 a seam) | 293 health: about 84 bad hits |
| Hits to turn a minion | 4 | 5 good hits for a projection |
| Minions at once | 6 (4 hostile) | no built equivalent |
| Widest gap | 5 blocks, bridged | flat jump about 2.7 blocks |
| Floor size | radius 26, 36 high | trunk story 22 high |

## Open questions

1. Does the roar freeze the player for a fixed time, or until they answer it with a positive intention? (Paralysis rules: [paralysis](../abilities/PARALYSIS.md).)
2. Is the wind the lion's, or the floor's? Both are proposal.
3. Does the pride's minion count as a deity's minion when the lion falls, or does the pride stay? (See [minions](../minions/README.md).)
4. Is the lion's floor the one with the widest gaps, and is the bridge the player builds the intended answer?
5. Facing the roar. The player's aim on the lion during the telegraph halves the roar. The [paralysis](../abilities/PARALYSIS.md) document proposes a steady aim during the freeze instead, but a frozen player cannot shoot. Which answer stands?
6. Walls and sound. A 2-high wall of player blocks stops the roar's ring. Is a roar stopped by blocks like a gust, or does it pass through?
7. Stalkers out of view. Minions move at 3.5 blocks a second when the player is not looking at them. Is that fair on a floor with no walls, or should a sound mark them?
8. Names. "Sunning Ledge" and "thorn tree" are working names for the deity's ledge and the vertical route; they need the owner's check under the naming rules.
9. Levitation stays open: the specification writes the deity's position as option A (levitates) and option B (stands or sits). The behaviour is the same in both.
