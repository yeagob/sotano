[The deep desert](README.md) · [Levels (built)](../README.md)

# The great worm

Status: built (issue #354). Code: `src/entities/sand-worm.ts` (its rules), `src/render/worm-view.ts` (its look), `Game.wormBefore`, `Game.wormAfter`, `Game.wormIntention` (`src/game/game.ts`). Tests: `tests/sand-worm.test.ts`.

A worm as wide as a house lives under the sand of the deep desert ([README](README.md)). No intention hurts it. It can be calmed, and it can be killed only by three explosions in its mouth. The player reads the sand, climbs onto its back as it leaps, walks it plate by plate to the head, and calms it with good intentions. A calm worm can be steered. Stepping off it gives Prescience and the achievement *Rider of the Sands*; killing it gives Prescience and the achievement *Bane of the Deep*. One way per run.

It is not a projection: it is no pattern of the mind and has no colour tier. It is the desert's own life, like the creatures of the depths, and as they do it answers only positive intentions.

## How the player meets it

1. **The sand cracks.** A couple of seconds after the player stands on the basin's ground, the sand begins to crack: twelve blocks of the top break **one after another**, two blocks apart, in a straight line. The line runs **toward the point where the worm will leap out**, and that point lies 24 blocks from the player, so the line points across the sand at the player. A rumble and a toast ("The sand is cracking in a line…") come with the first crack. The player has 4.5 seconds to read the line and choose where to stand.
2. **The leap.** The head bursts out of the sand at the end of the line and leaps **toward the player** along the line, arching up to 18 blocks over its path, and comes down 44 blocks ahead. The body follows the head out of the same hole. A body in the head's way is struck once (one heart) and thrown aside. A body **behind** the leap point, on the cracked line, is safe: that is where the rider waits.
3. **It swims.** After the leap the worm swims through the sand with its back three blocks over it, wandering inside the basin. With no rider for 40 seconds it dives, and the cracks come again 8 seconds after it is gone.

## Its body

- **Size.** Sixteen blocks across (owner: 15 to 20), twelve segments nine blocks long: 108 blocks from mouth to tail.
- **A drawn body.** The worm is a drawn model, not blocks: it moves through the sand without writing a single block, so the mesher never sees it (performance, owner rule). The only blocks it touches are the twelve of the crack line, one at a time.
- **Its look.** Each segment is a box of the pale stone of the desert, a lighter top, darker flanks and belly, and a dark ring plate at its joint. The head has a dark mouth on its front, ringed with ten pale teeth. A calm worm's ring plates turn the player's gold.

## Riding it

- **Climbing on.** The back is a platform the whole width of the body. A body that lands on it, or walks on to it where it meets the sand, is attached: while it touches the back it moves with the worm.
- **Plate to plate.** The plates rise and fall in a slow wave that runs along the back (1.5 blocks each way). A plate more than a step higher than the one you stand on is a wall: you jump to it when the wave brings it low enough. The way to the head is a run of timed jumps from segment to segment.
- **The head.** The front segment is the head. Standing on it, the rider can calm the worm.
- **Falling off.** A rider who falls or jumps off an untamed worm lands on the sand, with no harm, and can climb on again while it swims.

## Calming it

- **Only positive intentions count.** A positive intention that hits the head, fired by a rider standing on the head, calms the worm: a gold spark, a soft chime and a toast that counts (`The worm grows calm: 5 of 12`). Twelve make it tame.
- **Kept.** The calm it has taken is kept for the run, even if the rider falls off.
- **Everything else does nothing.** A negative intention anywhere on the worm does nothing at all, and a toast says so ("Intentions do not harm the worm…"). A positive intention on any other segment, or from anywhere but the head, is spent on the body and does nothing. The worm has no health bar: intentions never kill it.

## Killing it

The owner's corrections (2026-11-28): the worm can be killed, but only by explosions in its mouth, and it takes **at least three**. One bomb or one missile does not kill it. The mouth is the front of the head, a block and a half behind and in front of its front face, inside its rim.

- **What counts.** Each explosion that enters the mouth counts once, bombs and missiles together, and the count is kept for the whole run (across its dives). The **third** kills it. Explosions that miss the mouth do not count.
- **A bomb it swallows.** A lit bomb (placed, thrown or kicked) that reaches its mouth while it is out of the sand is swallowed and counted.
- **A missile as it dives.** A missile (Dr. Launcher) counts only if it enters the mouth in the first 2.5 seconds of its dive. At any other moment a missile that meets the worm bursts on its body and is not counted.
- **Nothing else.** An explosive anywhere else on the body does nothing to it; negative intentions still do nothing to the body.
- **Before the third.** A muffled blast, smoke from the mouth, a shake and a toast that counts (`The worm swallowed the blast and shudders: 1 of 3.`).
- **Its death.** A muffled blast inside it, smoke and fire bursting from the mouth, a shake and a toast ("The worm swallowed the blast…"). A rider is dropped. It sinks and does not rise again this run, and there is no dismount.
- **What the kill gives.** The practice **Prescience** (with its card, unless it is already held) and the achievement **Bane of the Deep** (*Azote de lo profundo*, `desert.worm.slain`; provisional name). The issue's tooth knife and the water of life of the issue comment are not built: they wait for the owner's definition.
- **One way per run.** A worm that gave its dismount no longer counts explosions in its mouth, so it cannot also be slain; a slain worm gives no dismount. Each way has its own achievement.

## Steering it

When it is tame, a toast says how to steer it. Seated on its head, the rider no longer walks: **move steers** the worm in the direction pressed, relative to the view, and it turns slowly (a long, heavy body). It swims faster when tame (8 blocks a second, 6 when wild).

**Only inside the desert.** The worm is never steered, nor wanders, farther than 120 blocks from the basin's centre. Near the edge it loses the outward part of a heading and follows the rim, then leans inward; a toast says that the worm will not leave the deep sand.

## The dismount

- **Stepping off.** **Jump** from the head of a tame worm, and the rider is set down on the sand beside its head, as from a mount. Walking or falling off a tame worm onto the ground counts the same.
- **What it gives.** On the dismount, never before: the practice **Prescience** (with its card) and the achievement **Rider of the Sands** (owner: the grant happens on the dismount, not on the taming). Both are provisional names.
- **Then it leaves.** The worm dives and does not rise again this run.

## Controls

Riding adds no button: it gives new meanings to existing actions, as a Minecraft mount does ([input](../../../../architecture/input/README.md)).

| Verb | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|
| Climb on, walk the back | land on it; WASD | left stick | stick |
| Jump to the next plate | Space | A | jump button |
| Calm it (from the head) | left click, with good intentions (switch with the polarity control) | RT | cast button |
| Steer (tame, seated on the head) | WASD, the mouse turns the view | left stick, right stick | stick, look pad |
| Step off (dismount) | Space | A | jump button |

## Numbers

| Thing | Value |
|---|---|
| Body | 16 blocks across, 12 segments of 9: 108 blocks |
| Cracks | 12 blocks, 2 apart, over 85% of 4.5 s; the leap point 24 blocks from the player |
| Leap | 2.6 s, 44 blocks forward, 18 blocks of arch |
| Strike | one heart, once per leap, only to a body not riding it |
| Back | 3 blocks over the sand; plates rise and fall 1.5 blocks |
| Speed | 6 blocks a second wild, 8 tame; turns at 0.12 radians a second |
| Calm | 12 positive intentions on the head, from the head |
| Steering limit | 120 blocks from the basin's centre |
| Dive | after 40 s with no rider; 8 s before the next cracks |
| Death | the third explosion in the mouth, counted across the run: bombs while it is out of the sand, missiles only in the first 2.5 s of the dive |

## Open for the owner

1. The names: *Prescience* (the owner's proposal, *Presciencia*) and the achievement *Rider of the Sands* (*Jinete de las arenas*) are provisional.
2. A reward of its own for killing it: the issue's tooth knife (proposed as *Cut Ties with Toxic Relationships*) and the water of life of the issue comment wait for the owner's definition; today the kill gives Prescience and *Bane of the Deep* (provisional).
3. Whether a tame worm should stay in later runs, or follow the player.
4. The look: the worm is drawn from boxes of the desert's stone, without a texture of its own; the art pass is still to come.
