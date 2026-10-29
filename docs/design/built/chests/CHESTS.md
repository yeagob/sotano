# Chests

Up: [chests](README.md) · Status: built.

A chest is what you keep shut until you are ready, and what was kept, given once it is open. The owner's redesign (2026-10-27) asked that a chest look like a chest. It does: a wooden body with bands and a hinged lid, drawn on an unbreakable block.

## What it is

- **A block that cannot be broken.** Nothing digs, burns, blasts or cuts a chest. You can stand on it.
- **A model, not a cube.** The mesh does not draw it; a separate chest model stands on the block and turns so that its lid swings back into air, never into a wall, and faces the middle of its room (or its nearest door when it is in the middle). A chest walled in on every side only props its lid ajar.
- **Read at a glance.** The look says what the chest is (art decisions are in [the art ledger](../../../art/DECISIONS.md)):

| Look | Means |
|---|---|
| Simple brass clasp, no lock | free: walk up and it opens |
| Iron padlock on the front with 1, 2 or 3 keyholes, iron bands | locked: it asks for that many keys; its keyholes glint while the player carries enough |
| Brass corners and trim | it holds a practice (a pedestal chest) |
| Lid thrown back, warm light inside | open: already given what it kept; the light settles to a low glow |

The design text said locked chests were gold; the built locked chest is an iron padlock with brass trim. The built look is the one in play.

## Opening

Walk up to it within about one and a half blocks, at its height. The chest asks its cost in keys.

- **Enough keys.** The keys are spent, the block turns into the open chest, and the model plays the opening: a short shudder, the padlock drops away, the lid swings back with a small overshoot, the light inside swells. A creak, an unlock chime (a free chest plays the key chirp), a small shake of the screen and a toast reading how many keys were spent.
- **Not enough keys.** A toast says how many keys are needed and the denied sound plays. The chest refuses until you step away three blocks and come back, so it does not nag.

## What is inside

What a chest kept is spat out. As the lid opens, each thing leaps out of the mouth on an arc, about one block up, and lands in front of the player, one every 0.16 seconds, each with a pop and a spark. A practice gets the reveal chord. Each thing can be collected 0.6 seconds after it lands.

Two kinds of chest hold different things.

| Chest | Where | What it holds |
|---|---|---|
| **Pedestal chest** | where a pedestal would stand, in treasure and vault rooms | the practice reserved for that room at the start of the run. Sixty percent of the treasure and vault practices sit in a chest. The boss's practice never does: it is earned, not locked away. It floats where it lands |
| **Room chest** | free-standing, in normal rooms (about four in ten of them) | one, two or three rolls of the chest table: a key, a bomb, a heart (each weight 3 of 10) or a practice (weight 1, drawn from the treasure pool). At most one practice per chest; a chest that rolls no practice has a 6 percent chance of one anyway |

Room chests are not placed on the roots (see [ROOTS](../levels/floors/ROOTS.md)). The owner's text said every floor including the roots; the build leaves the roots without room chests. That is open: see [not-built/chests/ROOT-CHESTS.md](../../not-built/chests/ROOT-CHESTS.md).

The vault's sanctuary holds two chests on the open tiles of the room, with its pedestals on the ring around the centre. The presence that watches the sanctuary is in the bestiary, not here.

## Where chests may stand

A chest is placed only on a plain floor tile with clear air above. It never stands in the three tiles in front of any door, never in the centre where projections appear, and never beside a pedestal, a key spot or the hole. Nothing may be in the layers above it. So a chest never blocks a door, a spawn, a pedestal or the way down. The random choice of place has its own stream, so an existing room does not change when chests are added.

## Notes

- The old design text cited a generator version of 5. The number is a release counter in the code, not a design fact; this document does not keep it.
- The keys that open chests are described in [KEYS.md](KEYS.md).

Code: `src/world/floor.ts` (placing pedestal, room and sanctuary chests; the free spots), `src/content/tables/chests.ts` (the lock table, the contents table, the rare practice chance, the practice share), `src/game/game.ts` (opening, the spits, the rare practice), `src/entities/chests.ts` and `src/render/chest-model.ts` (the model), `src/content/materials.ts` (the chest blocks are unbreakable).
