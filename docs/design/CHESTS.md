# Chests, keys and hard walls

Status: **built** (GEN_VERSION 5). Owner direction, 2026-10-27: walls around locked doors are very hard but breakable; keys open chests; at least half of the practices sit shut inside chests; chests cannot be broken; they appear often on every floor; some open free, some cost keys, some cost several, and keys are spent.

## 1. What a chest is

A chest is a **block with a model** (owner redesign, 2026-10-27: "a chest must look like a chest"). The voxel (`chest`, closed; `chestopen`, open) stays a solid, **unbreakable** cell (tier and HP infinite, like bedrock): no intention, bomb, beam, blade, kick or fire changes it, and you can stand on it. The mesher does not draw it (`MaterialDef.model`, `MODEL_DRAWN`): the `Chests` entity (`src/entities/chests.ts`) draws a real chest on it from `src/render/chest-model.ts`, a wooden body with bands and a hinged lid, turned so that the cell behind it is free (the lid swings back into air, never into a wall) and, among those sides, facing the middle of its room (or its nearest door when it stands in the middle). A chest walled in on every side only props its lid ajar. What you keep shut you open **on purpose**, with keys or by walking up.

It reads with no text (art entry in [../art/DECISIONS.md](../art/DECISIONS.md)):

| Look | Means |
|---|---|
| Simple brass clasp, no lock | **Free**: walk up and it opens |
| Iron padlock on the front with **1, 2 or 3 keyholes**, heavier iron bands | **Locked**: it asks for that many keys. Its keyholes **glint** while you carry enough |
| Brass corners and trim | It holds a **practice** (a pedestal chest) |
| Lid thrown back, warm light inside | **Open**: already given what it kept; the light settles to a low glow |

Story: a chest is *what you keep shut until you are ready* (closed) and *what was kept, given* (open). A key is an insight (STORY.md); a lock is a belief that asks for as many insights as it holds.

## 2. Opening

Walk up to it (within about 1.5 blocks, at its height). The `chestOpen` event fires (`cost` in keys, changeable by items, or cancel):

- enough keys: they are **spent**, the block turns into the open chest and the model plays the opening: a short shudder, the padlock drops and shrinks away, the lid is thrown back on its hinge with a small overshoot, the light inside swells; a creak, the unlock chime (a free chest plays the key chirp), a small shake and a toast (`Chest opened · keys spent: n`);
- not enough: a toast (`Locked chest · keys needed: n`) and the denied sound, once per approach (step 3 blocks away to try again).

## 3. What is inside

What a chest kept is **spat out**: as the lid opens, each thing leaps out of its mouth on an arc (about one block up) and lands **in front of you**, a block and a half from the chest towards where you stand, fanned out when there are several, one every 0.16 s, each with a pop and a spark of gold (a practice gets the reveal chord). It can be collected once it lands (0.6 s).

| Chest | Holds |
|---|---|
| **Pedestal chest** (stands where a pedestal would, in treasure and vault rooms) | The practice reserved for that room at run start. **60 %** of treasure and vault practices are shut in a chest (never the boss's: it is earned, not locked away). It leaps out and floats where it lands |
| **Room chest** (free-standing, normal rooms: **40 %** of them, every floor including the roots) | One to three rolls of the `chest` table (key, bomb, heart, or, rarely, a **practice** from the treasure pool drawn at runtime: at most one per chest, about one room chest in seven) |

Owner, 2026-10-29: every chest block holds a small chance of one extra random practice (`CHEST_RARE`, 6 %), on top of its contents. A vault's two chests stand in the Boundary's sanctuary ([BESTIARY §7](BESTIARY.md)).

## 4. Locks

Rolled at carve time from `CHEST_LOCK` (a structure table, so a seed always gives the same locks):

| Keys | Weight | From floor |
|---|---|---|
| 0 (free) | 5 | 0 |
| 1 | 5 | 0 |
| 2 | 2 | 2 |
| 3 | 1 | 5 |

The roots (floor 0) only ever ask for 0 or 1.

## 5. Where keys come from

- The floor's locked door still has its one key (a `K` spot of a normal room).
- For the chests, a floor leaves **three keys for every four its chests ask** (rounded up) on open tiles of normal rooms (`floor/k/chestkeys`), so you cannot open everything and must choose. The rest come from chests that hold keys and from room-clear rewards.
- Keys cap at 99 and are only changed through `pickupCollect` and `chestOpen`.

## 6. Hard walls

Every room with a **locked door** (the vault) is wrapped in **obsidian**: its two-block walls, floor and ceiling (tier 3, 40 HP, armor 3 against brick's tier 1, 12 HP). It can still be broken, with bombs, a blade or patience, but it costs far more than brick; its brass frame stays as it was. Only brick is turned: rock around it keeps its own theme.

## 7. Where chests may stand

`freeSpots` in `src/world/floor.ts`: plain floor tiles with clear air above, not in the three tiles in front of any door, not around the centre where projections materialise, not next to `P`, `T`, `K` or `H`, and nothing in any layer above. A chest therefore never blocks a door, a spawn, a pedestal or the way down. Its random choices live on `floor/k/room/i/chest`, a fork of its own, so existing rooms are unchanged.

## 8. Open questions

- A key that costs a **heart** or **bomb** instead (a mimic chest, a cursed chest).
- Chests that need a state of being, or a practice, to open.
- A chest that moves when you look away (a presence).
- Chests the player can carry (stations, STATIONS.md).
