# Keys

Up: [chests](README.md) · Status: built.

A key is an insight: the thing that lets a belief open. The player carries keys in a counter that caps at 99. They are spent on chests, on the locked vault door and on the way down. How many a chest asks depends on the floor it stands on, and the floor leaves fewer keys than its chests ask (three for every four), so the player must choose which chests to open.

## What a chest asks

A chest's lock is decided when its room is carved, from a fixed table, so a seed always gives the same locks.

| Keys asked | Weight | Earliest floor |
|---|---|---|
| 0 (free) | 5 | 0 |
| 1 | 5 | 0 |
| 2 | 2 | 2 |
| 3 | 1 | 5 |

Floors are numbered as the code numbers them: the roots are floor 0, the frozen ninth is floor 9. The roots never ask for more than one key. From floor 5 on, a chest may ask for three. A chest opens only when the player pays its whole cost.

## Where keys come from

- **The locked vault door.** Each floor with a locked door has one key. It lies on a key spot of a normal room, or in the middle of a normal room if no template has one.
- **The chests of the floor.** For the chests, a floor leaves about three keys for every four its chests ask (rounded up), on open tiles of normal rooms. You cannot open every chest on a floor.
- **Chest contents.** A key is one of the four rolls in a chest (weight 3 of 10, with luck).
- **Room clear.** When the last projection of a room is gone, the room may drop a key. The clear table is heart 3, bomb 2, key 2, nothing 7; luck raises the chance of a drop.
- **The roots.** The roots always lay one key and one bomb loose on a free tile of a roots room, as a fixed reward.

Breaking a block gives nothing: no key, bomb, heart or item drops from breaking blocks. Keys come only from the sources above.

## Where keys go

- **Chests.** Opening a chest spends its cost.
- **The locked vault door.** Walking up to a locked door spends one key. The door opens and stays open.
- **The way down.** The toll may ask for keys on floors 0 to 4 (see [TOLL](../levels/floors/TOLL.md)).

## The cap

Keys and bombs each cap at 99. A pickup past 99 is lost.

## Notes

- The design said keys change only through chests. The build also spends keys on the vault door and the toll, and gives them from room clears and the roots. That contradiction is open: see [not-built/chests/KEY-SOURCES.md](../../not-built/chests/KEY-SOURCES.md).

Code: `src/content/tables/chests.ts` (the lock table), `src/world/floor.ts` (the floor's keys and chest keys), `src/content/tables/rewards.ts` (room clear), `src/game/game.ts` (spending keys on chests, the vault door and the toll; the cap).
