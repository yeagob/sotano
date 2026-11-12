# The easy layout: the Roots after the first page

Up: [the Roots as an evolving tutorial](README.md) · Status: decided (owner, issue #147, 2026-11-12: "from the second lap, that is, from page 2 on, the layout of the Roots does change, one single time; easy to walk through, no complicated obstacles, only simple jumps, no need to place or break any cube to get through"). The templates, the panel rule and the texts below are a proposal.

The Roots have exactly **two layouts** of the same eleven rooms on the same plan. The **teaching layout** (today's rooms, with their exercises) is carved while the current page is 1. The **easy layout** is carved for every run that starts on page 2 or later. It replaces the earlier rule that the Roots' geometry never changes. The reason is plain: from page 2 the player walks the whole ring every run to turn the page, and must not redo eleven exercises each time.

The easy rooms are not empty boxes. Each keeps the trace of its lesson, worked: the wall is down to a low stub with the gap where its plug was, the trenches are filled to shallow dips with a causeway across, the bridge stands, the crates are stacked aside, the seal is a ring of dirt heaps and blast craters. The meaning is *you did the work, and the way is open now* (concepts: **The obstacle is the way**, **Repair**, [CONCEPTS](../../../../lore/CONCEPTS.md)).

## 1. The rule

- **The layout follows the current page, read once at run start.** Current page 1: teaching layout. Current page 2 or more (including a saved page beyond the last page of the book): easy layout. The shown page (browsing) never changes the layout.
- **The switch happens only between runs.** The page advances when a run ends ([PAGES §1](PAGES.md#1-the-current-page)); the next run is carved in the dark of the start fade, so the player never sees a room change shape. A run keeps its layout to its end.
- **One change, for ever.** There is no third layout and no way back short of resetting the save (the console reset of [SAVE](../../progression/SAVE.md) returns to page 1, and so to the teaching layout).
- **The plan does not change.** Same eleven rooms, same grid cells, same doors, same ring, same way down, same Sanctuary chest, same way-down pedestal. Only six rooms change their template.
- **Generation never reads the save.** The game passes the layout to the carving like the mastery level ([§7](#7-how-the-layout-is-chosen)).

## 2. The rooms

The bar every easy room meets: crossed on foot from every door to every other door, and from every tile it holds back to every door, with at most a step or a drop of one block or a jump over a one-tile gap. No trench that needs a block, no wall that needs breaking, no obsidian, nothing that needs a breakthrough, nowhere to fall into that you cannot walk out of.

| Room | Changes? | Easy template | In one glance | Free tiles (teaching → easy) |
|---|---|---|---|---|
| `roots-hall` | no | | Already open: the start | 44 → 44 (the altar's room) |
| `roots-step` | **yes** | `roots-step-easy` | The two walls stand, with the steps you built against them | 34 → 32 |
| `roots-dig` | **yes** | `roots-dig-easy` | The wall broken down to a one-block stub, the plug's gap open | 42 → 42 |
| `roots-mend` | no | | Already open; its dirt blocks are still there to crack and mend | 48 → 48 |
| `roots-pit` | **yes** | `roots-pit-easy` | The trenches filled to shallow dips, a causeway and stepping stones | 12 → 20 |
| `roots-bridge` | **yes** | `roots-bridge-easy` | The bridge built: a causeway three wide, posts at its ends | 8 → 16 |
| `roots-seal` | **yes** | `roots-seal-easy` | No obsidian left: dirt heaps where the walls stood, craters where they burst | 34 → 32 |
| `roots-crates` | **yes** | `roots-crates-easy` | The 28 crates stacked aside in two stores, the aisle clear | 32 → 36 |
| `roots-spring` | no | | Shallow pools you wade (no deep water on floor 0) | 30 → 30 |
| `roots-gift` | no | | Open; the Sanctuary chest under the Boundary | 44 (never used for loot) |
| `roots-door` | no | | Open; the way down and its pedestal | 48 → 48 (the second Sanctuary's room) |

Free tiles are the tiles `freeSpots` offers (a `.` tile outside every door approach band, outside the centre's 3 × 3 and not beside a marker); columns 5 to 7 are never free, so nothing the mastery level lays ever lands in a room's middle aisle.

### The templates, ready to paste into `src/content/rooms.ts`

Each easy template keeps its teaching twin's `lesson` key (so the old tablets keep working until E1 removes them) and carries **no `weight`**: floor 0 is a fixed plan, and with the default weight of 1 the rule "half the fighting templates of a floor need building, by weight" still holds for floor 0's templates (15 of 24). They join `ROOM_TEMPLATES` after `roots-door`.

```ts
  {
    id: 'roots-step-easy', types: ['normal'], floors: [0, 0], lesson: 'step', rows: [
      '.d.........d.',
      '...2.....2...',
      '..121...121..',
      '..121.K.121..',
      '..121...121..',
      '...2.....2...',
      '.d.........d.',
    ],
  },
  {
    id: 'roots-dig-easy', types: ['normal'], floors: [0, 0], lesson: 'intent', rows: [
      '.............',
      '.............',
      '.....d.d.....',
      '......K......',
      '.............',
      'bbbbb...bbbbb',
      '.............',
    ],
  },
  {
    id: 'roots-pit-easy', types: ['normal'], floors: [0, 0], lesson: 'pit', rows: [
      'd.___...___.d',
      '.._._..._._..',
      '..___...___..',
      '......K......',
      '..___...___..',
      '.._._..._._..',
      'd.___...___.d',
    ],
  },
  {
    id: 'roots-bridge-easy', types: ['normal'], floors: [0, 0], lesson: 'bridge', height: 6, rows: [
      '._==_..._==_.',
      '._==_.d._==_.',
      '.b..b...b..b.',
      '......K......',
      '.b..b...b..b.',
      '._==_.d._==_.',
      '._==_..._==_.',
    ],
  },
  {
    id: 'roots-crates-easy', types: ['normal'], floors: [0, 0], lesson: 'kick', rows: [
      '.............',
      '.cc.c...c.cc.',
      '.cc.c...c.cc.',
      '.cc...K...cc.',
      '.cc.c...c.cc.',
      '.cc.c...c.cc.',
      '.............',
    ],
  },
  {
    id: 'roots-seal-easy', types: ['normal'], floors: [0, 0], lesson: 'bomb', height: 6, rows: [
      '.............',
      '.d.d.....d.d.',
      '...__...__...',
      '..___.K.___..',
      '...__...__...',
      '.d.d.....d.d.',
      '.............',
    ],
  },
```

The six were run through the real `validateTemplate` (no errors), `needsBuilding` (false for all six) and `freeSpots` (the counts in the table) on 2026-11-12, and a walk check confirmed that every tile of each room reaches all four door approaches on foot.

`TUTORIAL_CELLS` gains one optional field per cell, the easy template, which takes the cell's `flipZ` and `maxQuality`:

```ts
  a: { template: 'roots-step', easy: 'roots-step-easy' },
  b: { template: 'roots-dig', flipZ: true, easy: 'roots-dig-easy' },
  d: { template: 'roots-pit', easy: 'roots-pit-easy' },
  e: { template: 'roots-bridge', easy: 'roots-bridge-easy' },
  f: { template: 'roots-seal', easy: 'roots-seal-easy' },
  g: { template: 'roots-crates', easy: 'roots-crates-easy' },
```

`S`, `B`, `T`, `c` and `h` keep no `easy` field: the start, the way down, the treasure room, the mend room and the spring are carved the same in both layouts.

### Room by room

- **Step** (doors W, N). The two two-high walls still stand in rows 1 to 5, so the room still reads as "the walls you once could not climb"; against them, on both faces, a three-wide stair of one-high brick (`1`, `2`, `1`): the step you built, kept. Their ends in rows 0 and 6 are gone, which clears both panels (§5) and lets a player walk round instead of over. The east third, where loot can lie, is reached the same way.
- **Dig** (doors S, N; carved flipped like its twin, so the stub stands one block in front of the north wall). The full-height wall and its dirt plug are gone; a one-high brick stub remains on either side of a three-wide gap where the plug was. It is stepped over anywhere or walked through in the middle. The two dirt blocks by the centre stay as rubble.
- **Pit** (doors S, W). Both trenches are filled to a one-deep dip (`_`), climbable everywhere. Row 3 is a causeway of solid ground across both, the way out you built become a path, and one stepping stone stands in each trench in rows 1 and 5.
- **Bridge** (doors E, W). The trenches keep a two-deep core (`=`) so the room still has its depth, with one-deep shoulders (`_`) on both sides of every core tile, so anyone who falls in walks out in two steps. Rows 2 to 4 are a causeway three wide across both trenches, the bridge already built, with a one-high brick post at each end of each span.
- **Seal** (doors E, S). No obsidian at all. Where the two walls stood, a dirt heap in rows 1 and 5 (the dirt of the plugs), and between them a shallow crater (`_`, one deep) where the seal burst, wider in the middle row. Rows 0 and 6 are clear.
- **Crates** (doors N, S). The same 28 one-high crates, all of them still breakable and still the room's crates for the mastery factor ([REWARDS §3](REWARDS.md#3-crates)), stacked in two neat stores in the west and east thirds. The middle aisle (columns 5 to 7), every door approach and rows 0 and 6 are clear. Crates are one block high, so a player can also walk over the stores.

The hall, the mend room, the spring, the treasure room and the way-down room need nothing: none of them asks a block to be placed or broken today.

The art gate applies (`sotano-art`): no new block, texture or colour is introduced (brick trim, dirt, crate, floor and dips already exist on floor 0), but each easy room is captured in `?gallery` or the lab in colour and greyscale and passes the meaning test before it ships.

## 3. What the mastery rewards need

Everything floor 0 lays by mastery ([REWARDS §4–§5](REWARDS.md#4-the-extra-practices-the-altar-and-the-second-sanctuary)) takes free tiles of the eight lesson rooms (`freeByRoom`), and the altar and the second Sanctuary take a free tile of the start room and of the way-down room (`freeIn`). The easy layout changes none of that code; it only changes how many free tiles each lesson room offers.

- **The eight easy lesson rooms offer 256 free tiles** (32 + 42 + 48 + 20 + 16 + 32 + 36 + 30), against 240 today.
- **The table's maximum fits many times over.** Level 100 lays 6 keys, 5 breakthroughs, 11 hearts, 6 free chests and 2 extra-practice pedestals on lesson-room tiles: 30 tiles, at most one free chest and one pedestal per room (6 and 2 of 8 rooms). The smallest easy room (`roots-bridge-easy`) has 16 tiles. The altar has 44 tiles in the start room, the second Sanctuary 48 in the way-down room; both rooms are unchanged.
- **Every free tile is reachable on foot**, because every tile of every easy room reaches every door (§2). A chest, a pedestal or a heart on a free tile never seals anything: chests, pedestals and crates are one block high and stood on like any step.
- **The Sanctuary chest and the way-down pedestal** sit on the `T` markers of `roots-gift` and `roots-door`, which do not change.

## 4. The panels: which wall says what from page 2

### The rule

**A wall never describes an obstacle its room does not hold.** In the easy layout, five slots whose page-1 panel teaches the room's own exercise show a **remembered panel** instead: the same lesson, told as something the player already did, with what it means deeper down. The other seventeen slots are untouched.

Which panel a slot shows, for a page *n* and a layout:

1. Page *n*'s own panel, if *n* is 2 or more and page *n* fills the slot.
2. Otherwise, in the easy layout, the slot's remembered panel, if it has one.
3. Otherwise, page 1's panel.

So the remembered layer sits between page 1 and every later page. Pages 2 to 6 never fill the four lesson-wall slots, so those slots show the remembered panel on every page from 2 on. The step room's south slot is a plate-wall slot: pages 2 to 6 fill it with their own panel, and the remembered panel shows there only on book pages (which leave it out) and when browsing back to page 1. In the teaching layout nothing changes: a missing slot shows page 1's panel, as today.

The remembered slots: `roots-dig` south, `roots-pit` north, `roots-bridge` north, `roots-seal` south (the four lesson walls whose exercise is gone) and `roots-step` south (the page-1 text that tells the player to "set it by the wall, climb"). The step room's lesson wall (north, "Good and bad"), the hall, mend, crates, spring, gift and door lessons all stay true in the easy layout, and stay as they are.

### What changes in the book files

The book files gain one optional top-level object, `easy`, beside `pages`: room key → side → panel, with the same panel schema as a page (`lesson` layout, budgets, key, image, id). Its panel ids are `easy-<room>-<side>`. Validation: only rooms and sides that exist; the same slots in both languages; every panel passes the rules of a tutorial page panel. `panelAt` takes the layout as a fifth argument (default teaching). The images are page 1's own captures: they show how the work was done, which is what a memory shows. Nothing else in the files changes; the existing texts of pages 1 to 9 stay word for word.

The proposed slots (English, `book.en.json`):

```json
"easy": {
  "roots-step": { "south": { "id": "easy-step-s", "layout": "lesson", "title": "Move and jump", "text": "{jump} jumps one block, never two. The steps you built are still here; deeper down, build your own.", "key": "move", "image": "lesson/step" } },
  "roots-dig": { "south": { "id": "easy-dig-s", "layout": "lesson", "title": "Broken through", "text": "This wall once stood in your way. You broke it, and the way stays open. Bad intentions break; good ones mend.", "key": "cast", "image": "lesson/dig" } },
  "roots-pit": { "north": { "id": "easy-pit-n", "layout": "lesson", "title": "The way out", "text": "You built your way out of here once, and the roots kept your steps. Deeper down: carry a block, set it, step up.", "key": "place", "image": "lesson/pit" } },
  "roots-bridge": { "north": { "id": "easy-bridge-n", "layout": "lesson", "title": "Your bridge", "text": "Your bridge still stands. Deeper down, stand at the edge, place a block in front of you, step on, and again.", "key": "place", "image": "lesson/bridge" } },
  "roots-seal": { "south": { "id": "easy-seal-s", "layout": "lesson", "title": "Breakthroughs", "text": "The obsidian seal is gone. Deeper down, obsidian is too hard for intentions: drop a breakthrough with bad ones.", "key": "bomb", "image": "lesson/breakthrough" } }
}
```

Spanish (`book.es.json`):

```json
"easy": {
  "roots-step": { "south": { "id": "easy-step-s", "layout": "lesson", "title": "Muévete y salta", "text": "{jump}: saltas un bloque, nunca dos. Tus escalones siguen aquí; más abajo, constrúyete los tuyos.", "key": "move", "image": "lesson/step" } },
  "roots-dig": { "south": { "id": "easy-dig-s", "layout": "lesson", "title": "Paso abierto", "text": "Este muro te cortaba el paso. Lo rompiste, y el paso sigue abierto. Las intenciones malas rompen; las buenas reparan.", "key": "cast", "image": "lesson/dig" } },
  "roots-pit": { "north": { "id": "easy-pit-n", "layout": "lesson", "title": "La salida", "text": "Una vez saliste de aquí construyendo, y las raíces guardaron tus pasos. Más abajo: lleva un bloque, ponlo y súbete.", "key": "place", "image": "lesson/pit" } },
  "roots-bridge": { "north": { "id": "easy-bridge-n", "layout": "lesson", "title": "Tu puente", "text": "Tu puente sigue en pie. Más abajo, ponte en el borde, coloca un bloque delante, súbete y vuelve a empezar.", "key": "place", "image": "lesson/bridge" } },
  "roots-seal": { "south": { "id": "easy-seal-s", "layout": "lesson", "title": "Avances", "text": "El sello de obsidiana ya no está. Más abajo, la obsidiana es demasiado dura: suelta un avance con intenciones malas.", "key": "bomb", "image": "lesson/breakthrough" } }
}
```

Every text is within its budget with the longest label of `{jump}` ("The arrow", "La flecha"): titles at most 15 characters, texts 100 to 117 of 120. Each line rests on the easy template it hangs in: the step room keeps its stairs; the dig wall is a stub with a gap; the pit's trenches are shallow with a causeway; the bridge's causeway stands; the seal room holds no obsidian. The deeper-down halves rest on the same facts page 1 cites (`place` builds, obsidian resists intentions, a breakthrough dropped while bad breaks it).

### The secret panel behind the dig wall

On page 1 the north panel of `roots-dig` stands behind a full-height wall and is read only after breaking through ("Behind the wall"). In the easy layout the wall is a one-block stub, and the panel is in plain view from the room (from eye height a one-high block one tile from the wall hides nothing of a panel whose bottom is at 0.95 blocks, except from more than twelve blocks away, farther than the room is long). That is intended: what the wall hid is open to the player who broke it. On pages 2 to 6 the slot shows that page's plate, which in the teaching design would have hung, unread, behind the wall; on book pages, and when browsing back to page 1, it shows "Behind the wall" in the open. Its text needs no change: "Every wall was once built to keep you safe. You can always break one, or build a better one" reads as well beside a broken wall as behind a whole one.

## 5. Where the panels hang in the easy layout

Every panel hangs at the **standard mount** in every room: the north panel on the north wall, west of the door, centre (`hx + 2.0`, `y0 + 2.0`, `hz + 0.02`), facing south; the south panel on the south wall, east of the door, centre (`hx + 11.0`, `y0 + 2.0`, `hz + 6.98`), facing north; 3.7 × 2.1 blocks. The three exceptions of [PANELS §6](PANELS.md#6-where-each-panel-hangs) belong to the teaching layout only.

| Room | North panel | South panel | Why it is clear |
|---|---|---|---|
| `roots-hall` | standard | standard | unchanged |
| `roots-step` | standard | standard | the walls stop at rows 1 and 5; nothing stands in row 0 under the north panel (columns 0 to 3) or row 6 under the south panel (columns 9 to 12) but a one-high dirt corner |
| `roots-dig` | standard | standard | the stub one block in front of the north panel is one block high (§4) |
| `roots-mend` | standard | standard | unchanged |
| `roots-pit` | standard | standard | dips under a panel hide nothing |
| `roots-bridge` | standard | standard | trenches under a panel hide nothing |
| `roots-seal` | standard | standard | rows 0 and 6 are clear |
| `roots-crates` | standard | standard | rows 0 and 6 are clear |
| `roots-spring` | standard | standard | unchanged |
| `roots-gift` | standard | standard | unchanged |
| `roots-door` | standard | standard | unchanged |

A one-high block in row 0 or row 6 under a panel (the dirt corners of the hall, the step and the pit) covers only the slab's bottom 0.05 blocks, inside its border; this is as today. The lesson wall of each room ([PANELS §7](PANELS.md#7-which-wall-holds-the-lesson)) is the same in both layouts, because the doors are the same.

## 6. Browsing in the easy layout

Walking a lap in reverse shows earlier pages, as in [PAGES §2](PAGES.md#2-browsing-laps-of-the-ring). Browsing changes only panels and the page stone, never the layout: a player on page 3 who browses back to page 1 stays in the easy rooms and reads page 1's panels in them, **except the five remembered slots, which keep their remembered panel** (rule of §4: the layer sits under every page from 2 and over page 1). This is intended. It keeps the one promise the walls make, that they tell the truth about the room they hang in, and it means the remembered panel of a slot never turns while the player browses, since every page shows it the same way.

## 7. How the layout is chosen

- **Carve option:** `easyRoots?: boolean` in `CarveOptions` (`src/world/floor.ts`), default `false`. Read by floor 0 only (`lv.tutorial`); every other floor ignores it. `fitTemplates` takes it as a last parameter (default `false`) and, on the tutorial floor, uses the cell's `easy` template when it is true and the cell has one, with the cell's own `flipZ`.
- **Who passes it:** the game, at run start, from the save record it already holds: `easyRoots: record.roots.page >= 2` (the current page, never the shown page). The sandbox and the lab use their in-memory record, so they carve the teaching layout unless a scenario sets a page; a scenario may set it directly.
- **Determinism:** floor 0 is a pure function of the seed, the mastery level and the layout. The option adds no random decision: the same forks are drawn in the same order (the six templates have no decor slots, and their rooms draw the same mood roll as before, which on floor 0 can never be `reinforced`), and the plan, the doors, the reservation (`pedestalSlots`) and the hole are identical. Only the free tiles differ, so the same seed places its loose loot on different tiles in the two layouts.
- **Floors 1 to 9, the sky and the surface** are identical for both layouts with the same seed: nothing outside floor 0's band reads the option, and the band's rock between floors is not touched.
- **`GEN_VERSION`: no bump.** With the option off, floor 0 is carved byte for byte as before, and the option is not a random decision. As with the mastery level, a seed code alone no longer fixes floor 0: it replays exactly only for a player with the same current page (1 or more) and mastery ([open question 22](OPEN-QUESTIONS.md)).
- **The book keys rooms by their plan cell.** In the easy layout `RoomInfo.template` is the easy template id, while the book, the sight sets and `RootsBook` name rooms by the teaching template id of their cell. Everything that keys the Roots by room must read the cell (`TUTORIAL_CELLS[TUTORIAL_LAYOUT[gz][gx]].template`), never `RoomInfo.template`. `src/content/rooms.ts` exports that lookup as one helper (`rootsRoomKey(gx, gz)`) so nobody writes it twice.

## 8. The page advance still holds

The page advances when a run ends after the player entered every room of the Roots ([PAGES §1](PAGES.md#1-the-current-page)). In the easy layout this is a walk: every room is reachable from the start room on foot, forward or in reverse, with no block in hand and no intention thrown, and the way-down room is the room every descent passes through. One lap of the ring and a step into the way-down room is all a run needs. The rule makes more sense now than before: it asks the player to walk through the place they learned in, not to redo it. The sight sets ([PAGES §3](PAGES.md#3-panels-change-only-out-of-sight)) are computed from the plan and its doors, which are the same in both layouts, so they do not change; they already assumed every line of doors open.

## 9. Tests the implementation adds

1. **Every easy template passes the validator** (`validateTemplate` returns nothing), **needs no building** (`needsBuilding` is false, and `needsBuildingIn` is false with its real doors and flips), and **strands no tile**: from every tile a player can stand on, every door approach of the room is reachable on foot. `walkParts` cannot prove this alone, because its flood joins a pit to the part above it even when the pit has no way out; the test needs a reachability from each tile (or a reverse flood from each door), which `src/content/rooms.ts` exports for it.
2. **A walker with no blocks crosses the easy Roots.** With `tests/helpers/walker.ts` (`walkRoute`, the real player's walk and jump, no air jumps, base stats) over the solid blocks of a floor 0 carved with `easyRoots: true`: from the spawn, through every doorway of the ring in forward order back into the start room, then into the way-down room to the tile beside its pedestal; then the same lap in reverse. Waypoints are door middles and room centres, plus one on each stair top in the step room. The walker never places or breaks anything. **Control:** the same forward route fails in the teaching layout (in the step room), so the test can tell the two apart.
3. **The teaching layout is byte-identical to today's** when the option is off or absent: for seeds 1 and `0xBEEF` at mastery 0 and 22, the shape of floor 0 (rooms, templates, flips, moods, doors, pedestals, chests, keys, bombs, hearts, practices, altar, hole, spawn) and the hash of its band's voxels equal values recorded from the code before this change, pinned in the test.
4. **Floors 1 to 9 are identical for both layouts:** with the same seed, at mastery 0 and 100, the shape of every floor from 1 to 9 and the hash of the world outside floor 0's band are the same with `easyRoots` false and true.
5. **The rewards fit:** at mastery 100 in the easy layout, for several seeds, floor 0's counts equal `rootsRewards(100)` exactly (nothing dropped for lack of a tile), the altar and the second Sanctuary are laid, at most one free chest and one pedestal per room, nothing on an approach, the centre or the shaft, and the sum of `freeSpots` over the eight easy lesson rooms is at least the table's largest total.
6. **The easy layout is the right rooms:** carved easy, the six changed cells carry their easy template and the five others their teaching one; the easy crates room holds exactly 28 crates; `rootsRoomKey` of every room equals its teaching template id in both layouts; the existing half-need-building rule (`tests/world.test.ts`) still passes.

## Open questions

Listed in [OPEN-QUESTIONS](OPEN-QUESTIONS.md), questions 19 to 25, each with the default this document uses: which rooms change (six); the remembered panels and their wording; reusing page 1's images; browsing to page 1 keeps the remembered panels; the bridge keeps its deep cores; seed codes do not carry the layout and `GEN_VERSION` is not bumped; the "half the rooms need building" rule gives way on floor 0 from page 2.
