# Rooms and floors

How a floor is put together: a procedural **plan** (which room goes where) filled with hand-made **room templates** (what's inside each room), joined by doors. Code: [`src/world/floorplan.ts`](../src/world/floorplan.ts), [`src/world/floor.ts`](../src/world/floor.ts), [`src/content/rooms.ts`](../src/content/rooms.ts).

## 1. The plan

Isaac-style (see [TECHNICAL.md §1.6](../research/TECHNICAL.md#16-floor-generation)):

1. A 7×7 grid. Start in the middle (floor 0) or **right under the boss room of the floor above** (floors 1–9), and grow with a queue: each room tries its four neighbours; a new cell is accepted only if it would touch **exactly one** existing room (so there are no loops) and a coin flip says yes. Target: 8–11 rooms.
2. Rooms with a single neighbour are **dead ends**. The farthest one (by steps from the start) becomes the **boss** room; another one at random the **treasure** room; a third, if there is one, a locked **vault**.
3. If there aren't enough rooms or dead ends, or the boss would be next to the start, try again. Starts on an edge or a corner have fewer ways to grow, so after many failed attempts the minimum room count is relaxed step by step (tested from all 49 start cells).

Every floor's plan is decided when the run starts, from the run's seed (see [RNG.md](RNG.md)): same seed, same plans. Tests check every plan has one start, one treasure and one boss room, that every room is reachable, and that it's a tree.

## 2. From plan to voxels

Each grid cell is a **13×7 interior, 5 blocks high**, surrounded by a 2-block brick wall shared with its neighbour, so rooms sit on a 15×9 pitch. The ten floors (0–9, [LEVELS.md](LEVELS.md)) are **stacked** in one world, 16 blocks apart, with rock in between (each level's `strata`: soil at the roots, obsidian at the bottom), bedrock at the bottom and grass with open sky above floor 0: you can always dig out, up or down. Templates may name the floors they belong on (`floors: [first, last]`). Room and door ids are global (`levelIndex(floor) × 100 + index`, always positive). Details: [ENTITIES.md §1](ENTITIES.md#1-stacked-floors-worldfloorts).

Linked rooms get a **3×3 doorway** through the middle of the shared wall, framed with a material that tells you what's behind it:

| Frame | Door | Behind it |
|---|---|---|
| Door frame (floor rock) | Built wood with vertical boards and iron bands | A normal room |
| Brass frame | Brass leaf with a hollow ◇ | The treasure room (or the vault, once unlocked) |
| Obsidian frame (one crack of captive light) | Obsidian leaf with a long captive-light crack | The boss room |
| Brass frame | Wood leaf with an iron padlock and a gold keyhole | The vault: needs a key |

**Doors** are Isaac-style (owner, 2026-10-27): a solid slab fills the doorway, and it stands **open whenever its rooms hold no projections**. Entering a room with projections seals its doors (never on top of you); clearing it opens them again by themselves. Locked doors still wait for you to walk up: they ask the game first (`doorOpen` event): with a key they unlock for good; without one you get a "Locked" message. Items can hook `doorOpen` (e.g. a skeleton key that sets `needsKey = false`). **A breakthrough that reaches a door blows it apart for good** (`doorBreak`, cancellable): the doorway stays open forever, never sealed or locked again, a locked one included. The frame is breakable too, so you can still dig around a door if you're stubborn.

During combat a room's doors are **sealed** (they stay shut) until every projection in it is gone.

**Challenge rooms** (`RoomType 'challenge'`, Isaac's): on a hostile floor, one room may be a challenge room (`CHALLENGE_ROOM` table, `fork('plan', k, 'challenge')`, a dead end when there is one, never next to the start; obsidian frame for now). Every time you walk in, its doors seal and **three waves** materialise at its centre, each harder than the last (`waveBudget(floor, wave, visit)`), every visit harder than the one before; each wave cleared drops a reward rolled on the room's own fork. Leave and come back as often as you like: it is for farming. Templates: `gauntlet`, `colosseum`.

If a floor has a locked door, it also has one **key**, placed on a `K` spot of a normal room (or the middle of one if no template has a `K`). **The room behind a locked door is wrapped in obsidian** (walls, floor, ceiling): very hard, still breakable. More keys lie on open tiles for the floor's **chests**, which are unbreakable blocks that hold shut practices and loot ([design/CHESTS.md](../design/CHESTS.md)); `freeSpots` picks the tiles and `carveFloor` returns `FloorResult.chests`. Chest decisions use the forks `floor/k/room/i/chest` and `floor/k/chestkeys`.

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
| `o` | obsidian, 1 high | `H` | where the hole to the next floor opens (boss); boss rooms also have a `T`, the boss's practice |
| `d` | dirt, 1 high | `#` | brick up to the ceiling |
| `i` | iron ore, 1 high | | |
| `?` | decor slot: maybe a crate | `~` | decor slot: maybe dirt, stone or ore |
| `!` | decor slot: ore or obsidian | `b` | brick, 1 high |
| `1`–`4` | a built terrace (brick) of that height | `_` | a dip, 1 deep |
| `w` / `W` | water 1 / 2 deep (dug into the floor, a source) | `l` / `L` | lava 1 / 2 deep |
| `f` | an eternal flame on the floor | `X` | an obsidian wall up to two blocks under the ceiling (climb it with blocks, or a breakthrough) |
| ` ` (space) | not room: the rock stays (the outline of a template bigger than one cell) | | |
| `=` | a dry pit, 2 deep (you need a block to climb out) | `D` / `E` | a door-shaped plug (3 wide, 3 high) of dirt set in a `#` / `X` wall; above the dirt the wall goes on |

A wall that seals the whole room (a full row or column of `#` or `X`) carries a plug where a door would stand on its far side (columns 5–7 of a row wall, rows 2–4 of a column wall). Owner, 2026-10-27: a sealing wall must not hide the door behind it, and it gives way to the softest material.

### Height and layers

Optional fields (design and authoring rules: [LEVELS.md](../design/LEVELS.md), the [`sotano-levels`](../../.claude/skills/sotano-levels/SKILL.md) skill):

- `height` (5–8, default 5): the interior height. `#` columns reach the ceiling, whatever its height. `RoomInfo.height` carries it to the game (combat bounds, flow fields).
- `ceiling` (`flat`, `vault-x`, `vault-z`, `dome`, `pointed-x`, `pointed-z`, `cross`, `stepped`, `cave`): how the height above 5 is shaped (`ceilingAt` in `rooms.ts`). Two blocks of headroom stay over every stack under it (checked).
- `size: [cellsX, cellsZ]` (1–2 each) and `home: [cx, cz]`: a room bigger than its cell. On the map it is only its home cell; its space spreads into empty cells around it that the floor allotted to it ([LEVELS.md](LEVELS.md) §11). Doors, the centre, `P` and `H` are the home cell's. Big templates may be mirrored; vaults keep to one cell.
- `layers: [{ y, rows }]`: extra 13×7 grids of single blocks at `y` blocks above the floor (1…height − 3): bridges, balconies, galleries. Layers use `.`, `r`, `c`, `o`, `d`, `i`, `b` and `f` (a flame on a terrace exactly `y` high: a brazier on a pillar). Layers are mirrored with the room.
- Pools dig up to 2 blocks (`MAX_PIT`) and 2-deep ones are lined with the level's floor material; the room's shell grows with its height. Rooms with height and elements draw no randomness of their own.

Decor slots are rolled per room from the room's own seed fork, biased by its **mood** (sparse, normal, cluttered, reinforced; see [RNG.md §6](RNG.md#6-what-varies-per-run)). Reinforced rooms also harden their obstacles (dirt and crates become stone, stone becomes deepstone), never the shared walls.

Optional fields: `weight` (relative chance among templates of the same type, default 1) and `mirror` (default true: the generator may flip it on X and/or Z for variety; start rooms are never flipped).

### Rules (checked by `validateTemplate` and the tests)

- Exactly 7 rows of 13 characters, only known characters.
- **The three tiles in front of every door must be walkable**, because any room may get a door on any side: row 0 and row 6, columns 5–7; column 0 and column 12, rows 2–4.
- Start rooms need a `P`, treasure and vault rooms a `T`, boss rooms an `H` **and** a `T` (the boss's pedestal). At most one of each; a start room holds neither `T` nor `H`.
- Decor slots count as solid for every rule below.
- The **pedestal must be reachable** from at least one side (checked).
- The **centre tile** (column 6, row 3) of normal rooms must be walkable: projections materialise there (checked).
- The 2×2 shaft tiles at `H` (boss) and `P` (start) must be clear (checked): the hole opens there and lands there. The shaft is carved at +1 on each world axis, so for mirrored templates the check covers every flip; the boss's `T` may never fall on any of those tiles.
- Every room type must have at least one template.
- **Height and elements** (`validateVolume`): `height` 5–8; a vault or dome needs extra height; no water next to lava and no flame next to something that burns (`c`, `C`, `?`), on the floor or in a layer; layers at 1…height − 3, never two at one height, never blocking the door approaches under door height, the centre (normal rooms), the pedestal or the shaft; no lone floating layer blocks; flames on layers need a terrace that high under them.
- **Building, as carved** (`needsBuildingIn` with the room's flips and real doors): over many seeds, at least half of every floor's fighting rooms with two or more doors need building (`tests/levels.test.ts`).
- **Building** (`walkParts`, `needsBuilding`; [LEVELS.md](LEVELS.md) §5–§6): start rooms never need building; the centre of a fighting room reaches a door on foot; a room that needs building carries soft blocks to build with; `P` and `H` sit at the centre; fire, lava and deep water stay off floor 0. Optional fields `floors: [first, last]`, `lesson` (floor 0) and `size: [cellsX, cellsZ]` ([2, 1] is 28 × 7, [1, 2] is 13 × 16; doors only on its first cell; never mirrored). Start rooms keep a clear 4×4 centre (the great pit lands there); a wide crown keeps a clear 4×4 shaft around its `H`.
- `tests/levels.test.ts` carves every element template across all ten floors for several seeds and checks that three layers of rock always remain between bands, that no element sits inside a block, that deep pools are lined, and that each room is as tall as its template.

### Adding a template

1. Add an entry to `ROOM_TEMPLATES` in `src/content/rooms.ts`.
2. Run `npm test`: the validator tells you if a doorway is blocked or a marker is missing.
3. Play a few seeds (`?seed=N`, or R in game) and use `S.game.floor.rooms` in the console to see which template each room got.

## 4. What's on a floor today (M1.5)

| Room | Contents |
|---|---|
| Start | Spawn point (floor 1) or the landing spot of the shaft from above |
| Normal | Obstacles from the template; a roster of projections (budget 2 + floor; one room in five is quiet); maybe the key |
| Treasure | A pedestal with a practice from the `treasure` pool (drawn when the floor is carved) |
| Vault (if the plan has a third dead end) | Locked; a pedestal with a practice from the `vault` pool (quality-4 practices are twice as likely there) |
| Boss | No boss yet: entering it loads the next floor; 1.5 s later the boss's practice appears on its pedestal and a 2×2 hole opens down into the next start room (never while you stand on it) |

## 5. Next

- ~~Double and L-shaped rooms (2×1, 1×2, 2×2 grid cells).~~ Built: rooms bigger than their cell, any outline inside 2 × 2 cells ([LEVELS.md](LEVELS.md) §11).
- ~~Room interiors that use height: pits, platforms, multi-level rooms.~~ Built (height, vaults, layers, terraces, pools, dips).
- The thirteen-floor world and Tree-of-Life plans ([LEVELS.md](../design/LEVELS.md) §1–§2).
- Bosses in boss rooms (the hole opens when the boss falls).
- Chests, furnaces and barrels as template markers ([ELEMENTS.md](ELEMENTS.md)); water, lava and fire are built.
- Secret rooms with no door, and hidden pockets in the rock.
- A small in-browser template editor.

## 6. What rooms are built from

Each level names its building palette (`LevelDef.palette`: wall, floor, trim). The shell's walls and ceiling and every `#` are the wall, the ground under the interior is the floor, `b` and `1`–`4` are the trim. Colours and the per-floor table: the art ledger ([../art/DECISIONS.md](../art/DECISIONS.md) §6.5).
