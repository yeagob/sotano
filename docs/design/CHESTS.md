# Chests, keys and hard walls

Status: **built** (GEN_VERSION 5). Owner direction, 2026-10-27: walls around locked doors are very hard but breakable; keys open chests; at least half of the practices sit shut inside chests; chests cannot be broken; they appear often on every floor; some open free, some cost keys, some cost several, and keys are spent.

## 1. What a chest is

A chest is a **block** (`chest`, closed; `chestopen`, open), not an entity: it stands on the floor of a room, one cube, solid, with a banded wooden look and a brass lock plate. Both are **unbreakable** (tier and HP infinite, like bedrock): no intention, bomb, beam, blade, kick or fire changes them. What you keep shut you open **on purpose**, with keys or by walking up.

Story: a chest is *what you keep shut until you are ready* (closed) and *what was kept, given* (open). A key is an insight (STORY.md); a lock is a belief that asks for as many insights as it holds.

## 2. Opening

Walk up to it (within about 1.5 blocks, at its height). The `chestOpen` event fires (`cost` in keys, changeable by items, or cancel):

- enough keys: they are **spent**, the block turns into the open chest, gold particles, a small shake, a toast (`Chest opened · keys spent: n`) and the unlock chime (a free chest plays the key chirp);
- not enough: a toast (`Locked chest · keys needed: n`) and the denied sound, once per approach (step 3 blocks away to try again).

## 3. What is inside

| Chest | Holds |
|---|---|
| **Pedestal chest** (stands where a pedestal would, in treasure and vault rooms) | The practice reserved for that room at run start. **60 %** of treasure and vault practices are shut in a chest (never the boss's: it is earned, not locked away). Opening it makes the practice appear above it, with the usual pop and glow |
| **Room chest** (free-standing, normal rooms: **40 %** of them, every floor including the roots) | One to three rolls of the `chest` table (key, bomb, heart, or, rarely, a practice from the treasure pool drawn at runtime), lying beside it |

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
