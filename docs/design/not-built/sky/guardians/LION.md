# Lion: the fourth guardian (sky floor 4)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The lion is the fourth deity: a lion with a giant head on a small, soft plush body, over sky floor 4, a wide floor of ledges and gaps where a roar can freeze the player in place.

Status: proposal, specified. Decided: the animal and the floor order, that the lion levitates, that it is defeated by landing many positive hits on it and never dies, and the tower rule of the [sky laws](../README.md#39-a-tower-that-reaches-a-deity-is-knocked-down). The character, the mirror, the minions and the puzzle are proposals. Decided (owner, 2026-11-05): the floor's way up stays closed until the lion is defeated. The special attacks (B3b) are provisional, to confirm; the owner accepts their drain amounts for now, to adjust later (2026-11-05). The player may build roofs and walls on this floor (owner, 2026-11-05).

**Build status.** Built: the deity, its ten attacks, the Stare-down and the pride; what the player meets is in [built LION](../../../built/sky/guardians/LION.md). Not built: the ledges settling when the lion is won, the rally's two minions (no floor spawns minions yet), a wall stopping the roar's ring, an ally's back as a step, and the tower knock's glide. The model is pending the owner's art review ([lion art](../../../../art/sky/lion.md)).

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

## 6. Defeat by many positive hits

The player defeats the lion by landing many positive hits on it ([guardians](README.md#1-the-shared-contract)). It does not die. When the hit count is reached, it transforms, changes its attitude, or leaves; which one is open. It can also be turned to the player's side. Proposal: it changes its attitude: the pride lies down, and the ledges settle to the floor's level so the player can walk to the deity.

## Behaviour specification

Status: proposal, specified. Every number is a target, not a fact of the code. Terms shared by all five guardians (the player's reach, the shared states, the tower rule, block nests, telegraphs, defeat by positive hits, harm) are in [guardians, section 6](README.md#6-shared-terms-of-the-behaviour-specifications).

### B1. The player's read

A golden head with a mane like a sunburst, floating over the highest ledge of a wide plain. The lion's roar is big, but the plain shows it coming. The pride creeps forward when the player looks away and stops when the player looks at it. The floor rewards a player who faces what roars at them: looking at the lion makes its roar smaller.

### B2. The deity

**Position.** The lion's Sunning Ledge is the highest ledge of the plain, target 34 blocks up, flat and target 6 by 6. The lion levitates (decided): it floats target 1 block over the ledge and paces along it in the air, target 3 blocks each way at 1 block a second.

**Teleport (provisional: no).** The lion does not teleport; the koala and the horse do (owner, 2026-11-03, provisional).

**The tower rule.** A tower of player blocks that brings the player to the lion's height (the shared rule in [guardians, section 6.2](README.md#62-states-every-deity-shares)) is knocked down: the lion glides to it, strikes the stack with a paw until it topples, and pushes the player off, after the full warning. The 2-high walls of the example route are not towers; the thorn tree is the floor's own way up.

**The way up (decided, owner, 2026-11-05).** The floor's way up, over the thorn tree, is closed until the lion is defeated: the player cannot change floor until then ([sky laws 3.5](../README.md#35-the-way-up-opens-when-the-deity-is-won), [sky architecture, section 7.1](../../../../architecture/SKY.md)).

**States and timings (targets).**

| State | What the player sees | Length |
|---|---|---|
| Basking | Floats curled in the sun, tail flicking | 4 s |
| Watching | The head lifts; the stare follows the player; starts when the player is within 14 blocks | until an attack, after a rest |
| Pacing | Paces in the air along the edge of its ledge between attacks | during rests |
| Attacking | One attack (B3), telegraph 1.0 s | per attack |
| Recovering | Hangs still in the air and licks a paw | 2 s (2.5 s after a pounce) |
| Hurt | The mane puffs out and settles | 0.3 s |
| Rallying | Calls the pride when the positive hits reach a third and two thirds of the target; two minions come out of the dens | 2 s |

**The cycle.** Basking, Watching, then Pacing and Attacking in turn, Recovering, Watching. The rest before the next telegraph is target 3 s in the first stage, 2.5 s in the second and 2 s in the third (stages: [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits)).

**Facing the roar (the lion's own rule).** When the player's aim is on the lion during a roar's telegraph, the roar's ring is halved. The mirror is fear dressed as dominance; the practice is courage, and the verb of courage is the player's own aim.

### B3. Attacks

The lion has four attacks. The first stage uses Roar and Crosswind. The second adds Pounce. The third adds Mane flare.

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
- *Act:* the lion glides along the line and lands over the player's ledge. The landing sends a ring target 0.8 blocks high that pushes target 2 blocks. Then it recovers there for 2.5 s, beside the player, and glides back to its ledge along the same line.
- *Answer:* jump the ring, or stand behind a block. A wall of player blocks in its line stops the pounce at the wall, as the built charge stops at a block ([attacks](../../../built/encounters/ATTACKS.md)); the lion then recovers at the wall. A positive intention on the crouching body makes it land softly: no ring. The pounce is also a gift: it brings the lion close.

**4. Mane flare (bolts).**
- *Telegraph (1.0 s):* the mane fluffs out and three warm points brighten in it.
- *Act:* three sun bolts in a fan of target 30 degrees, at target 10 blocks a second. Each one that reaches the player only pushes them, with no damage (decided, owner, 2026-11-03).
- *Answer:* step aside, or put a block between: bolts stop at solid blocks ([attacks](../../../built/encounters/ATTACKS.md)). A positive intention that meets a bolt dissolves it (proposal).

### B3b. Special attacks

Status: provisional, to confirm. The owner did not name the special attacks; every choice below (which attacks, their kind, their phase) is a proposal, and every number is a target. The shared rules for drains and capture (telegraph lengths, spacing, `SPIRIT_MAX` 100, `CAPTURE_TIME`) are in [guardians, section 6.6](README.md#66-what-works-and-harm).

**Phases (provisional).** The lion's fight has three phases (a deity has two or three, owner, 2026-11-05; three here, provisional), the three stages of [guardians, section 6.5](README.md#65-defeat-by-many-positive-hits), each opened by a rally: phase 1, *Display*, up to a third of the hit count; phase 2, *Hunt*, up to two thirds; phase 3, *Pride*, to the end. An attack that enters in a phase stays in the list for the phases after it. These six are added to the four attacks of B3; the floor's platforming layout (B6) does not change.

| # | Special attack | Phase | Kind | Telegraph (target) | Spirit (target) |
|---|---|---|---|---|---|
| 5 | Long grass | 1 | Slows | 1.0 s | none |
| 6 | Stare-down | 1 | Drains spirit (a timer: 5 s of looking away) | the last 1.2 s of the stare's build | 12 |
| 7 | Scrape | 2 | Moves (takes footing) | 1.0 s | none |
| 8 | Dusk call | 2 | Drains spirit | 1.2 s | 14 |
| 9 | Noon sun | 3 | Drains spirit | 1.2 s | 16 |
| 10 | Scruff hold | 3 | Captures | 1.5 s | none |

**5. Long grass ([dense ground](../abilities/DENSE-GROUND.md)). Slows.**
- *Habit:* a lion stalks low through tall grass, unseen, before the rush.
- *Phase:* 1.
- *Telegraph (target 1.0 s):* the lion sinks low in the air and its tail tip twitches; the grass round the player's cell, target radius 3, grows tall and thick and sways against the wind, with a dry rustle.
- *Act:* the cells under the tall grass are dense for target 5 s: walking on them is slowed to target 50%. Jumps keep their height. On a ledge top the grass grows only on the ledge, never past its edge.
- *Answer:* jump out of it, step up onto a higher ledge, or build over it (a player block grows no grass).
- *Positive intention:* a positive intention at a grassy cell lays the grass flat: ordinary ground at once.

**6. Stare-down (a gaze that builds). Drains spirit.**
- *Habit:* two lions hold each other's stare before a fight, and the one that looks away first gives way. This is the lion's mirror, fear dressed as dominance, and its answer is the floor's verb of courage: the player's own aim.
- *Phase:* 1.
- *Rule (redesigned by the owner, 2026-11-05; provisional, every number a target):* if the player stays a while looking away from the lion, it punishes them, but not at once. Stare-down is not chosen from the attack list: from phase 1 on it runs on its own while the lion is Watching and the player is in its line of sight.
  - *Looking at the lion* means the lion is within target 30 degrees of the centre of the player's view. Anything else, in its line of sight, is looking away.
  - *The stare timer:* while the player looks away, the stare builds over target 5 s (the owner's range: 4 to 6 s). A glance away shorter than that costs nothing: looking back at the lion lets the stare fall back to zero over target 1 s. Breaking the line of sight (behind a block, a ledge or the thorn tree's trunk) holds the stare where it is; it neither builds nor falls.
  - *The warning (visible from the first moment):* as the stare builds, two thin gold lines run from the lion's eyes toward the player and thicken, its mane brightens and lifts, and a low growl rises. For the last target 1.2 s (the drain telegraph of [guardians, section 6.6](README.md#66-what-works-and-harm)) the eyes flare and the lines tighten, so the drain always has its full telegraph.
  - *Act:* when the stare is full, the player drains target 12 spirit and the stare falls back to zero. The shared spacing holds: two drains at least 6 s apart, none while the player is held (frozen by a roar, captured) or within 1 s after; the stare does not build while the player is held.
- *Answer:* look back at the lion before the stare is full; or break the line of sight.
- *Calm feedback (design requirement):* the moment the player looks back, the gold lines slacken and fade, the mane settles and the growl drops to a purr, so the player sees they are right.
- *Positive intention:* a positive intention that lands on the lion while the stare builds makes it blink and look away: the stare falls to zero at once. Facing the lion is also the moment to land it.

**7. Scrape ([fading platforms](../abilities/FADING-PLATFORMS.md)). Moves (takes footing).**
- *Habit:* a lion scrapes the ground with its hind feet and marks the scrape, to say where its land begins.
- *Phase:* 2.
- *Telegraph (target 1.0 s):* the lion rakes the air with its hind paws; claw lines are drawn across the player's ledge, and the strip of it on the lion's side, target 2 cells deep, turns grey at the edges and flickers, with a speeding tick.
- *Act:* the strip turns to mist for target 3 s, then reforms with a chime. The far side of the ledge always stays solid, at least target 2 by 2 cells. On a ledge too small to leave that much, Scrape is not chosen.
- *Answer:* step to the far side, jump to another ledge, or build ahead (a player block never fades).
- *Positive intention:* a positive intention at a flickering cell holds it for target 2 s more (proposal, as for every fading platform).

**8. Dusk call (three rings). Drains spirit.**
- *Habit:* lions roar at dusk and at dawn to call the pride together and to tell other prides whose land this is; the pride answers in chorus, and the roar carries for kilometres.
- *Phase:* 2.
- *Telegraph (target 1.2 s):* the lion fills its chest and its mane glows; three rings with clear edges form, one round the Sunning Ledge and one round each shade rock, with a deep breath that grows.
- *Act:* the three rings spread at target 8 blocks a second out to target 12 blocks (6 when the player faced the lion, the facing rule of B2), each target 0.8 blocks high. A player that any ring touches drains target 14 spirit, once per call, however many rings touch them. The rings do not freeze and do not push.
- *Answer:* jump each edge as it passes, stand behind a player block (a block stops a ring), or face the lion to shrink the rings.
- *Positive intention:* a positive intention that lands on the lion during the telegraph keeps the call to the Sunning Ledge's ring only.

**9. Noon sun. Drains spirit.**
- *Habit:* lions rest in the shade for most of the hot hours of the day, up to twenty hours of rest in a day.
- *Phase:* 3.
- *Telegraph (target 1.2 s):* the lion yawns and lies down in the air; the light on the player's ledge turns white-gold and shimmers, and every cell in shade, under a block or a higher ledge, is drawn dark and cool. A rising hum of heat.
- *Act:* a player still in the sun on that ledge when the telegraph ends drains target 16 spirit. Shade is any cell with a solid block anywhere above it within target 3 blocks.
- *Answer:* stand in shade: under a block placed overhead (one cube is enough), under a higher ledge, or drop off the ledge to the plain or a lower ledge (falls do not hurt). Noon sun is chosen only when a drop, a shaded cell or a neighbouring ledge within a jump is open to the player.
- *Positive intention:* a positive intention that lands on the lion during the telegraph makes it close its eyes: the glare fades, no drain.

**10. Scruff hold. Captures.**
- *Habit:* a lioness carries her cubs gently by the scruff of the neck; a cub held so goes still.
- *Phase:* 3.
- *Telegraph (target 1.5 s):* the lion crouches in the air, haunches up, and its mouth opens softly; a dashed line is drawn from it to the player, and a ring of target radius 2 is drawn round the player's cell and shrinks to the cell over the telegraph, with a low purr.
- *Act:* the lion glides along the line. If the player is inside the ring when it closes, the lion takes them by the scruff and holds them where they stand: the player is captured for `CAPTURE_TIME` (target 3 s) and one practice they hold is taken ([guardians, section 6.6](README.md#66-what-works-and-harm)). Then it recovers there for target 2.5 s, as after a pounce, and glides back.
- *Answer:* leave the ring before it closes; any run or jump of 2 blocks is enough. A wall of player blocks in its line stops the glide at the wall, as the pounce stops ([attacks](../../../built/encounters/ATTACKS.md)), and the lion recovers against the wall.
- *Positive intention:* a positive intention on the crouching body during the telegraph makes it sit and lick a paw: no capture. The lion has no guard, so while it glides in and holds the player, positive hits land on it as usual.

**Without minions.** None of the six needs a minion.

### B4. Defeat by positive hits

- **Hit count:** target 42 positive hits.
- **What counts:** a positive intention that touches the lion's body or head in any state. The lion has no guard; it is a moving target instead, pacing and pouncing.
- **Progress (target):** each positive hit leaves one short gold mark of light on the plush body where it lands, and the marks gather until the body is covered. As they gather, the mane, wide and bristling at the start, lies softer and softer. The sign is a target until the owner confirms it.
- **Allies:** an ally that reaches the Sunning Ledge rubs its head against the deity: the deity's next roar is skipped, and the ally adds one positive hit every target 5 s while it stays. At most target 2 at once.
- **When defeated:** as proposed in section 6 of this document (the pride lies down, and the ledges settle). It changes its attitude (provisional, owner, 2026-11-03).

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
  - *Help:* it climbs to the Sunning Ledge and adds positive hits (B4).
- **Without minions:** if the owner makes this a platforming-only floor, the dens are removed and the roar and the gaps carry the floor alone.

### B6. Platforming layout (rules)

- **Size:** target 52 blocks across (radius 26) and 36 blocks high. The widest gaps of the five floors.
- **The plain:** open ground with tall grass. No walls of the floor's own; the player's own blocks are the only cover. The player may build roofs and walls here (owner, 2026-11-05): a roof is the answer to Noon sun, and a wall stops a roar, a gust or a pounce.
- **Ledges:** target 12 to 16 flat-topped rocks, tops from 3 by 3 to 6 by 6, at heights from 4 to 30. Neighbouring ledges differ by 1 to 3 blocks in height.
- **Gaps:** 2 blocks (a jump), 3 blocks with a drop of at least 1 (a falling jump), or 4 to 5 blocks (a bridge of one or two placed blocks). The nerve line, the shortest route, has the most 4 to 5 block gaps. The long route winds round the plain and has only 2-block gaps and falling jumps, with 1-block steps.
- **Heights:** a 1-block step is a jump; a 2 or 3-block step needs one or two placed blocks, or an ally's back.
- **Falls:** a fall lands on a lower ledge or on the plain and does not hurt. It costs height and time.
- **Straight up:** a lone thorn tree stands beside the Sunning Ledge; its branches are one-block steps in a spiral, 1 block apart in height, from the ground to the ledge. It is inside the roar's full ring all the way up.
- **Nests:** target 6, one on the near side of each 4 to 5 block gap on the nerve line, each with 3 cubes.

**Example route.** From the plain, climb a 3-block ledge with one cube from the first nest. Face the lion when its mane lifts, so the ring stops short. Bridge the first 4-block gap with two cubes from the nest beside it, in two trips. Turn a holder into an ally and use its back to climb the next 2-block step. Build a 2-high wall between yourself and the Sunning Ledge, then let the lion pounce into it: it recovers against your wall, and you land positive hits on it there.

### B7. Hindrances used

| Hindrance | Telegraph | Answer |
|---|---|---|
| [Paralysis](../abilities/PARALYSIS.md) | Mane lifts, head turns, ring with a clear edge, 1.0 s | Step out, jump as it passes, face it, positive shot on the lion, a wall |
| [Wind](../abilities/WIND.md) | Tail lash, grass lifts on the line, whistle, 1.0 s | Walk against it, a wall, positive shot on the tail |
| [Knockback](../abilities/KNOCKBACK.md) (pounces) | Crouch, tail twitch, the line or arc drawn, 1.0 s | Jump the ring, a wall in the line, positive shot on the crouch |

### B8. Routes

- **With nothing:** the thorn tree reaches the Sunning Ledge with jumps alone, under the roar, and every gap on the long route is a jump or a falling jump. A player with no practices wins by facing the roars and landing positive hits on the lion when it pounces near them.
- **With practices:** a longer jump crosses 4-block gaps; carrying more builds bridges in one trip; a faster shot hits a pacing lion more often; anything that shortens a freeze or a push makes the nerve line quick.

### B9. Targets at a glance

Every value in the middle column is a target. The right column is the built game's value for comparison, from [fight flow](../../../built/bosses/FIGHT-FLOW.md), [attacks](../../../built/encounters/ATTACKS.md), [polarity](../../../built/encounters/POLARITY.md) and [player movement](../../../built/player/MOVEMENT.md).

| Value | Target | Built, for comparison |
|---|---|---|
| Telegraph | 1.0 s | windup 0.4 to 0.9 s |
| Recovery | 2 s (2.5 s after a pounce) | up to about 1 s |
| Freeze | 1.5 s (minion 1 s) | no built freeze; the built Paralysis projection slows |
| Rest between attacks | 3, 2.5, 2 s by stage | a short walk, shorter each phase |
| Positive hits | 42 | 293 health: about 84 bad hits |
| Hits to turn a minion | 4 | 5 good hits for a projection |
| Minions at once | 6 (4 hostile) | no built equivalent |
| Widest gap | 5 blocks, bridged | flat jump about 2.7 blocks |
| Floor size | radius 26, 36 high | trunk story 22 high |
| Special attacks (provisional) | 6: 3 drain spirit (12, 14, 16 of 100), 1 captures (3 s, one practice), 2 slow or move | no built equivalent |
| Special telegraphs | 1.0 s to slow or move, 1.2 s to drain, 1.5 s to capture | windup 0.4 to 0.9 s |
| Stare-down timer (provisional) | 5 s of looking away (owner's range 4 to 6 s); falls back over 1 s when the player looks back; looking at the lion within 30 degrees of the view's centre | no built equivalent |

## Open questions

1. Does the roar freeze the player for a fixed time, or until they answer it with a positive intention? (Paralysis rules: [paralysis](../abilities/PARALYSIS.md).)
2. Is the wind the lion's, or the floor's? Both are proposal.
3. Does the pride's minion count as a deity's minion when the lion is defeated, or does the pride stay? (See [minions](../minions/README.md).)
4. Is the lion's floor the one with the widest gaps, and is the bridge the player builds the intended answer?
5. Facing the roar. The player's aim on the lion during the telegraph halves the roar. The [paralysis](../abilities/PARALYSIS.md) document proposes a steady aim during the freeze instead, but a frozen player cannot shoot. Which answer stands?
6. Walls and sound. A 2-high wall of player blocks stops the roar's ring. Is a roar stopped by blocks like a gust, or does it pass through?
7. Stalkers out of view. Minions move at 3.5 blocks a second when the player is not looking at them. Is that fair on a floor with no walls, or should a sound mark them?
8. Names. "Sunning Ledge" and "thorn tree" are working names for the deity's ledge and the vertical route; they need the owner's check under the naming rules.
9. Teleport (answered, provisional: no). The lion does not teleport.
10. When the lion is defeated, does it transform, change its attitude, or leave? Provisional (owner, 2026-11-03): it changes its attitude.
11. Special attacks (provisional, B3b). The owner accepts the drain amounts (12, 14, 16) for now, to adjust later (2026-11-05). Which drain and which capture stay provisional.
12. Stare-down. Redesigned by the owner (2026-11-05): a drain only after a while of looking away, with a warning that builds, and nothing for a glance. Still to confirm: the timer (target 5 s, range 4 to 6), the 30 degrees that count as looking at the lion, and whether the stare should also build while the line of sight is broken.
13. Roofs and walls. Answered (owner, 2026-11-05): the player may build roofs (Noon sun) and walls on the lion's floor.
14. Scrape and Long grass. Answered (owner, 2026-11-05): reusing [fading platforms](../abilities/FADING-PLATFORMS.md) and [dense ground](../abilities/DENSE-GROUND.md) is fine; keep both.
