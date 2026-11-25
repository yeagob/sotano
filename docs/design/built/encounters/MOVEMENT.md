[Encounters](README.md)

# Movement

Built. How the beings of the depths move about a room. Each kind of movement is a behaviour in `src/enemies/behaviours.ts`, and every projection, creature and boss is one of them, or a combination. Walking is navigated by a flow field over the room; the rest move straight at their target or drift on their own.

## The behaviours (built)

| Behaviour | How it moves | Used for |
|---|---|---|
| Walker (`chase`) | Walks toward the target on the room's flow field, with an optional pause (hesitation) and lunge | Projections that walk, such as Doubt |
| Leaper (`leap`) | Crouches, then arcs through the air to a marked spot, leading the target | Impulse |
| Charger (`charge`) | Aims a line at the target, runs it, stops at a hard block or a wall, stuns, and can bounce back at the target | Reactivity, and the charges of several bosses |
| Ranged (`ranged`) | Keeps a distance and shoots on a cooldown | The Critic |
| Burst (`burst`) | Rushes, swells in steps, and bursts, breaking soft blocks | Panic |
| Emitter (`emitter`) | Stands and acts on a timer; may follow the target at a set distance | Many bosses on floors 6 to 9 and some projections |
| Phaser (`phase`) | Passes slowly through solid blocks toward the target | What If |
| Sleeper (`sleep`) | Waits until its body moves faster than a set speed, then takes on another behaviour | Inertia |
| Phased (`phased`) | Switches to the next behaviour when health falls past each threshold | Every boss |
| Chirp (`chirp`) | Wanders, and sings on a timer when the room is quiet | Chirper |
| Flee (`flee`) | Drifts, and turns away from the player when near | Wonder |
| Wander (`wander`) | Drifts, comes closer when far and steps back when near, at a set hover height | Most creatures |
| Volley (`volley`) | Fires on a timer, otherwise holds still | The Boundary |

Bosses also use a gait in each phase: a stalk (walks at the player), a keep (holds a distance), a hover (floats at a height), or still (does not walk). See [Fight flow](../bosses/FIGHT-FLOW.md#5-moves).

## Walkers and the flow field

A walker moves on a flow field for its room: a map of which cells lead toward the target. It climbs up terraces of up to four blocks, drops into pits of up to two, and avoids or crosses water and lava, depending on the element's rule for that kind. The field is rebuilt when the target changes cell, or when the world or the elements change.

## Allies and the player

Built (issue #327). Allies move with the player and keep out of its way. Hostile projections move as before. Code: `src/enemies/escort.ts`, applied by the dungeon's set of beings in `src/entities/enemies.ts`.

**Who is an ally here.** The projections on your side, converted by positive intentions or mended by the Mender, and the friendly creatures that love shots have grown past their birth size. Sky allies and the future drones of the practices Amistad and Maestros are not covered (owner, #327).

**The rule.** An ally keeps its behaviour (it still chases, shoots and fights its target), and gives way to you on top of it:

- **It follows you.** With nothing hostile in its room, a projection on your side walks back to you when it is more than 4 blocks away, steps back when it is closer than 2, and holds still in between. A grown creature keeps its own drift, which already comes near and backs off.
- **It keeps clear of your body.** It never walks into your box, and steps away when the gap between your box and its box is under half a block.
- **It walks round you.** On its way to a target, the cells you stand on and next to cost it eight steps more each, so it goes round you when there is room. In a passage only one block wide with you in it, it waits.
- **It leaves doorways and corridors.** Standing in a one-block doorway or corridor while you walk toward it from within 4 blocks, it walks out to the nearest wider cell, never through you.
- **It steps out of your line.** Inside 10 blocks of your aim, or 3 blocks of the path you are walking, it sidesteps across the line, keeping the part of its walk that goes along it, so it can still reach a target at the end of your shot.

Nothing ever pushed your body: beings and the player do not collide, so "pushing" meant overlapping, and that is what the rule prevents.

### What it was before (the investigation)

Recorded with a headless room of 13 by 7 blocks, a converted Doubt as the ally, a scripted player walking at 3 blocks a second, ticks at 60 a second (`tests/allies-escort.test.ts`, which runs each case with and without the rule).

| Case | Before | With the rule |
|---|---|---|
| You walk through the spot where an idle ally stands | It stood still; your boxes overlapped for 25 ticks | Never overlapped; it settled 3.9 blocks from you |
| A grown creature (twice its size) in your way | Overlapped 35 ticks | 4 ticks |
| Its target stands behind you | It walked straight through you: 44 ticks of overlap, target reached in 335 ticks | Went round you: no overlap, reached in 393 ticks |
| It stands idle in a one-block corridor five long, you walk in | Stood its ground: 81 ticks in your way, 25 ticks of overlap | Walked out ahead of you, no overlap; 126 ticks in the corridor (it walks at 1.7 blocks a second) |
| It stands in a one-block doorway, you walk through | 80 ticks in your way, 25 of overlap | Out in 38 ticks, no overlap |
| You stand and aim at it, three blocks off | Stayed in your line for the whole 5 seconds | Out of the line in 26 ticks |
| No hostile in the room, it is 9 blocks away | Stood where it was | Came to 3.9 blocks |
| It is in a pit one block deep, you across the room | Stood in the pit | Climbed out and came, in 84 ticks |
| It is in a pit two blocks deep with sheer walls | Stood in the pit | Still trapped: a walker climbs one block at a time (see open questions) |

### The thresholds (verifiable)

Checked tick by tick at 60 ticks a second in `tests/allies-escort.test.ts`:

| Criterion | Threshold | Why this number |
|---|---|---|
| An ally's box overlaps yours | At most 12 ticks in a row (0.2 s) | A brush when you outrun an ally that cannot get away; the old behaviour overlapped 25 to 44 ticks |
| An ally stands in a one-block doorway you walk toward from within 4 blocks | At most 60 ticks (1 s) | Time to notice you and take one step out |
| The same in a corridor five blocks long | At most 150 ticks | The second above plus the time a Doubt needs to walk out of the middle (2.5 blocks at 1.7 blocks a second) |
| An ally stands in the line of your shots | At most 45 ticks (0.75 s) | Under one second of a held fire |
| An ally with a reachable target reaches it, with you standing in the way | At most 600 ticks (10 s) | An 8-block route round you takes about 6.5 s with a Doubt's pauses |
| With nothing hostile in the room, after 300 ticks (5 s) | Between 1.5 and 4.5 blocks from you | The follow band (2 to 4 blocks) with half a block of settling |
| A hostile projection's path | The same, tick for tick, with and without the rule | The owner's rule: hostiles do not change |

### Decided (owner, #327)

1. In scope: converted projections, mended allies and grown allies. Out: sky allies and the future drones.
2. Interference is all of: blocking your path, pushing (overlapping) your body, standing in a corridor or one-block doorway you move through, and standing in the line of your own shots.
3. With no hostile in the room, allies follow you at a set distance and keep out of your way.
4. Hostile projections are not changed; their navigation tests stay green.
5. No seed or room was reported where an ally collides with you; the investigation above stands in for it.

## Passing through blocks

A being can be a ghost, which passes through solid blocks slowly and ignores walls for its own path. The Phaser (What If) uses this. A ghost is not a voxel tunnel: it does not carve its path.

## Behaviours defined in a projection's own file

Some projections carry a behaviour of their own, written in their file rather than in the shared list:

| Behaviour | What it does | Used by |
|---|---|---|
| Loop | Walks a fixed route of four points around the room's centre, and turns to attack the player when crossed | Autopilot; Rumination, which walks the same route on the floor (the design's tunnel through rock is not built) |
| Surge | Walks like a walker and sends a wave across the room | Undertow |
| Under | Stays still, and erupts when the player comes within three blocks | Sulk |
| Shut | Hides in a block, peeks to throw, and hides again | Avoidance |

## Floating

A being that floats keeps a set height above the floor it rose from. Creatures and bosses use this: the Downpour's three heights are a boss phase, and the Drifter floats two blocks up.

## Not built

- Swimmers: a being that lives only in liquid and surfaces to attack. The Undertow is designed as a swimmer; in the build it walks.
- Mounted: fixed to a wall, ceiling or block. No such behaviour exists in the build.
- The voxel burrower: a being that moves through rock along a fixed loop. Rumination walks a loop on the floor instead, and the ghost stands in for the rock path.
- The patrol behaviour exists in the code and nothing uses it. The loop of Autopilot does the same job inside its own file.

See [not-built encounters: movement](../../not-built/encounters/movement/README.md).

## Open questions

- **Walk through the room.** Walkers follow the flow field, which knows no doors. Check that a walker never waits forever at a door it cannot pass.
- **Ghosts.** A ghost ignores walls on its way. Is that the right rule for the burrower's loop, or does the design's rock path matter?
- **Patrol.** The patrol behaviour is unused. Keep it for the burrower loop, or remove it?
- **Allies between rooms.** An ally belongs to the room it was in and stays there when you leave. Should allies go through doors with you?
- **The follow distance.** Allies hold 2 to 4 blocks from you. Is that the right distance in play?
- **Deep pits.** A walker, ally or hostile, cannot climb out of a pit two blocks deep with sheer walls. Should the field mark such pits, or should walkers get a higher step?
