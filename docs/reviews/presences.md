# Review: parts, Presences, agreements, gifts and the idle window

Subject: what projections leave behind (parts, [BESTIARY §5.7](../design/built/projections/PARTS.md)), the non-hostile Presences and their dialogue ([§8.1–8.3](../design/built/presences/README.md)), agreements ([§8.6](../design/not-built/presences/AGREEMENTS.md)), gifts and the Covenant ([§8.7](../design/not-built/presences/GIFTS.md)), and the idle window with its secret trust meter ([§8.5](../design/not-built/presences/REQUESTS.md)). Written before the code, as [`sotano-docs` §4](../../.claude/skills/sotano-docs/SKILL.md) asks. These change the drop path, the pickups, the run state, the frame loop (a pause), input, and the HUD, so they are key decisions.

Parties: **engineer** (part 1, this proposal), **architect** (part 2, a read-only critique against the code), **mediator** (part 3, the ruling: now, later or reject, after fact-checking against the code and for the owner's interests). Part 4 records what was built from the ruling.

---

## 1. Engineer's proposal

### 1.1 What the owner decided (binding, BESTIARY §13)

- **Parts** (§5.7): flesh 30 %, mind 12 %, heart 5 %, essence 2 % per release; named after the pattern; collectible; in the inventory with their name.
- **Presences are non-hostile and immortal.** Positive intentions pass through with a chime; negative ones silence them until you cast positively again. Projections never enter their rooms (§8.1).
- **Presences ask, never order**, and every request can be declined (§8.5, approved).
- **Trust is secret, per run, never shown or named.** It starts at the top; early yeses lower it; honest completions raise it; it never locks progress (§8.5).
- **Parts and agreements** (§8.6): complexity by floor; reasons fit the floor; conditions are things the world does.
- **Open rulings** (§13 a–t) carry their stated defaults; this review lists the ones it uses (§1.6).

### 1.2 Parts: what projections leave

**Data.** `src/content/parts.ts` holds one table: `PARTS: PartDef[]`, each `{ id, source, kind: 'flesh' | 'heart' | 'mind' | 'essence', color, icon }`. Ids are `<source>.<kind>` (`doubt.flesh`). Names and one-line descriptions are i18n keys (`part.<id>.name`, `part.<id>.desc`). Three projections exist today (Doubt, the Inner Critic, Panic), so there are twelve parts. Their names follow §5.7 exactly, including the Inner Critic's part names ("The Lectern's …", since the owner named the parts after the pattern "The Lectern"). **Ruling needed (default below):** the Inner Critic is named "Inner Critic" in the game and "The Lectern" in the bestiary's names; the parts use the bestiary's noun.

**Roll.** A pure function `rollParts(rng, source, rooted = false): PartDef[]` in the same file. For each kind, in the fixed order flesh, mind, heart, essence, `rng.chance(PART_CHANCE[kind])`. A rooted projection (§4.2, not built) rolls the whole table once more. Only projections with parts in the table can yield them.

**Where the roll happens.** `Game.onEnemyDeath` already rolls `spec.drops` on `rng.stream('drops')`. Parts use the same runtime stream, in the same call, right after the existing drops. §5.7 says "the room's RNG fork"; the fork is for *structure* (layout, rosters) and the stream is for *outcomes* (drops), so the same seed gives the same level and a different fight gives different drops ([RNG.md](../architecture/RNG.md)). **Ruling needed (default below).**

**Pickup.** `PickupType` gains `'part'`; `Pickup` gains `part: PartDef | null`; `Pickups.add` takes it as an optional last argument. A part is drawn as a small sprite of its icon, bobbing like a pedestal item (not a key, not a heart). It is collected on touch like a key (`horiz ≤ 0.8`, the same height band), never refused (no cap: parts are not counted).

**Holding.** Parts are not items: they have no effects, so they are not in `Inventory` (which installs effects). `Game.parts: string[]` holds the part ids in pick-up order. It is run state: reset in `newRun`, not in the profile. Each id is looked up in `PARTS`.

**Inventory.** `Hud.renderInventory` adds a second block of tiles after the items, same tile markup (name label always visible, `.tile .lbl`), with `data-part="<id>"`. The selected detail for a part shows its icon, name and description. Counts show `×n` as for items. No new CSS: the tile classes are reused, so `index.html`'s inventory rules are untouched.

**Gallery.** `src/debug/gallery.ts` gains the twelve icons, as the art gate requires (sotano-art §3.2).

### 1.3 Presences: the actors

**Logic, pure, testable** (`src/presences/`):

- `dialogue.ts` — a dialogue tree runner: `start(tree, nodeId)` returns the current line and its choices; `choose(i)` returns the next node. A line has at most two sentences (their i18n keys), at most three lines before a choice, at most three choices (§8.2). A node may be a **request** (§8.5), handled by `requests.ts`.
- `requests.ts` — the idle window (§1.5) and the trust meter (§1.5).
- `agreements.ts` — the agreements of each Presence: the asks (parts and materials), the floor band, the gift tier (§1.4).
- `gifts.ts` — the tier table, the Covenant set and the rewards by trust step (§1.4, §1.5).

**Actors** (`src/entities/presences.ts`): a `Presence` has an id, a room, a position, a model built from its definition (the same box format as enemies, `buildModel`'s structure), and two states: `silent` (negative intentions) and `near` (the player is within 4 blocks, which turns on the eyes and the lantern light; §8.1). Presences are not in `Enemies`: they are never targets, never hostile, never in `enemyAt`, have no health and never release. A negative intention that passes within 2 blocks of one sets `silent` (the cast is not blocked); a positive one clears it.

**Sanctuary.** Projections are never spawned in a Presence's room (`roomSeal` is not emitted there; the room is never sealed). The sanctuary ring of §8.1 is the room itself: a Presence's room has no roster and no seal.

**Placement** (structure, seeded). The Gardener stands in the **start room of floor 0** (the roots' heart room; no template changes in this milestone). The Listener stands in a **quiet room of floor 1** (no roster), chosen from `rng.fork('floor', 1, 'presence')`. If floor 1 has no quiet room, the Listener is placed in the first room of floor 1 with no roster, otherwise not at all (logged). Both are placed when their floor loads (`loadFloor`/`activate`), so a seed always places them the same way.

**Talking.** `T` (new; checked: no binding uses it) opens the dialogue card when the player is within 2.5 blocks of a Presence and not in a request window. The card is a DOM overlay created by `src/game/dialogue.ts`, with its own `<style>` element created at runtime (the same pattern as `src/debug/gallery.ts`), so `index.html` is untouched. **The world keeps running** while the card is open (§8.2: readable while the world keeps running; their rooms are safe). Choices are the keys `1`, `2`, `3`; a line without choices is dismissed by a click (the banner's rule: the click only dismisses it). The pointer stays locked.

**Dialogue text.** Lines are i18n keys in `src/i18n/locales/en.ts` and `es.ts` (sotano-i18n). Nothing is hard-coded. Lines are paraphrases (§8.2), never a real person's words.

### 1.4 Agreements and gifts

**Agreements.** An agreement belongs to one Presence and a floor band. It asks for `asks: Ask[]`, where an `Ask` is `{ part: id }` (a part in the pack) or `{ material: key, n }` (a block held in your hand: `player.hand`). Handing over is done by **talking**: when the agreement is offered and the pack holds the asks, the dialogue shows "hand it over" as a choice; choosing it removes the asks and gives the gift. A Presence never takes anything you do not offer (the choice is yours). Each agreement closes once per run. Materials are taken from `player.hand` only (the cube you carry), never from the world.

**Complexity by floor** (§8.6): floor 0 one plain item; floors 1–2 one part or one common material; 3–4 two items, one hard (obsidian, deepstone); 5–6 three items with a condition (a condition is a `check` the world can answer: `polarity`, `room`). Floors 7–9 are not built (no Presence there yet).

**Gifts.** Gifts are `ItemDef`s with `pools: {}` (they never drop; only Presences give them), `promised: true` (§1.6, default), a quality 1 to 3, and a tier 1–3. Built now: the tier 1 gifts (Gardener's Seed, Stone from the Way, Small Promise), the tier 2 gifts the built Presences give (Listener's Ear), and the Covenant set. The other tier 2 and 3 gifts (Cartographer's Ore, Ledger Page, Trickster's Coin, Mender's Thread, Witness's Mirror) need their Presences (not built): they are defined as data so the tables are complete, and are unreachable until then.

**The Covenant** (§8.7): a closed set of four items, each given by one Presence. **Ruling needed (default below):** the Covenant's Thread is the Mender's Thread (tier 3), and its Page is the Ledger Page (tier 2), because the §8.7 table names the same objects; its Seal (the Witness) and its Light (the Listener, after the last Lesson) are new items. So the set is `menders-thread`, `ledger-page`, `witnesses-seal`, `listeners-light`. Only Presences give them; no pool contains them. Holding all four completes the Covenant. **Set effect (open ruling s, default):** every Presence remembers you in the run: a flag `covenant` in run state, read by the dialogue (a line that says so). No stat.

**The common trait "Promised"** (§8.7, open ruling p, default: as written): every gift and Covenant piece bears a gold seam on its tile (`.tile.promised`, a CSS class added by the HUD: the seam uses the existing gold token) and "promised" in small type in its detail. `Inventory.lose` refuses a promised item (the debug console can still reach it through `lose`: that is a development tool, and it says so). Promised items are kept when items are discarded (none are discardable in the game today).

### 1.5 The idle window and the hidden trust meter

**The window** (`requests.ts`). A request card says what to do (the request's text, and its safe alternative), that the game will wait, and a button or key to begin. On start:

- `windowLen = 30 + 30 × u` seconds (in `[30, 60]`), with `u` drawn from a new runtime stream `'presence'` (added to `RuntimeStream` in `core/rng.ts`). The stream is outcome randomness, so it never shifts the structure of a floor.
- The world **pauses** (`running` is false while a window is open): "the game waits". Time is the real frame time.
- `idle` counts seconds since the last key, mouse button, or look movement (from `Input`). `longestIdle` is its maximum during the window.
- When the window's time is up, or after 60 s at most, the Presence asks *"Have you done it?"* with choices yes and not yet.

**Answers** (§8.5):

- **Yes, and `longestIdle ≥ 30`:** honest completion: the reward of the current trust step (below), trust +1 (max top).
- **Yes, and `longestIdle < 30`:** early yes: trust −1 (min bottom), the reward of the current step as well (the lower one is the trust's effect, not a punishment). The card says the Presence noticed; it never says "you cheated" (§8.5 rule 4).
- **Not yet:** the Presence waits, nothing changes, the request can be asked again later.

**Trust** (`requests.ts`). An integer in `0..3` per run, starting at `3` (the top). It is never drawn, named, logged or shown. The debug readout (English, dev builds only: `import.meta.env.DEV`) may show it.

**Rewards by hidden step** (§8.5 table, with four steps for four rows):

| Trust | Row | Reward |
|---|---|---|
| 3 | Top | The request's full tier (1–3): a gift of that tier, drawn from the tier's gifts by `rng` |
| 2 | One below | The gift one tier lower, never below tier 1 |
| 1 | Two below | A plain gift: one key (a small item of the floor you are on) |
| 0 | Bottom | The smallest gift: Stone from the Way. Never nothing |

Rolls use the runtime stream `'presence'`, so a seed plays the same way when the player answers the same way.

**Requests and their tiers** (§8.5, default): the Gardener asks **Breathe** (tier 1); the Listener asks **Be still** (tier 2); the Elder and the Child are not built. Each request has its alternative on the card: breathe in your head; be still seated or lying down; write it in your head.

**Privacy.** The window stores only the trust number and a request count (run state). Nothing is recorded, sent or read. No camera, no microphone, no network.

### 1.6 Open rulings and the defaults this review uses

| Ruling | Default used | Why |
|---|---|---|
| s. Covenant set effect | Every Presence remembers you in the run (a flag, dialogue only, no stat) | §8.7's own proposal |
| p. "Promised" | As written: gold seam, cannot be lost, label in small type | The owner left it open; it is the only trait that gives the seam a meaning |
| t. Part chances | 30 / 12 / 5 / 2 % as §5.7 | As written |
| t. Reward table | Four trust steps = four rows, as §8.5 | As written; the step count is the table's rows |
| r. Farming room | Not designed: no farming room is built | §13 r is open |
| q. Labels | On inventory tiles only (as now) | §13 q is open |
| e. Names | "Inner Critic" stays the game's name; its parts use the bestiary's noun "Lectern" | Bestiary names are the parts' names (§5.7) |
| — Gardener's room | The start room of floor 0 | No template change needed; the owner's "heart room" is not yet a template (sotano-levels) |
| — Listener's room | A quiet room of floor 1, seeded | §8.3 says "a quiet side emanation of a Tree floor"; the Tree floors are not built (the tree is above the surface, L1–L3), so the Listener goes to floor 1 for now |

### 1.7 What is not built here

- Floors 7–9 agreements, the Elder, the Child, the Cartographer, the Boatman, the Mender, the Witness, the Wanderer, the Trickster and the Echo (their Presences; their gift and agreement data may exist as data).
- The codex (§9).
- Occlusion, the voice (no recorded words).
- Silent-presence animation beyond the light turning off.

---

## 2. Architect's critique

Read-only review of part 1 against BESTIARY §5.7, §8.1–8.7, §13 and the code. Findings, most severe first.

1. **BLOCKER: placement can land in a sealed challenge room.** `RoomInfo` has no quiet flag (`world/floor.ts`). `QUIET_ROOM` is rolled inside `ENEMY_BUDGET.pick`, which returns `[]` for both quiet rooms and budget-starved rooms; treasure, boss, vault, start and challenge rooms also get `[]`. Challenge rooms seal and spawn waves on entry (`updateChallenges`). A Listener there breaks §8.1. The fallback "otherwise not at all" drops the Dweller on a real share of seeds, breaking "there every run". *Change:* the budget returns `{ quiet, enemies }` from the same draws (structure hash unchanged); `RoomInfo` gets `quiet`; candidates are `normal` AND quiet AND ≥ 3 blocks from doors, pedestals, chests and keys; if none qualifies, empty one normal room's roster and bump `GEN_VERSION`; a test checks every sampled seed places one Listener in a normal, empty room. The Gardener stays off the `P` spawn cell. (The fork path `('floor',1,'presence')` does not collide.)
2. **BLOCKER: the idle pause is not wired to the frame loop and survives a reset.** `frame()` sets `running = false`, so `hud.update` shows `#overlay` (the title and controls card), which covers the request card while the pointer stays locked. R (honoured while locked) keeps the window counting through the fade; `newRun` does not reset it, so a gift answered later lands in the new run. Death, Esc (pointer unlock) and Tab (inventory) also leave it counting. *Change:* a `Requests` object owns the window with `cancel()`, called from `newRun`, `showDeath`, inventory open and pointer-lock loss. Cancel means no trust change, no reward, no question. `hud.update` takes a `paused` flag separate from `running`, so the request card shows instead of `#overlay`. The timer runs on wall time and is frozen while unlocked.
3. **MAJOR: an early yes pays the same as an honest yes.** Owner §8.5: an early yes is "a lower reward"; §13 i: "a smaller reward, never nothing". *Change:* an early yes pays the table row of the post-decrement trust (trust − 1, minimum 0); an honest yes pays the current row, then trust + 1.
4. **MAJOR: the window timing breaks the owner's idle rule.** A random 30–60 s timer then a `longestIdle` check punishes an honest player who sat still 20–55 s in a 45 s window (longest idle 25 s, so an early yes). `game.ts` clamps `dt` to 0.05 s, so a hitch slows the window below real time: at 10 fps the 60 s cap lasts 120 s. *Change:* end the window when wall-clock idle reaches 30 s, or at a 60 s wall-clock cap. Ask the question only then. Drop the random length.
5. **MAJOR: dialogue with the world running is unsafe.** `input.ts` sets `fireHeld` and `placePressed` on any locked mousedown; the banner path clears them (`game.ts:1748-1751`), the dialogue must too, or a dismiss click fires an intention or places a block. A "Be still" player can walk out of the sanctuary and die with the question open. The reward floor is undefined if the player changes floor. *Change:* request nodes start only inside the Presence's room, with the world paused; leaving the room, changing floor, dying or R cancels as in finding 2; the reward floor is fixed at request start; the dialogue dismiss click clears the same three flags.
6. **MAJOR: parts roll on the shared `'drops'` stream.** BESTIARY §5.7 and §8.5 say the room's RNG fork. The proposal's claim that room forks are "structure only" is false: RNG.md §4 lists per-room runtime forks, and the clear reward uses one (`game.ts:823`). Rolling four times per death shifts every later drop of the run. A plain per-death room fork repeats the same numbers for every projection of a room. *Change:* `fork('floor', k, 'room', i, 'part', spawnSeq)` per projection, with `spawnSeq` carried from the omen into the `Enemy` at `Enemies.spawn`. Requests use `fork('presence', id, request index)` instead of a new runtime stream.
7. **MAJOR: the gifts cannot be catalogued as written.** `validateItem` requires ids matching `^[a-z][a-z0-9_]*$` (hyphens fail), an `inspiredBy`, a path tag, and non-empty `pools`. Gifts with `pools: {}` would fail and `PLAYABLE_ITEMS` would include them. Tier draws can return a Covenant piece or an unbuilt gift. `ItemPools.pick` falls back to `this.all`. *Change:* a separate `GIFTS` catalogue with its own validator (fields `tier`, `promised`), kept out of `ITEMS` and `PLAYABLE_ITEMS`. Rewards draw only from a per-Presence list that excludes Covenant pieces and unbuilt gifts. Ids use underscores.
8. **MAJOR: parts pickups are invisible and have no collect branch.** `Pickups.add` picks the mesh by type; `'part'` falls to `pedestalItem(null)`, an empty group. `touchPickups` calls `collect(p.type)`, and `collect` sends anything that is not a key or bomb to heal. Non-item pickups also fall with gravity, so "bobs like a pedestal item" is wrong. *Change:* an explicit part branch in `touchPickups` that pushes into `Game.parts`; a sprite from the part's icon; a separate tile branch in `renderInventory` and `itemDetail` (they take `ItemDef` only); the click handler reads `dataset.id`.
9. **MAJOR: the silence rule is not sound as worded.** `Intents` has no Presence hook. "Passes within 2 blocks" samples positions, so a shot that misses by 1.9 blocks and hits a wall 6 blocks away silences the Presence, while a shot that hits a block 2.1 blocks away does not. "A positive one clears it" is undefined. A Listener beside a doorway is silenced by every fight behind it. Projectiles can enter the sanctuary. *Change:* a silence hook in `Intents.update` before the raycast, on the swept segment, both directions symmetric (a positive intention passing within the same radius clears it). Presences stay at least 3 blocks from any doorway. The sanctuary checks projectiles too.
10. **MAJOR: the trust meter would leak to production.** F3 toggles the readout in every build (`hud.ts:94`, printed every second at `202-209`). Nothing gates `game.debug` with `import.meta.env.DEV`. *Change:* add trust to `Game.debug` only under `import.meta.env.DEV`, with a test that the production readout omits it.
11. **MINOR: promised items contradict.** `Inventory.lose` is also the console's `lose` (`main.ts:39`). *Change:* `lose(id, { force })`, only the console passes `force`. `promised` goes on `ItemDef` and the gift validator. The `.tile.promised` rule needs a home: the runtime style element, not `index.html`.
12. **MINOR: smaller gaps.** The plain gift is a key in §1.5, but §8.5 allows "a small item of the floor you are on, or a shard of light". Nothing caps requests per run, so Breathe can be farmed (every yes gives a gift and +1 trust, and promised items cannot be lost). §1.2 says "ruling needed (default below)" for the stream and the pause, but §1.6 has no rows for them. §1.3 cites `loadFloor`, which does not exist (the hooks are `activate` and `carve`). §8.6 says agreements are delivered "in the Presence's room", but §1.3 lets `T` work within 2.5 blocks anywhere. It is unclear whether a silent Presence still offers dialogue or requests.

## 3. Mediator's ruling

Fact-checked against the code. Blocker claims 1, 2, 6, 7, 8 and 9 hold at the cited lines. The proposal's claim that room forks are "structure only" is false (`game.ts:823, 867, 883`; RNG.md §4), and BESTIARY §5.7 binds parts to the room's fork, so finding 6 is owner-binding.

**Scope (the owner's milestone order).** Too large for one change. Ship in two, then three LATER items:
- **Change A = milestones 1 and 2:** parts (table, rolls, pickups, tiles) and labels on all inventory tiles. The 12 part icons must pass the art gate.
- **Change B = milestone 3:** Gardener and Listener, dialogue, sanctuary placement, silence, dialogue dismiss fix.
- **LATER:** 4 agreements; 5 gifts, promised and Covenant; 6 idle window and hidden trust (own review: the riskiest part).

**Verdicts** (NOW = in the named change; LATER = milestones 4–6).

| # | Verdict | Evidence checked | Ruling | Resolution for the engineer |
|---|---|---|---|---|
| 1 | CONFIRMED | `world/floor.ts:68–87` no quiet field; `content/enemies/index.ts:41` quiet returns `[]`; `floor.ts:325` rosters only for normal/path; `game.ts:852–854` challenge seals on entry | NOW (B) | Budget returns `quiet` from draws it already makes (no draw moves). `RoomInfo.quiet`. Candidates: normal, quiet, at least 3 blocks from doors, pedestals, chests, keys, not the P cell. If none is quiet, empty one seeded candidate's roster and bump `GEN_VERSION` (`core/seed.ts:16`). Test: every sampled seed places each Listener in an empty normal room. |
| 2 | CONFIRMED | `hud.ts:147` overlay shows when `!running`; `game.ts:1754, 1797` | LATER (6) | `hud.update` takes `paused`, separate from `running`. A `Requests` object owns the window with `cancel()` on R, death, floor or room change, and inventory. B's dialogue keeps running, so B needs none of this. |
| 3 | CONFIRMED | BESTIARY §8.5 "a lower reward"; §13 i; proposal pays the current row | LATER (6) | Early yes pays the row of trust after the decrement. Honest yes pays the current row, then trust rises. |
| 4 | CONFIRMED | §8.5 "never punish"; §13 k "30–60 s"; `game.ts:1731` clamps dt to 0.05 | LATER (6) | Window ends at 30 s of wall-clock idle (then the question) or 60 s wall-clock cap. No random length. Timer frozen while unlocked. |
| 5 | PARTLY | `input.ts:25–29` any locked mousedown sets `fireHeld`/`placePressed`; `game.ts:1748–1751` clears them for banners only | Dismiss fix NOW (B); rest LATER (6) | Dialogue dismiss clears both flags (B). Request rules (start in the Presence's room, world paused, floor fixed, cancel on leave) go with 6. |
| 6 | CONFIRMED | `game.ts:780–781` parts would share `stream('drops')`; §5.7 "drawn from the room's RNG fork"; `game.ts:823`; RNG.md §4 rows 43–46 | NOW (A) | `fork('floor',k,'room',i,'part',spawnSeq)` per projection; `spawnSeq` carried from the omen (`game.ts:892–895`) into the Enemy. `stream('drops')` untouched. Add the row to RNG.md §4. |
| 7 | CONFIRMED | `items/validate.ts:11` (hyphens fail), `:28, :30, :31`; `items/pool.ts:77–78` fallback to `this.all` | LATER (5) | Gifts in a separate `GIFTS` catalogue with its own validator, underscore ids, never in `ITEMS`, `PLAYABLE_ITEMS` or `ItemPools`. Rewards draw from a per-Presence list excluding Covenant pieces and unbuilt gifts. |
| 8 | CONFIRMED | `entities/pickups.ts:104` `'part'` gets an empty group (`:78`); `:129` non-items fall; `game.ts:639` non-key collect heals | NOW (A) | A part falls and rests like a key (the proposal's "bobs like a pedestal item" is wrong), shows its icon, and is taken in an explicit `touchPickups` branch that pushes into `Game.parts`. Never via `collect`. Inventory gets a part tile branch. |
| 9 | CONFIRMED | `combat/intents.ts:110, :117` enemies and debris use the current point; swept raycast (`:126`) covers blocks only; no Presence in `intents.ts` | NOW (B) | Presence check on the swept segment, radius 2 blocks (tune). Negative silences. Positive lifts silence when cast within 8 blocks (default, see owner check). Presences stand at least 3 blocks from doorways. Enemy shots culled at a Presence room's boundary. |
| 10 | CONFIRMED | `game/hud.ts:94` F3 in every build; `:202–209` readout; no `import.meta.env` in `src` | LATER (6) | Trust enters `Game.debug` only under `import.meta.env.DEV`, with a test that the production readout omits it. |
| 11 | CONFIRMED | `main.ts:39` console calls `inventory.lose`; `items/inventory.ts:76` | LATER (5) | `lose(id, {force})`; only the DEV console passes `force`. `promised` lives on `ItemDef`. |
| 12 | PARTLY | Sub-points below | mixed | See sub-points. |

**Finding 12, sub-points.**
- Plain gift is "one key": CONFIRMED against §8.5 ("a small item of the floor you are on, or a shard of light"). LATER (6), owner's wording.
- No cap on requests: CONFIRMED. LATER (6): one reward per request per run; "not yet" keeps it open.
- §1.6 lacks rows for the stream and the pause; `loadFloor` does not exist (it is `activate`, `game.ts:410`): CONFIRMED. NOW (A), doc fix.
- Hand-over by `T` within 2.5 blocks anywhere, against §8.6 "in the Presence's room": CONFIRMED. LATER (4).
- A silent Presence may still talk: CONFIRMED gap. NOW (B): a silent Presence shows no card and offers no request; on the first negative hit it gives one patient line (§8.1), then silence until a positive cast.

**Engineer error, not in the twelve.** "The Tree floors are not built" is false: `content/levels.ts:47–51` builds circles 1–5 as `tree` floors, and §8.3 says one Listener per Tree floor (1–5). NOW (B): Listeners on floors 1–5, each placed by fix 1. The floor-1-only cut is rejected.

**Rulings on the §1.6 defaults.**
- s, Covenant set effect: accept (milestone 5).
- p, Promised: accept as written; the seam goes in the runtime style element, not `index.html` (milestone 5).
- t, part chances 30/12/5/2: accept.
- t, reward table: four rows accept; the plain gift changes to the owner's wording; the early-yes row follows finding 3.
- r, farming room: accept "not designed". Challenge rooms already drop parts (`game.ts:867–870`), so a parts farm exists; flag to the owner.
- q, labels: accept inventory-only.
- e, names: accept.
- Gardener's room (start room of floor 0): accept. `fights` excludes the start room (`floor.ts:268`) and `roomState` pre-clears empty rooms (`game.ts:403`). Keep the Gardener off the P cell.
- Listener's room: CHANGE, per the engineer error above and fix 1. The "not at all" fallback is rejected.
- Added row: parts roll on the room fork (finding 6), not the stream.

**Owner check.**
- *Never order, immortal, sanctuary (§8.1):* holds. Presences are outside `Enemies` and must stay out of every damage and knockback loop. Enemies are confined to their room's flowfield (`enemies/flowfield.ts:40–44`), so an empty roster keeps them out. But `doors.seal` (`entities/doors.ts:49`) closes every door touching a sealing room, including a door into a Presence room. Rule: a doorway into a Presence room is never closed from outside, or "their rooms never seal" breaks.
- *Window and trust (§8.5, §13 i, k):* fix 4 keeps the 30–60 s span; the random length is the breach. Fix 3 gives early yes a lower reward, never nothing. Trust stays hidden (fix 10). Requests stay optional.
- *New defaults for the owner to confirm:* (a) silence lifts on a positive cast within 8 blocks, reading "until you cast positively again" as nearby; (b) one reward per request per run; (c) challenge rooms as a parts farm (r).

## 4. What was built from the ruling

*(filled after the build)*
