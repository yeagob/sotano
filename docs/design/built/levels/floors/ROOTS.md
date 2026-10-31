# The roots (floor 0)

Up: [floors](README.md) · Status: built.

The roots are the earth the player starts in: a friendly, lit, safe floor where the game teaches itself. Everything is pretty, every door is open, no projection ever appears, and the lessons are written on the walls.

## How the player meets it

- **A fixed plan.** The roots are the same every run: eleven rooms, the start room with the treasure room and the way down beside it, and eight lesson rooms around them in a ring. The plan is a character grid with one template per cell (`TUTORIAL_LAYOUT`).
- **Open doors.** Every door opens. Doors never lock, never seal, and the way down is a plain door. A locked vault becomes a treasure door.
- **Lessons on the walls.** Each lesson room has two stone tablets on its north and south walls beside the doors, so the player reads the lesson whichever way they come in. The text is drawn in the player's language and redrawn when the language changes. The tutorial is never an overlay.
- **Eleven lessons.** The lesson rooms teach, in order of the ring: moving (the start room); intentions (dig); steps (step); a way out of a trench (pit); a bridge; kicking cubes (crates); breakthroughs with bombs (seal); good and bad intentions (mend); water, fire and lava (spring, a pool); a practice (the treasure room); and the way down (the door room).
- **Two practices.** The treasure room offers a practice of quality up to 3; the way down offers a practice of quality up to 4. The tutorial's pedestals hold no chests.
- **Loose rewards.** The roots always lay one key and one bomb on a free tile of a roots room.
- **Peaceful creatures.** The roots hold no projections. Wonder (a paper moth of curiosity that keeps you company), Rootling and Mossling wander the rooms, and they do not attack.
- **Rest with a Mossling.** Stand still within about two and a half blocks of a Mossling for three seconds and it rests with you: you heal a quarter of a heart, once for each Mossling.

## Rules that hold on the roots

- Lava and fire never appear here (they can hurt, and the validator keeps them off the tutorial). Water is allowed: the spring room shows it.
- The validator checks each lesson room like every other room (three tiles in front of each door walkable, a centre open, the pedestal reachable).
- Breaking blocks drops nothing; the roots' loose key and bomb are the only drops of the floor.

## Not built here

- A climb from the roots to the surface is not built. Above the roots lies dirt, then the grass at height 167. The player can dig or build through the dirt, but there is no stair or shaft (see [ROUTE-FROM-ROOTS](../../../not-built/levels/ROUTE-FROM-ROOTS.md)).
- Room chests on the roots are not built; the design says there should be some (see [ROOT-CHESTS](../../../not-built/chests/ROOT-CHESTS.md)).
- The Gardener, a presence the design planned for the roots, is not built; it is described with the bestiary's presences, not here.

Code: `src/world/floorplan.ts` (the tutorial plan), `src/content/rooms.ts` (the eleven roots templates and the tutorial cells), `src/world/floor.ts` (no projections, open doors, the loose loot), `src/render/tablets.ts` (the stone tablets), `src/content/creatures/index.ts` (the roots' creatures), `src/game/game.ts` (the Mossling rest).
