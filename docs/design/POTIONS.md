# Potions: preparations of what patterns leave (proposal)

Status: **proposal. The owner approved its brewing rules (2026-10-28, §7); nothing is built.** Answers the owner's request (2026-10-28): *"Review the documentation about the use of the parts of the entities, for shops, machines or workbenches. It would be interesting to have a potion system based on them. Propose one."* It also gives one answer to DESIGN §13 item 8 ("items and parts need a purpose").

Read with: [BESTIARY §5.7](BESTIARY.md) (parts), §8.6 (agreements), §8.7 (gifts, the promised trait), §8.8 (the Compost); [STATIONS §4.4](STATIONS.md) (the laboratory and its alembic), §11 (the `StationDef` sketch); [ITEMS.md](../architecture/ITEMS.md); [RNG.md](../architecture/RNG.md); `src/content/parts.ts`.

---

## 0. What the review found

| Where | Today |
|---|---|
| Parts (`src/content/parts.ts`) | **152 parts from 38 projection files** (four kinds each; 12 have hand-drawn icons, 140 a generated fallback), rolled per release at 30 / 12 / 5 / 2 % on `fork('floor', k, 'room', i, 'part', seq)`. BESTIARY §5.7 still says "twelve parts"; the status line is stale. |
| How parts are held | In the **hand**, like a block (`player.hand` holds a material number or a `PartDef`). Placed as a pickup with right click, thrown with Q. Never in the inventory. Ground pickups do not expire. |
| What parts are for | Nothing yet. Agreements (§8.6) and the Compost (§8.8) are designed, not built. DESIGN §13.8 asks for a use; DESIGN §4 also says "No coins, no shop". |
| Stations | All brainstorm (STATIONS.md). The alembic (§4.4) already reads "water + husk → essence, drink it for a short state". STATIONS uses `F` to eat, but `F` is now the polarity toggle. |
| Supply | Parts are not scarce: challenge rooms (LEVELS §4) give endless waves, and every release rolls. **So potions must be scarce by the station, not by the parts.** |
| Missing hooks | `EnemyDef` has no `path` field (the path lives only in the BESTIARY tables), and no event exposes **warmth**. Two recipes and one effect below need both. |

---

## 1. The fiction

A released pattern leaves **captive matter**: the light it held shut, still in the shape the pattern gave it (*Panic's captive ember*, *Doubt's question*). Releasing the pattern frees you from it, but the matter keeps its shape, and you carry it. A **potion** is a preparation of that matter: in the alembic, separating what matters from what clouds it (STATIONS §4.4), the part is moved along its own pole (the Kybalion's mental transmutation, CONCEPTS) until it gives back the quality the pattern was guarding. Panic's ember becomes steady fire; Doubt's question becomes a question that opens. The four kinds are four depths of the same pattern: **flesh** is its matter, **mind** its thought, **heart** its feeling, and **essence** what it was protecting, which is why every essence is already named for the released pole (*Doubt's upright light*, *Craving's stillness*). Only a **gold intention** prepares a potion, because preparation is care. Drinking it is integration: what blocked you, prepared with attention, is taken back in. A potion is a **short state**, never medicine: no text calls it a cure, a treatment or a dose of anything real.

---

## 2. Where it happens: the Alembic, in the laboratory

**One station, reused from STATIONS §4.4: the Alembic.** No shop, no currency: DESIGN §4's "no coins, no shop" holds. It is a block entity (STATIONS tier T2): a brick hearth base, a glass **bulb** above it with three marks on the glass, a copper coil, and a stand for the receiving **flask**.

**Where.** The Alembic stands in a **laboratory**, a quiet side room (doors open, no seal, no projections), one per great zone, on the zone floor that does **not** hold its Compost, so you harvest on one floor and brew on the other:

| Zone (BESTIARY §4.1) | Compost (§8.8) | Laboratory |
|---|---|---|
| I · Cellar of Habits | floor 1 | floor 2 |
| II · Flooded Rooms | floor 3 | floor 4 |
| III · Ledger Halls | floor 5 | floor 6 |
| IV · Furnace | floor 7 | floor 8 |
| V · Frozen Bottom | floor 9 | floor 9 |

Floor 0 has no laboratory (no projections, no parts). Tree floors (2, 4) place it as an emanation side room; random floors (6, 8, 9) as a dead-end special room, like a treasure room. Five alembics per run. STATIONS §8 already sketches the `laboratory` template (alembic, shelves of jars); the room must pass `sotano-levels` (band, door approaches, centre clear).

**What the player does, step by step:**

1. **Find it.** The lab glows warm through its open door; the alembic's hearth burns. Three small brass rings on its base show the brews it has left.
2. **Feed the bulb.** Place (right click at its mouth) or throw a part or a block cube into it. The cube sinks, and one mark on the glass lights in the cube's path colour (parts) or stays plain (materials). The bulb holds **three** cubes. A fourth bounces off with the denied sound.
3. **It keeps what you feed it** for the whole run. With one hand slot you can ferry parts one by one from the rooms of this floor, or bring one from the floor above. Nothing fed can be taken back: what goes into the work stays in the work.
4. **Read it.** If the bulb's contents match a recipe you have already brewed in any run (the codex, §4.6), the liquid takes that potion's colour. Otherwise it stays grey. Grey never says "no recipe": discovery stays open.
5. **Brew.** Hit the bulb with a **positive** intention. Its light rises, and drops fall into the flask, one per second, for six seconds (a visible fill, no bar, no number). One brew ring on the base goes dark.
6. **Or spoil it.** A **negative** intention on a loaded bulb boils it off: grey steam, the contents are lost, and **no brew is spent**. The alembic itself cannot be broken (like a chest, a fixed point with a reason: it is the zone's only one).
7. **Collect.** The flask stands on its stand. Walk onto it to lift it into a free hand slot, as with parts. If your hand is full it waits there for the run.
8. **Rest.** After the third brew the hearth goes cold and the bulb frosts over. Nothing is said: the rest is a visual, as with the Compost's beds.

---

## 3. The recipe model

**Inputs.** The bulb's whole contents, as a multiset of up to three cubes. A part matches by **kind** (flesh, mind, heart, essence) and by **source** at one of four levels: the exact pattern, its **lineage** (Doubt → Second-Guessing → Paralysis), its **path** (body, mind, emotion, will, from the BESTIARY tables), or any. A material cube matches by its material.

**Matching.** A recipe matches only if it accounts for every cube in the bulb (exact multiset), except **ice**, which is a modifier (below). If several match, the most specific wins: exact pattern > lineage > path > any, then more inputs over fewer. A validator proves that no two recipes tie for any possible input (§6, risk 5). Nothing matched gives **Plain Tonic**: a brew is never nothing (the rule of BESTIARY §8.5's reward table).

**Ice** (floor 9 and cold rooms) takes a slot and keeps a brew cold: a potion counted in rooms lasts **one room more**. On instant or floor-long potions it does nothing.

**Output.** One flask per brew. Its effect is installed when you drink it, under its own source (`potion:<id>`), and removed when its duration ends.

**Durations** never use a clock on screen:

| Duration | Ends |
|---|---|
| Instant | At once |
| *N* rooms | After *N* sealed rooms are cleared, and at the latest on the next `floorEnter` |
| Floor | On the next `floorEnter` |
| Run | At the end of the run |

**The potions** (names are proposals; every name and line also needs Spanish through `sotano-i18n`):

| # | Potion | Path | Bulb contents | Effect | Duration | Why it stays scarce |
|---|---|---|---|---|---|---|
| 1 | **Plain Tonic** | body | Anything no recipe matches (e.g. one flesh) | Heal ½ heart | Instant | Spends a whole brew for the smallest gift |
| 2 | **Restoring Draught** | body | Two flesh, any patterns | Heal 1 heart (never past your containers) | Instant | Two parts and a brew for one heart; a heart from a room clear is cheaper |
| 3 | **Footing Tincture** | body | One flesh of a Body pattern + one deepstone or obsidian cube | Projection hits do not knock you back; kick ×1.5 | 3 rooms | Needs a hard block carried to the bulb (a second trip with one hand slot) |
| 4 | **Spring Tonic** | body | One heart of a Body pattern (e.g. *Impulse's spring*) | Jump ×1.4 | Floor | Hearts drop 5 %; one floor of easier climbing, not the climb back |
| 5 | **Clear Infusion** | mind | Two minds, from two different Mind patterns | Range ×1.3, shot speed ×1.2 | 3 rooms | Needs two Mind patterns met on the same floor or carried down |
| 6 | **Questioning Tincture** | mind | One mind of the Doubt lineage + one iron ore cube | The next lock (door or chest) asks one key less, never below zero; never the toll | One lock, or the floor | One lock per flask; it cannot open the way down |
| 7 | **Warm Cordial** | emotion | One heart of an Emotion pattern + any heart | Positive intentions give double warmth (conversion in half the hits) | 3 rooms | Two hearts (5 % each); converts, never kills |
| 8 | **Open-Hand Elixir** | emotion | One essence of an Emotion pattern | Contact hits on you are halved, and a projection that touches you gains 0.2 warmth | Floor | Essences drop 2 % |
| 9 | **Ember Tonic** | will | One heart of a Will pattern (e.g. *Panic's captive ember*) | Fire rate ×1.3 | 3 rooms | Hearts drop 5 % |
| 10 | **Patient Draught** | will | One flesh and one mind of the same Will pattern | Mining ×1.6 | Floor | Two kinds from one pattern; helps you dig, not fight |
| 11 | **Distillate of** *(pattern)* | the pattern's path | The heart, mind and essence of the **same** pattern | That pattern and its lineage materialise with half warmth (three good hits convert them) | Run | One per pattern per run; the whole bulb, an essence, and a full ferry |

The Distillate is one recipe and one name template ("Distillate of Doubt", "Distillate of the Lectern"), filled with the pattern's name already in the catalogs. It is the long game of the system: you prepared the whole pattern, so you know it when it comes again.

**How potions stay scarce (the Compost's logic, applied to the station):**

1. **Three brews per alembic per run**, five alembics: at most fifteen potions in a run, whatever the part supply (challenge rooms included).
2. **One flask per brew**, and a flask takes a hand slot, competing with blocks, parts and the toll.
3. **No stacking.** Drinking a potion that is already active refreshes its duration to the full value; it never adds a second source.
4. **Rarity by kind.** Strong and long effects need hearts (5 %) and essences (2 %); flesh only buys instant healing.
5. **Room-counted durations** tick on sealed rooms only, so a challenge room's waves do not burn a potion faster, and a quiet floor does not stretch it.
6. **Parts supply** keeps the Compost's falloff (100 / 75 / 50 %) and its rest after three harvests; potions add no new source of parts.

---

## 4. How it fits the existing systems

### 4.1 Polarity (decided in this proposal)

- **Parts carry no polarity mark.** Every part is released matter, so every part comes from a negative intention; converted allies leave nothing (BESTIARY §5.7). A "positive part" would need a new source and a doubled icon set. Not worth it.
- **The brew's polarity is what counts.** Only a positive intention brews; a negative one boils the bulb off without spending a brew. This keeps the rule players already know: good intentions mend and make, bad ones break.
- **A thrown flask** shatters into a small splash of good intention (radius 1): one positive intention hit on everything in range. It warms projections, heals allies and creatures, mends damaged blocks, and never kills (the positive-intention floor of one point holds). The potion is lost. So throwing is a choice: drink it for yourself, or spend it on someone else.

### 4.2 The promised trait

Potions are **never promised**. The gold seam means "given" (§8.7) and a potion is made, not given. A flask can be lost: thrown, given at the toll (it counts as a thing from the hand, LEVELS §1c), swallowed by Craving's pull (returned on release), or taken by Scarcity once theft is built. Promised gifts are inventory items, not hand cubes, so they can never go into the bulb.

### 4.3 RNG

| What | Class | Source |
|---|---|---|
| Which room of the zone's lab floor is the laboratory | Structure | `fork('floor', k, 'lab')`, drawn with the plan. A new room type: `GEN_VERSION` bump and a new golden hash |
| Recipe resolution | None | A pure function of the bulb's multiset: no roll, order-independent |
| Potion effects with a chance (none today) | Runtime | `fork('potion', id, seq)`, `seq` the run's brew count; never `stream('loot')` or `stream('drops')` |
| Steam, drops in the glass, the splash | Cosmetic | `fx` only |

Recipes are **content, not seed**: the same bulb gives the same potion in every run, so knowledge carries over (pillar 4). DESIGN §9's "recipes that change with the seed" stays possible later (open question 7).

### 4.4 How a potion is held

A **flask is a third kind of hand cube**, beside materials and parts: `player.hand` grows from material-or-part to material-or-part-or-potion. It is picked up by walking onto it, placed with right click (it stands as a pickup), thrown with Q (§4.1), counted by `carry`, and handed to Presences and the toll like any carried thing. It is not a practice, never enters the `Inventory`, and never counts toward a state of being. The HUD shows **active potions** as small flasks beside the hearts, with one dot per room left (floor and run potions show no dots): no timer, no flicker, no mood (art §11).

### 4.5 Practices and synergies

- **Effects use the item contract.** A `PotionDef` is an `Effect` (stats, hooks) plus `path`, `duration`, `recipe`, `color`, `icon`, `name`, `description` and `effect` text. Drinking installs it under `potion:<id>`; the inventory's rebuild only removes its own sources (ITEMS §6), so potions survive pickups.
- **Two new events**, each with an emit site (the contract test): `brew` (contents, result, cancel; practices may change the result) and `drink` (potion, duration, cancel; practices may change the duration).
- **States of being:** each state synergy gains one `drink` hook: a potion of its own path lasts one room more (floor and run potions: unchanged). All four live in `synergies.ts`, where exceptions belong.
- **Socratic Questioning** + Questioning Tincture: the tincture covers two locks instead of one (a synergy entry).
- **Symbolic Act:** a thrown flask carries the `throw` event like a block, so a volatile flask bursts as well as splashing. The synergy matrix must cover it (§6, risk 2).
- **A future practice** from STATIONS §10, **Alchemy** (mind): each alembic keeps a fourth brew. It goes through `sotano-items`.

### 4.6 Agreements, the codex, the Compost

- The first time you brew a recipe, the codex (BESTIARY §9) draws it as icons (parts → flask), kept across runs as knowledge, never power. It drives the bulb's colour preview (§2, step 4).
- From Zone III, an agreement may ask for a potion instead of a part ("the Mender asks for a Restoring Draught, to mend a vessel"). The doability rule of §8.6 still holds: only potions whose parts the floor can give.
- The Compost stays the steady source of parts; the laboratory is the zone's other half.

---

## 5. Drinking

**The verb: Drink.** A new action `drink`, a press, live in `play`. It acts on the top of the hand when that is a flask; otherwise it does nothing and plays the denied sound. The hands lift the flask to the mouth for 0.4 s: you can move, but not cast, during the lift (STATIONS open question 2, answered for flasks). Then the `drink` event fires, the effect installs, the flask is gone, and the banner names the potion and its effect line, as for practices.

**Mappings** (the keys and buttons are chosen with `sotano-controls`, against Minecraft's use item, Noita's throwable button and Isaac's one button per pocket item):

| Device | Mapping |
|---|---|
| Keyboard and mouse | One key, live only in `play`, with no clash with `place`, `throw`, `bomb` or `polarity` (`F`) |
| Gamepad | One face or stick button; the controls skill lists `X`, `LS` and `RS` as free in `play` |
| Touch | A flask button in the right-thumb arc, shown **only while a flask is in the hand** (Isaac's pocket slot), within the seven-button limit |

The kitchen's meals (STATIONS §4.2) could later share this action under a wider label; STATIONS' "eat with F" must change either way, since `F` is polarity.

---

## 6. Risks and the tests that catch them

| # | Risk | Test |
|---|---|---|
| 1 | **Farming.** Challenge rooms give endless parts, so endless potions | A station test: a fourth brew at one alembic is refused whatever the bulb holds; a sandbox scenario with 500 parts on the floor ends the run with at most 3 brews per alembic |
| 2 | **Stat blow-ups** from potions stacked with practices and with each other | Extend `tests/synergy-matrix.test.ts`: every potion alone, with every practice, and every pair of potions active together: no errors, finite stats within limits; drinking the same potion twice leaves one source |
| 3 | **Effects that leak or vanish.** A rebuild removes a potion, or a floor-change leaves one on | Inventory test: drink, gain and lose a practice, the potion stays; clear *N* sealed rooms, it is gone; `floorEnter` removes room and floor potions and keeps the Distillate; a challenge room's waves do not tick it |
| 4 | **RNG drift.** Brewing or drinking shifts structure or drops | `tests/rng.test.ts`: the same seed with 0 and with 10 brews gives the same structure hash and the same `stream('drops')` sequence; the resolver returns the same potion for every order of the same contents |
| 5 | **Ambiguous recipes.** Two recipes tie, so the result depends on load order | A validator test: enumerate every multiset of up to three cubes (four kinds × 40 patterns × the recipe materials, plus ice) and assert at most one recipe of the top specificity matches, and that unmatched sets give Plain Tonic |
| 6 | **Hand code assumes two kinds.** Toll, place, throw, Craving's pull or the hold-up break on a flask | Unit tests per path: the toll window lists and takes a flask; place stands it as a pickup; throw shatters it with the splash; `carry` counts it; Craving returns it on release |
| 7 | **A positive splash kills.** The thrown flask lowers a projection to zero | Combat test: a splash on a projection at 1 hp leaves it at 1 hp with warmth +0.2; on a creature it heals |
| 8 | **Controls clash or a missing device** | `tests/controls.test.ts`: `drink` exists on all three devices, no shared input in `play`, and the touch arc stays at seven buttons or fewer with a flask in hand |
| 9 | **Missing words, or claims of cure** | `tests/i18n.test.ts`: every potion's name, description and effect exist in English and Spanish with the same numbers; a content test rejects "cure", "treatment", "therapy", "medicine" and "medication" in potion text |
| 10 | **The structure change breaks old seeds silently** | The golden hash test fails on purpose; the lab lands on the right floor of every zone for 200 seeds and never blocks a door, the centre or the shaft |

---

## 7. Open questions for the owner

**Decided by the owner (2026-10-28):** positive intentions should be used more, so only a positive intention brews (question 3); three brews per alembic and one laboratory per zone (questions 1 and 2); the alembic closes the shop task with no shop (question 9). The other questions stay open, with their defaults.

1. **The station.** One Alembic per zone, in a quiet laboratory on the zone floor without the Compost? *Default: yes.*
2. **Brews per alembic per run.** *Default: three, mirroring the Compost; tuned in play.*
3. **Polarity.** Only a positive intention brews; a negative one boils the bulb off without spending a brew? *Default: yes.*
4. **Holding.** A flask in the hand (competing with blocks and parts), rather than a separate pocket counter like keys and bombs? *Default: the hand.*
5. **Durations in rooms cleared**, never seconds on screen? *Default: yes.*
6. **The Distillate** lasts the whole run, one per pattern? *Default: yes.*
7. **Recipes fixed in every run** (knowledge carries), or some that change with the seed (DESIGN §9)? *Default: fixed now; one seeded recipe can be added later.*
8. **The codex keeps brewed recipes across runs?** *Default: yes, as knowledge only.*
9. **The shop (DESIGN §13.8).** Does the alembic, with the agreements, close the "parts need a purpose" task and keep "no coins, no shop"? *Default: yes; the Trickster's trades stay the only exchange.*
10. **A care route to parts.** Should a converted ally's gift at full health (§1.1, not built) be its pattern's essence? *Default: no; force gives parts, care gives a friend (§8.8).*
11. **Drinking leaves you exposed** for 0.4 s (no casting)? *Default: yes.*
12. **Agreements may ask for potions** from Zone III on? *Default: yes.*

---

## 8. Build order

Each step goes through `sotano-docs`, `sotano-items`, `sotano-i18n` and `sotano-art`; step 2 adds the first station and a room type, so it needs the **three-party review** first (STATIONS §11 already marks stations as a key architecture decision).

| Step | What | Done when |
|---|---|---|
| **P1 · The flask and the verb** | `PotionDef` and two potions (Plain Tonic, Restoring Draught); the flask as a third hand kind; the `drink` action on three devices; the `drink` event; timed effect sources with the room countdown; the HUD flasks; `S.givePotion(id)` in the sandbox | Risks 2, 3, 6, 8 and 9 tested; a potion given in the sandbox can be drunk, thrown, placed and given at the toll |
| **P2 · The Alembic** | The alembic block entity and the `laboratory` template on one floor per zone (`fork('floor', k, 'lab')`, `GEN_VERSION` bump); the pure resolver and its validator; the `brew` event; positive-only brewing, three brews, the cold rest; `path` on `EnemyDef`; all eleven recipes except the Distillate; art gate for the alembic, the flask and eleven icons | Risks 1, 4, 5 and 10 tested; a seed brews every recipe in the sandbox |
| **P3 · Into the world** | A `warmth` field on `actorDamage` and `enemySpawn` (Warm Cordial, Open-Hand Elixir, Distillate); the Distillate; the thrown splash; the state-of-being and Socratic Questioning hooks; codex recipes and the bulb's colour preview; agreements that ask for potions | Risk 7 tested; the synergy matrix covers potions with every practice |

**Docs to update when built:** BESTIARY §5.7 (where parts matter, the stale count), STATIONS §4.4 and §8, DESIGN §6 and §13.8, ITEMS.md (a new effect source and two events), RNG.md §4 (the new paths), input README and the device documents, CONCEPTS (preparation as mental transmutation), LEVELS (the laboratory room).
