# Book data: the two JSON files

Up: [the Roots as an evolving tutorial](README.md) · Status: decided (owner, issue #147, decision 6: one JSON file per language, same structure; the owner will add the book by hand). The files exist: [`src/content/book/book.en.json`](../../../../../src/content/book/book.en.json) and [`src/content/book/book.es.json`](../../../../../src/content/book/book.es.json). Nothing reads them yet.

## 1. Shape

```json
{
  "version": 1,
  "language": "en",
  "pages": [
    {
      "id": "tutorial-1",
      "kind": "tutorial",
      "panels": {
        "roots-hall": {
          "north": { "id": "1-hall-n", "layout": "lesson", "title": "The roots", "text": "…", "image": "lesson/blocks", "key": "cast" },
          "south": { "id": "1-hall-s", "layout": "plate", "title": "Doubt", "subtitle": "A projection", "text": "…", "image": "bestiary/doubt", "note": "…" }
        }
      }
    },
    { "id": "book-1", "kind": "book", "panels": { "roots-hall": { "south": { "layout": "prose", "text": "…" } } } }
  ]
}
```

## 2. Fields

| Field | Where | Type | Rule |
|---|---|---|---|
| `version` | top | integer | The schema version. `1` today. A reader refuses any other value |
| `language` | top | `"en"` or `"es"` | Must match the file name (`book.<language>.json`) |
| `pages` | top | array, at least 1 | The page number is the position: the first entry is page 1 |
| `id` | page | string, `^[a-z0-9-]+$` | Unique in the file; the same id at the same position in every language. Stable: tests and the gallery refer to pages by id |
| `kind` | page | `"tutorial"` or `"book"` | Page 1 is `tutorial`. Every `tutorial` page comes before every `book` page. The page stone shows a number only on `book` pages |
| `panels` | page | object | Keys are room keys (below); each value has `north`, `south` or both. Page 1 must fill all 22 slots. A later page may leave any slot out: that slot shows page 1's panel |
| `id` | panel | string, `<page>-<room>-<side>` | Required on every panel. The page number (its position in `pages`, from 1), the room key without its `roots-` prefix, and `n` for north or `s` for south: `1-hall-n`, `3-pit-s`, `7-gift-n`. It must match the panel's position, be unique in the file, and be identical in both languages. The renderer draws it very small, like a mason's mark ([PANELS §10](PANELS.md#10-the-panel-id-the-masons-mark)); `panelById(book, id)` finds the panel. Renumbering (a page inserted before others) renumbers the ids: the validator names every id that is out of place |
| `layout` | panel | `"lesson"`, `"plate"`, `"prose"`, `"quote"` | Decides which other fields are allowed. `quote` only on `book` pages |
| `title` | lesson, plate | string | Required. A plate's title is the name of what it shows, in that language's established name |
| `subtitle` | plate | string | Required. What kind of thing it is ("A projection", "A boss · floors 1–2") |
| `text` | lesson, plate, prose, quote | string | Required. May hold `{action}` placeholders (lesson and plate only). In a quote: the quotation (section 2b) |
| `image` | lesson, plate | image id | Required (section 4) |
| `key` | lesson | action | Optional. Draws that control as a key cap with its verb (section 5) |
| `note` | plate | string | Optional. One line under the text: a number, a drop, a hint |
| `author` | quote | string | Required. The author's name as printed |
| `work` | quote | string | Required. The title of the work, in its original language |
| `publisher` | quote | string | Optional |
| `year` | quote | integer | Optional. The year of the edition quoted |
| `lang` | quote | `"en"` or `"es"` | Required. The quotation's original language |

No other field is allowed. Every panel has an `id` (above). Prose has no title, image or key, and never draws its own page number. A quote has no title, image, key or page number.

## 2b. Quotations

- A quotation is not the game's own text. In the file whose `language` equals the quote's `lang`, `text` is the quotation exactly as printed. In the other file, `text` is our faithful translation, and the panel adds the note "Our translation" / "Traducción nuestra" by itself (the `book.quote.translated` message key; nothing in the data says it).
- `author`, `work`, `publisher`, `year` and `lang` are identical in both files.
- Every quotation's source has its row in `docs/lore/SOURCES.md` before it enters the book (`sotano-lore`).
- **Where a quote goes: the end of the page.** A page is read along the forward ring: it begins in the start room (the prose on `roots-hall` → `south`) and ends in the treasure room, the last room before the ring closes. The quote slot is **`roots-gift` → `north`**, the plate wall of the treasure room. On tutorial pages that slot keeps the Sanctuary panel; on a book page it may hold a quote, or nothing (then page 1's Sanctuary panel shows). Any book page may carry one quote or none; the validator allows `quote` in any slot of a book page, and the owner's convention is this one.

**Room keys** are the template ids of the eleven rooms: `roots-hall`, `roots-step`, `roots-dig`, `roots-mend`, `roots-pit`, `roots-bridge`, `roots-seal`, `roots-crates`, `roots-spring`, `roots-gift`, `roots-door`. **Sides** are `north` and `south`.

## 3. Placeholders

`{action}` in a `text` is replaced by the label of that control on the device in use, as today's tablets do (`controlParams` in `src/input/labels.ts`, then sentence case). Allowed names: the actions of `LESSON_CONTROLS`, plus `drink`, which the build adds to that list. The tutorial pages use only `{jump}`: everything else is shown by the key cap, which keeps the sentences short on every device (the touch labels are long sentences).

## 4. Images

An image is an id `namespace/name`, never a path. Three namespaces:

| Namespace | What it is | Where the pixels come from |
|---|---|---|
| `bestiary/<entity id>` | A portrait of a creature, projection, boss or presence; the name after the slash is the entity's id in `src/content` | The bestiary capture script of issue #177 (`scripts/bestiary-capture.mjs`, PR #181, not merged yet). Its documentation screenshots show the HUD, the hand and small creatures very small, so they are not used as they are: a **portrait mode** of the same script (no HUD, no hand, the camera close to the subject, a square crop) writes `public/book/bestiary/<id>.webp` for the game ([IMPLEMENTATION-PLAN](IMPLEMENTATION-PLAN.md), package B5) |
| `lesson/<name>` | A screenshot of a mechanic, captured the same way: a sandbox scenario with a fixed seed and a fixed camera | New captures, written by the same build script to `public/book/lesson/<name>.webp` |
| `icon/item/<item id>`, `icon/potion/<potion id>`, `icon/heart/<kind>` | An in-game icon, drawn by the game's own icon code (practice icons, flask icons, heart art), scaled by whole multiples | Nothing to capture: existing art |

The validator checks that every id resolves: a bestiary id is an entity with a capture, a lesson id is in the lesson manifest (`src/content/book/images.ts`, a list the build script and the validator share), an item id is in the item list, a potion id in `POTION_IDS`, a heart kind in the heart kinds.

### How the pictures are taken

| Set | Command | Output | Size and budget |
|---|---|---|---|
| Portraits (19) | `npm run bestiary -- --portrait [ids]` (`scripts/bestiary-capture.mjs`) | `public/book/bestiary/<id>.webp` | 512 × 512 WebP at quality 0.9; each under 60 KB (largest about 41 KB) |
| Lessons (22 taken) | `npm run book:captures [names]` (`scripts/book-captures.mjs`) | `public/book/lesson/<name>.webp` | 960 × 540 WebP; the crops `counters` and `polarity` are 3× their on-screen size; the quality steps down (0.9, 0.8, 0.7, 0.6, 0.5) only until a file is under 60 KB |

- **Portrait mode.** No HUD and no held hand. The subject stands on a one-block stone plinth in an 11 × 9 room (a boss stands on the floor in a 21 × 15 room) and turns to face the camera. The camera uses a 40° lens placed so the subject's drawn extent fills 72 per cent of the frame, levelled on its centre. The shell is `palestone`. `overwhelm` is framed from its other side (`PORTRAIT_SIDE`).
- **Lessons.** Each lesson is one staged room, one lab script when something must be in flight or burn (thrown cubes, bombs, damage, lava and water), one prep step when the game needs a state set by hand (a missile, a warmth, a grown creature, the toll window), and one eye point and target. The HUD and the hand are hidden unless the lesson is about them (`counters`, `polarity`, the toll windows, the Sanctuary). Every capture runs in English. The scenes are inline in the script rather than in `src/sandbox/scenarios/`: a scenario file joins `npm run sandbox -- --check`, which needs a saved report for each file, and these pictures do not need one.
- **Fixed inputs.** Every capture uses the sandbox's fixed seed and fixed step, so a re-run gives the same pictures.
- **Pending (11), not faked.** `ring` (a minimap of the whole Roots needs a real run), `drink` (the sandbox hand holds blocks and parts, not potions), `alembic`, `kitchen` and `recipe` (the floor generator places the labs), `paths` and `state` (the sandbox does not open the inventory screen), `white-seed` (no coloured explosion hook), `boss-room` (the lit pedestal needs a defeated boss), `parts` (no part pickup hook) and `chests` (the keyhole chest is placed by the floor generator). `tests/book-images.test.ts` lists the same ids, and a pending id must have no file.
- **Content gaps seen in the captures.** `resistance`, `inertia`, `insatiable` and `overwhelm` draw as dark husk bodies with eyes; `overwhelm` is built from Doubt's husk palette (`src/content/bosses/overwhelm.ts`). Their portraits are faithful captures of what the game draws today, and the boss models need their own art. The `convert` lesson shows a projection at warmth 0.95 as a red-brown body rather than gold; the warm glow needs checking against the ledger.

### Every image the nine pages use

Bestiary (19; each entity has a documentation screenshot in PR #181, and each needs a **new portrait capture** in the portrait mode): `doubt`, `critic`, `panic`, `resistance`, `inertia`, `insatiable`, `overwhelm`, `wonder`, `rootling`, `mossling`, `chirper`, `delver`, `bubbler`, `ferryback`, `leafling`, `star-mite`, `inkmite`, `cinderwalker`, `listener`.

Icons (13, existing art, nothing to capture): `icon/potion/plain-tonic`, `restoring-draught`, `spring-tonic`, `clear-infusion`, `questioning-tincture`, `meal-hearty`; `icon/item/grounding`, `gratitude`, `boxbreathing`, `selfcompassion`; `icon/heart/stone`, `star`, `blood`. The flask icons are still placeholders (one bottle, a liquid colour per potion) until the potion art pass; the plates inherit them.

Lesson screenshots (33, **all new captures**; 22 are taken, the 11 marked pending below are not, see [how the pictures are taken](#how-the-pictures-are-taken)):

| Id | What the capture shows | Where to stage it |
|---|---|---|
| `blocks` | A wall of mixed blocks in the start room, a good intention in flight | `roots-hall` |
| `polarity` | The same block hit by a good and a bad intention, the HUD polarity mark visible | `roots-step` |
| `step` | A placed dirt block against the two-high wall, the player on it | `roots-step` |
| `behind-wall` | The gap behind the dig wall, seen through the broken plug | `roots-dig` |
| `dig` | The dirt plug cracked by bad intentions | `roots-dig` |
| `mend` | A cracked dirt block closing under a good intention | `roots-mend` |
| `pit` | A stair of placed blocks up out of a trench | `roots-pit` |
| `bridge` | A half-built bridge across a trench | `roots-bridge` |
| `counters` | The HUD key and breakthrough counters, close | any roots room |
| `breakthrough` | A black breakthrough at the foot of an obsidian wall | `roots-seal` |
| `kick` | A loose cube in flight after a kick | `roots-crates` |
| `crates` | A broken crate and the key it held | `roots-crates` |
| `lava` | Water meeting lava, the steam and the obsidian | a sandbox room on floor 3 |
| `water` | The player swimming up in deep water | a sandbox room on floor 3 |
| `sanctuary` | The Sanctuary's home screen | the Sanctuary (`S.sanctuary()`) |
| `practice` | A practice floating over a pedestal | `roots-door` |
| `ring` | The HUD map of the Roots with the ring of rooms | any roots room |
| `way-down` | The toll window over the open way down | `roots-door` |
| `drink` | A flask on top of the hand, the drink button on touch | a sandbox room |
| `alembic` | The alembic with a full bulb | a laboratory room, floor 2 |
| `kitchen` | The kitchen with a part in front of it | a kitchen room, floor 1 |
| `convert` | A projection turning gold as it comes to the player's side | a sandbox room, floor 1 |
| `parts` | Four parts on the floor, one of each kind | a sandbox room, floor 1 |
| `boss-room` | A boss's pedestal lit after the fight | a boss room, floor 1 |
| `paths` | The practices tab with path chips | the inventory screen |
| `state` | The banner of a state of being | the inventory screen or its banner |
| `recipe` | The alembic and the potion it made | a laboratory room, floor 2 |
| `creatures` | A creature hiding into the blocks | `roots-mend` |
| `white-seed` | A white breakthrough's love explosion over lava turning to water | a sandbox room, floor 3 |
| `throw` | A thrown obsidian cube hitting a projection | a sandbox room, floor 1 |
| `chests` | A locked chest with two keyholes next to a brass-trimmed chest | a sandbox room, floor 2 |
| `toll` | The toll window on floor 3 | a boss room, floor 3 |
| `grow` | A Rootling at three times its size | `roots-bridge` |

## 5. Key caps

`key` is one of `move`, `jump`, `cast`, `polarity`, `place`, `throw`, `bomb`, `drink`, `inventory`. The cap's label and verb are new message keys in `src/i18n/locales/` (English and Spanish), at most 14 characters each:

| Action | Keyboard (EN / ES) | Gamepad | Touch (EN / ES) | Verb (EN / ES) |
|---|---|---|---|---|
| `move` | WASD / WASD | L stick / Stick izq. | Left thumb / Pulgar izq. | walk / andar |
| `jump` | Space / Espacio | A | Arrow / Flecha | jump / saltar |
| `cast` | Left click / Clic izq. | RT | Light bead / Cuenta de luz | cast / lanzar |
| `polarity` | F | LB | (half-turn glyph) 180° | switch / cambiar |
| `place` | Right click / Clic der. | LT | Tap a block / Toca un bloque | place / colocar |
| `throw` | Q | B | Flying block / Bloque volador | throw / tirar |
| `bomb` | E | RB | Seed / Semilla | drop a seed / soltar avance |
| `drink` | G | X | Flask / Frasco | drink / beber |
| `inventory` | Tab | Y | Practices / Prácticas | your practices / tus prácticas |

Keys: `keycap.<action>.key`, `keycap.<action>.pad`, `keycap.<action>.touch`, `keycap.<action>.verb`. The gamepad labels are the same in both languages. No control is added or changed: these are labels of the existing bindings (`sotano-controls` needs no new mapping).

## 6. Validation

The book is checked at build time by a test and again when the game loads it. Any error fails clearly, with every error listed; the game never falls back silently to another page, slot or language.

1. The file parses; `version` is 1; `language` matches the file name; no unknown top-level field.
2. `pages` has at least one page; page 1 is `tutorial` and fills all 22 slots; no `tutorial` page follows a `book` page.
3. Page ids are unique and match `^[a-z0-9-]+$`.
4. Every room key is one of the eleven; every side is `north` or `south`; every panel has a known `layout`, all its required fields (`id` included), and no field its layout does not allow. Every panel's `id` is the id of its position (`page-room-side`, section 2) and is unique in the file.
5. Every string is non-empty (a quote's `author` and `work` included), has no markup (`<`, `>`), no leading or trailing space and no double space.
6. Every `{placeholder}` names an allowed action, and appears only in `text` of a lesson or plate.
7. Every `image` resolves (section 4). Every `key` is an allowed action. A `quote` sits only on a `book` page; its `lang` is a shipped language; its `year`, if given, is an integer from 1000 to the current year.
8. Every field is within its character budget ([PANELS §5](PANELS.md#5-character-budgets)), counting each placeholder at its longest label in that language. A quote's source line ("Work · Publisher, Year", as drawn) is within 60 characters, and the translation note `book.quote.translated` exists in both languages within 24.
9. **The languages match**: the same number of pages; at each position the same `id` and `kind`; the same slots; in each slot the same `layout`, `id`, `image`, `key` and the same set of fields, and for a quote the same `author`, `work`, `publisher`, `year` and `lang`. Only the words differ.
10. The two key-cap labels and the verb exist for every action used, in every language (the i18n test covers the message keys).

## 7. How the game reads it

- The panel of a slot on page *n* is page *n*'s panel if it has one, otherwise page 1's.
- The book of the player's language is used; switching language redraws every panel at once from the other file (the same page, the same slots).
- The number of pages is the length of `pages`; both files have the same length by rule 9.
- A panel is found by its id with `panelById(book, id)` (`src/content/book/index.ts`), in either language's book; `panelIdOf(page, room, side)` gives the id a position must carry.

## 8. Writing a new page by hand (for the owner)

Add an entry at the end of `pages` in **both** files, with the same `id` and `kind: "book"`, and one or more slots with `layout: "prose"` and a `text` of at most 320 characters. Give each panel its id: the page number, the room without `roots-`, and `n` or `s` (page 10's prose on `roots-hall` south is `10-hall-s`). Run `npm test`: the book test lists anything out of place. The start room's south slot (`roots-hall` → `south`) is the one the first book pages use; any slot may be used. A quotation goes in `roots-gift` → `north` with `layout: "quote"` (section 2b), the original text in the file of its language, our translation in the other, and its source added to `docs/lore/SOURCES.md`.
