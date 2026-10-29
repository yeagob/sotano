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
