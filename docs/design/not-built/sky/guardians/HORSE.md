# Horse: the fifth guardian (sky floor 5)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The horse is the fifth and last deity of the sky tree's first five floors: a small, soft plush body with a giant horse head, over sky floor 5, a ground-based floor of paddocks, gusts of wind and fading platforms. It is the only deity that does not levitate: it walks on the ground and jumps a great deal.

Status: proposal, specified. Decided: the animal and the floor order, its look (a small body with a giant horse head, plush-like and cute), that it walks on the ground and does not levitate, that it jumps a great deal from platform to platform and from place to place, that it sends its minions to kick the player from its place, that it is defeated by landing many positive hits on it and never dies, and the tower rule of the [sky laws](../README.md#39-a-tower-that-reaches-a-deity-is-knocked-down). The character, the mirror, the other minion habits and the puzzle are proposals. Decided (owner, 2026-11-05): the floor's way up stays closed until the horse is defeated. The special attacks (B3b) are provisional, to confirm; the owner accepts their drain amounts for now, to adjust later (2026-11-05).

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

## 6. Defeat by many positive hits, and reward

The player defeats the horse by landing many positive hits on it ([guardians](README.md#1-the-shared-contract)). It does not die. When the hit count is reached, it transforms, changes its attitude, or leaves. It can also be turned to the player's side.

**Reward (Status: decided):**
Defeating the horse (the fifth and final god of the tree) grants an item that bestows the **Triple Jump** ability:
- Jump 1: Normal jump height (1x).
- Jump 2: Double height (2x).
- Jump 3: Eight times the normal jump height (8x).

This item is required to traverse the sixth level going up, [Totality](../../levels/TOTALITY.md), which features high-altitude long-distance platforming into space towards the Sun.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, defeat by positive hits, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A wide-eyed giant head with a streaming mane on a small plush body, standing on a paddock of a wide meadow, and leaping to another paddock far across the floor when the player rushes at it. From where it stands it whinnies, and its herd gallops out to kick the player. It comes closer when the player is still. The fastest floor of the five is won by calm: a player who stands still is the one the horse lowers its head to.

### B2. The deity

**Position.** The horse stands and walks on the ground (decided: it does not levitate). Its places are the Paddocks: target 6 raised, fenced platforms target 5 by 5, at heights from 0 to target 12 blocks, spread across the meadow at target 12 to 20 blocks from each other. The horse stands on one Paddock at a time and leaps between them.

**The great leap (decided that it jumps a great deal; the numbers are targets).** The horse jumps from platform to platform and from place to place. A leap crosses up to target 20 blocks and rises up to target 8 blocks, far beyond the player's jump of about 1.26 blocks high and about 2.7 blocks across. It always lands on a Paddock or on open ground, never on the player.

**Teleport (provisional: yes).** The horse teleports, on top of its great leap (owner, 2026-11-03, provisional). A teleport fits when it is startled: it vanishes from its Paddock and reappears on the Paddock farthest from the player, always far from them.

**The tower rule.** A tower of player blocks that brings the player to the horse's height (the shared rule in [guardians, section 6.2](README.md#62-states-every-deity-shares)) is knocked down: the horse leaps to it, kicks the stack with its hind legs until it topples, and pushes the player off, after the full warning. The horse's Paddocks are low, so the rule triggers only on a tower raised beside a Paddock.

**The way up (decided, owner, 2026-11-05).** The floor's way up, at the top of the mast, is closed until the horse is defeated: the player cannot change floor until then ([sky laws 3.5](../README.md#35-the-way-up-opens-when-the-deity-is-won), [sky architecture, section 7.1](../../../../architecture/SKY.md)).

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
| Rallying | Rears and whinnies when the positive hits reach a third and two thirds of the target; the herd circles, and the wind turns | 2 s |

**The cycle.** Grazing, Alert, Sending or Attacking in turn, Recovering, Alert. The rest before the next telegraph is target 2.5 s in the first stage, 2 s in the second and 1.5 s in the third (stages: [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits)).

**Startle and calm (the horse's own rules).**
- *Startle:* when the player comes within target 6 blocks of the horse while moving, or lands a jump within 6 blocks, it leaps away to a Paddock far from the player. The leap's telegraph is its crouch and a landing mark drawn on the far Paddock, target 0.9 s.
- *Calm:* when the player stands still on the horse's Paddock or within target 8 blocks of it for target 1.5 s, in the horse's sight, and no attack is in its telegraph, the horse walks up to target 3 blocks from them and is Gentled for 3 s. It makes no attack and sends no minion while Gentled.
- *Calm feedback (design requirement, owner, 2026-11-05; the cues provisional):* standing still must show the player that they are right, from the moment they stop. The dust round their feet settles, the horse's ears turn toward them, and the grass round their cell rises a little; when the 1.5 s are reached the horse lowers its head and blows softly. A player who moves sees the dust lift again.
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

### B3b. Special attacks

Status: provisional, to confirm. The owner did not name the special attacks; every choice below (which attacks, their kind, their phase) is a proposal, and every number is a target. The shared rules for drains and capture (telegraph lengths, spacing, `SPIRIT_MAX` 100, `CAPTURE_TIME`) are in [guardians, section 6.6](README.md#66-what-works-and-harm).

**Phases (provisional).** The horse's fight has three phases (a deity has two or three, owner, 2026-11-05; three here, provisional), the three stages of [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits), each opened by a rally: phase 1, *Skittish*, up to a third of the hit count; phase 2, *Running*, up to two thirds; phase 3, *Bolting*, to the end. An attack that enters in a phase stays in the list for the phases after it. These six are added to the four attacks of B3 and to sending the herd; the floor's platforming layout (B6) does not change. While the horse is Gentled it makes none of them, as with every attack (B2). While it gallops a Gallop line or circles in Snaking, it comes close on purpose and is not startled (B2, startle).

| # | Special attack | Phase | Kind | Telegraph (target) | Spirit (target) |
|---|---|---|---|---|---|
| 5 | Dust roll | 1 | Slows | 0.9 s | none |
| 6 | Snort | 1 | Drains spirit | 1.1 s | 14 |
| 7 | Mane shake | 2 | Moves | 0.9 s | none |
| 8 | Gallop line | 2 | Drains spirit | 1.1 s | 16 |
| 9 | Herd panic | 3 | Drains spirit | 1.1 s | 18 |
| 10 | Snaking | 3 | Captures | 1.4 s | none |

**5. Dust roll ([dense ground](../abilities/DENSE-GROUND.md)). Slows.**
- *Habit:* a horse rolls on its back in dust or mud, legs in the air, and gets up shaking.
- *Phase:* 1.
- *Telegraph (target 0.9 s):* the horse kneels and rolls on its Paddock; a patch of target radius 2 round the player's cell, on the meadow or on a fixed segment, darkens to churned earth with a soft thud of hooves.
- *Act:* the patch is dense for target 5 s: walking on it is slowed to target 50%. Jumps keep their height. A fading segment is never churned.
- *Answer:* jump out of the patch onto a run, walk off it slowly, or build over it (a player block is never churned).
- *Positive intention:* a positive intention at a churned cell smooths it back to ordinary ground at once.

**6. Snort (a cone). Drains spirit.**
- *Habit:* a startled horse blows hard through its nose, a loud snort that warns the whole herd.
- *Phase:* 1.
- *Telegraph (target 1.1 s):* the head goes up, the nostrils flare, and a pale cone of target 30 degrees, out to target 12 blocks, is drawn from the horse's nose toward the player, with a sharp breath in.
- *Act:* a white puff of breath runs along the cone. A player inside it drains target 14 spirit.
- *Answer:* step out of the cone sideways, or put a block between (a breath stops at the first block, like a gust).
- *Positive intention:* a positive intention on the nose during the telegraph turns the snort into a soft nicker: no drain.

**7. Mane shake (a ring). Moves.**
- *Habit:* a horse shakes its whole body, from the head down, to shed water, dust and flies.
- *Phase:* 2.
- *Telegraph (target 0.9 s):* the horse plants its legs; its mane starts to quiver from the ears down; a ring with a clear edge is drawn round its Paddock.
- *Act:* a ring of shaken petals and dust spreads at target 8 blocks a second out to target 8 blocks, target 0.8 blocks high, and pushes target 1.5 blocks outward. A player pushed off a segment falls to the meadow or a lower segment, unhurt.
- *Answer:* jump the edge as it passes, or stand behind a block (a block stops a ring).
- *Positive intention:* a positive intention that lands on the horse during the telegraph turns it into a toss of the head: no ring.

**8. Gallop line (a charge on the ground). Drains spirit.**
- *Habit:* a horse at full gallop leaves a cloud of dust behind it, and it does not stop for what is in its way.
- *Phase:* 2.
- *Telegraph (target 1.1 s):* the horse paws the ground twice; a dashed line target 1 block wide is drawn from its Paddock across the meadow and the runs, passing within target 3 blocks of the player and never through their cell, with a drum of hooves that rises.
- *Act:* the horse gallops along the line at target 12 blocks a second and stops at its end, on a Paddock or on open ground. It leaves a dust trail on the line that lasts target 1 s. A player who touches the horse or the trail drains target 16 spirit. It does not push.
- *Answer:* stay off the line, or jump over the trail once the horse has passed. A player block on the line stops the gallop at the block, as a charge stops ([attacks](../../../built/encounters/ATTACKS.md)): the horse recovers there for target 2.5 s, close to the player, and the trail ends at the block.
- *Positive intention:* a positive intention on the horse during the telegraph makes it trot the line instead: no dust, no drain.

**9. Herd panic (a wave). Drains spirit.**
- *Habit:* when one horse of a herd bolts, the whole herd bolts with it, without seeing what scared the first one. This is the horse's mirror: running from a feeling the moment it appears, and its answer is the floor's verb of calm: standing still.
- *Phase:* 3.
- *Telegraph (target 1.1 s):* the horse's eyes show their whites and it trembles; the meadow's grass lies flat in a wave that rolls out from it across the whole floor, and hoofbeats rise from nowhere.
- *Act:* when the telegraph ends, a player who walked, ran or jumped in the last target 0.3 s drains target 18 spirit. A player standing still is not touched. Being pushed by a gust, a kick or a ring does not count as moving. Herd panic is not chosen while a gust or a fade is under the player, nor while a sent minion is running at them.
- *Answer:* stop and stand still, wherever you are; land a jump and stay. A player in mid-jump at the start of the telegraph has time to land and stop.
- *Calm feedback (design requirement, owner, 2026-11-05; the cues provisional):* the original mechanic stays (moving drains, standing still is the answer), and stillness must show the player they are right. While the player stands still in the telegraph, the herd's ears turn toward them, the dust round their feet settles, and the flattened grass rises round their cell first, with a soft settling breath; when the telegraph ends with no drain, a calm chime. A player who moves sees the dust lift and the grass stay flat.
- *Positive intention:* a positive intention that lands on the horse during the telegraph calms it: the grass rises, no drain. Standing still to aim it is the same verb.

**10. Snaking. Captures.**
- *Habit:* a stallion herds his mares by snaking: head low, ears pinned, he swings his neck from side to side and drives them where he wants them, round and round.
- *Phase:* 3.
- *Telegraph (target 1.4 s):* the horse lowers its head, swings it from side to side and gallops a tight circle round the player, target radius 3; the circle is drawn on the ground as it runs, and it closes over the telegraph from the first hoofprint to the last. The open arc is the way out while it is still open.
- *Act:* if the player is inside the circle when it closes, the horse herds them: the player is held where they stand, captured for `CAPTURE_TIME` (target 3 s), and one practice they hold is taken ([guardians, section 6.6](README.md#66-what-works-and-harm)). Then the horse trots back to its Paddock.
- *Answer:* leave through the open arc before it closes, by a run or a jump. A player block on the circle's line stops the horse at the block, as a charge stops, and the circle stays open; it recovers there for target 2.5 s.
- *Positive intention:* a positive intention on the lowered head during the telegraph makes it lift its head and trot away: no capture. While it circles and while it holds the player, positive hits land on it as usual.

**Without minions.** None of the six needs a minion. Snaking and Herd panic are the deity's own acts, not the herd's.

### B4. Defeat by positive hits

- **Hit count:** target 48 positive hits.
- **What counts:** a positive intention that touches the horse's body or head in any state. While Gentled, each positive hit counts as two.
- **Progress (target):** each positive hit leaves one short gold mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the horse's wide eyes soften and its ears turn forward. The sign is a target until the owner confirms it.
- **Allies:** an ally that reaches the horse's Paddock grazes beside the deity, which makes it Gentled for 3 s every target 10 s. Allies do not land positive hits by themselves on this floor; they bring calm.
- **When defeated:** as proposed in section 6 of this document (it stops leaping away, and the wind stops). It changes its attitude (provisional, owner, 2026-11-03).

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

**Example route.** Walk across the meadow, never running at the herd, and turn a grazing horse into an ally. Ride it across the long open run to the nearest Paddock. When the whinny starts, stop on a hitching-post segment and let the wave pass. When the horse sends a minion, stand with a placed block behind you so its kick stops, and turn the minion with positive shots while its legs are gathered. Near the horse's Paddock, stand still until it comes, and land positive hits on it while it is Gentled. When it leaps to land near you, move off the mark, jump the ring and land positive hits on it during its recovery.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Fading platforms](../abilities/FADING-PLATFORMS.md) | Grey edges, flicker, speeding tick, 0.9 s per segment | Move on, stand on a fixed segment or the ground, build ahead, positive shot holds it, an ally |
| [Wind](../abilities/WIND.md) | Petals lift on the line, growing whistle, 0.9 s | Walk against it, a wall, positive shot on the tail |
| [Knockback](../abilities/KNOCKBACK.md) | Rear and dust arc; a landing mark; a sent minion's gathered hind legs, 0.9 s | Keep out of reach, block behind you, positive shot on the hooves, the crouch or the gathered legs |

### B8. Routes

- **With nothing:** the runs are all jumps and the mast is all rungs, so a player with no practices reaches every Paddock with no placed block. They win by standing still and landing positive hits on a Gentled horse, or by landing positive hits on it each time it comes down near them.
- **With practices:** speed and a longer jump make the fast line across the gaps of the runs; carrying more builds walls that stop every kick; a faster shot hits a horse in mid-leap; anything that steadies the player against a push makes the wind and the kicks lose their hold.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 0.9 s | windup 0.4 to 0.9 s |
| Recovery | 2 s (2.5 s after a landing) | up to about 1 s |
| Great leap | up to 20 blocks across, 8 high | player jump about 1.26 high, about 2.7 across |
| Rest between attacks | 2.5, 2, 1.5 s by stage | a short walk, shorter each phase |
| Positive hits | 48, two each while Gentled | 374 health: about 107 bad hits |
| Minions sent to kick | 1, then up to 2 from the second stage | no built equivalent |
| Hits to turn a minion | 4 | 5 good hits for a projection |
| Minions at once | 5 (3 hostile) | no built equivalent |
| Floor size | radius 30, Paddocks up to 12 high | trunk story 22 high |
| Harm | none (decided: it pushes or holds) | boss touch 8 |
| Special attacks (provisional) | 6: 3 drain spirit (14, 16, 18 of 100), 1 captures (3 s, one practice), 2 slow or move | no built equivalent |
| Special telegraphs | 0.9 s to slow or move, 1.1 s to drain, 1.4 s to capture | windup 0.4 to 0.9 s |

## Open questions

1. Is the horse's floor the fastest the player must move, or is every route on it also a steady route? The realm's rule that the floor can be passed with nothing applies either way.
2. Does the wind belong to the horse or to the floor? (See [wind](../abilities/WIND.md).)
3. Is a horse minion allowed to carry the player, or is that only the ally's act?
4. Does the sky tree end here, at the fifth floor, or does the sky continue above it? This is open with the mapping of the built stories ([guardians](README.md#5-open-questions)).
5. Calm as the verb. The horse comes closer to a player who stands still for 1.5 s. Standing still is also the verb of the built silence. Is the echo wanted?
6. The floor's rhythm. From the second stage the floor fades a segment of each run every 12 s on its own. Is that the floor's, or should every fade come from the horse? (See open question 2.)
7. Gentled positive hits count twice. Is that the right reward for calm, or should Gentled only make the horse easy to hit?
8. Fight length. 48 positive hits is the highest count of the five. Check that the fight with a deity that leaps away stays under the length the owner wants.
9. Teleport (answered, provisional: yes). The horse teleports, on top of its great leap; a teleport always lands it far from the player.
10. When the horse is defeated, does it transform, change its attitude, or leave? Provisional (owner, 2026-11-03): it changes its attitude.
11. The floor's height. A ground-based floor with Paddocks up to 12 blocks is lower than the other four sky floors. How high the mast must rise to the floor's way up depends on the open mapping of sky floors onto the built tree.
12. Special attacks (provisional, B3b). The owner accepts the drain amounts (14, 16, 18) for now, to adjust later (2026-11-05). Which drain and which capture stay provisional.
13. Herd panic. Answered (owner, 2026-11-05): keep it; moving drains and standing still is the answer, shown with the calm feedback. Still open: the exact cues (ears, settling dust, rising grass) for the art pass.
14. Snaking. Answered (owner, 2026-11-05): keep it.
15. Dust roll. Answered (owner, 2026-11-05): keep it; reusing [dense ground](../abilities/DENSE-GROUND.md) is fine.
