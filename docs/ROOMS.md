# Rooms and floors

How a floor is put together: a procedural **plan** (which room goes where) filled with hand-made **room templates** (what's inside each room), joined by doors. Code: [`src/world/floorplan.ts`](../src/world/floorplan.ts), [`src/world/floor.ts`](../src/world/floor.ts), [`src/content/rooms.ts`](../src/content/rooms.ts).

## 1. The plan

Isaac-style (see [TECHNICAL.md §1.6](TECHNICAL.md#16-floor-generation)):

1. A 7×7 grid. Start in the middle and grow with a queue: each room tries its four neighbours; a new cell is accepted only if it would touch **exactly one** existing room (so there are no loops) and a coin flip says yes. Target: 8–11 rooms.
2. Rooms with a single neighbour are **dead ends**. The farthest one (by steps from the start) becomes the **boss** room; another one at random the **treasure** room; a third, if there is one, a locked **vault**.
3. If there aren't enough rooms or dead ends, or the boss would be next to the start, try again.

Same seed, same plan. Tests check every plan has one start, one treasure and one boss room, that every room is reachable, and that it's a tree.

## 2. From plan to voxels

Each grid cell is a **13×7 interior, 5 blocks high**, surrounded by a 2-block brick wall shared with its neighbour, so rooms sit on a 15×9 pitch. Around the whole floor there's solid rock (with dirt pockets and ore), bedrock below, and grass with open sky 10 blocks above the ceilings: you can always dig out.

Linked rooms get a **3×3 doorway** through the middle of the shared wall, framed with a material that tells you what's behind it:

| Frame | Door | Behind it |
|---|---|---|
| Dark iron | Wood-brown slab | A normal room |
| Gilded | Gold slab with a crown | The treasure room (or the vault, once unlocked) |
| Bone-red | Red slab with a skull | The boss room |
| Gilded | Grey slab with a padlock | The vault: needs a key |

**Doors** are Doom-style: a solid slab fills the doorway and slides up into the ceiling when you get within ~3 blocks, and back down when you're ~5.5 blocks away (never on top of you). Locked doors ask the game first (`doorOpen` event): with a key they unlock for good; without one you get a "Locked" message. Items can hook `doorOpen` (e.g. a skeleton key that sets `needsKey = false`). The frame is breakable, so you can still dig around a locked door if you're stubborn.

If a floor has a locked door, it also has one **key**, placed on a `K` spot of a normal room (or the middle of one if no template has a `K`).

## 3. Templates

A template is 7 strings of 13 characters, top-down, first row = north:

```ts
{
  id: 'quarry', types: ['normal'], rows: [
    '.............',
    '.ii.......oo.',
    '.iRR.....Roo.',
    '..R...K...R..',
    '.dRR.....RRd.',
    '.dd.......dd.',
    '.............',
  ],
}
```

| Char | Meaning | Char | Meaning |
|---|---|---|---|
| `.` | empty floor | `P` | player spawn (start rooms) |
| `r` / `R` | stone, 1 / 2 high | `T` | item pedestal (treasure, vault) |
| `c` / `C` | crate, 1 / 2 high | `K` | possible key spot |
| `o` | obsidian, 1 high | `H` | trapdoor to the next floor (boss) |
| `d` | dirt, 1 high | `#` | brick up to the ceiling |
| `i` | iron ore, 1 high | | |

Optional fields: `weight` (relative chance among templates of the same type, default 1) and `mirror` (default true: the generator may flip it on X and/or Z for variety; start rooms are never flipped).

### Rules (checked by `validateTemplate` and the tests)

- Exactly 7 rows of 13 characters, only known characters.
- **The three tiles in front of every door must be walkable**, because any room may get a door on any side: row 0 and row 6, columns 5–7; column 0 and column 12, rows 2–4.
- Start rooms need a `P`, treasure and vault rooms a `T`, boss rooms an `H`. At most one of `P`, `T`, `H`.
- Every room type must have at least one template.

### Adding a template

1. Add an entry to `ROOM_TEMPLATES` in `src/content/rooms.ts`.
2. Run `npm test`: the validator tells you if a doorway is blocked or a marker is missing.
3. Play a few seeds (`?seed=N`, or R in game) and use `S.game.floor.rooms` in the console to see which template each room got.

## 4. What's on a floor today (M1)

| Room | Contents |
|---|---|
| Start | Spawn point, a few crates |
| Normal | Obstacles from the template; maybe the key |
| Treasure | A pedestal with a random item from the `treasure` pool |
| Vault (if the plan has a third dead end) | Locked; a pedestal with an item from the `vault` pool |
| Boss | No boss yet: a trapdoor to the next floor |

Taking the trapdoor builds the next floor with the same run (items, keys and pools carry over). There are no enemies yet, so every room counts as cleared on entry.

## 5. Next

- Double and L-shaped rooms (2×1, 1×2, 2×2 grid cells).
- Room interiors that use height: pits, platforms, multi-level rooms.
- Floors stacked vertically with slabs in between, and streaming (M3).
- Secret rooms with no door, and hidden pockets in the rock.
- A small in-browser template editor.
