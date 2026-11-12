# What the Roots give, by mastery level

Up: [the Roots as an evolving tutorial](README.md) · Status: decided (owner, issue #147, decision 9: a bounded, monotonic table from 0 to 100, real steps inside 1 to 22, level 0 poorer than today, deterministic for a seed and a level, generation never reads the save). The numbers are a proposal. Mastery itself is in [MASTERY](../../progression/MASTERY.md).

The Roots read one number when a run starts: the mastery level, 0 to 100. Everything below is a pure function of that level and the run's seed. It changes only floor 0's own sources; every other floor, and the surface, keep their numbers.

## 1. What exists today (the baseline the table moves from)

| Source | Today (`src/world/floor.ts`, `src/content/tables/`) |
|---|---|
| Loose loot | Always one key and one bomb, each on a free tile of a lesson room (`floor/0/loot` fork) |
| Crates | The 28 crates of `roots-crates`. A broken crate gives something with the floor's chance, drawn per seed uniformly in **0.10 to 0.30** (`CRATE_DROP` 0.3, `CRATE_DROP_MIN` 0.1, `floorCrateChance`); the drop is a key (3), a heart (3) or a bomb (2) by weight. Crates never hold practices |
| The Sanctuary chest (`roots-gift`) | Free, under the Boundary. Quick reward: a practice of quality 1 to 2; a finished meditation: quality 3 (the 3 to 4 band capped at 3 on the Roots) |
| The way-down pedestal (`roots-door`) | A practice of quality up to 4 from the treasure pool, reserved at run start |
| Hearts, chests | None loose; no room chests on the Roots |
| The player | Starts every run with one bomb (unchanged by this design) |

## 2. The table

Each row is the level at which something changes; between rows nothing changes except the crate factor from level 23 on (section 3). Every step is kept at every higher level (monotonic).

| Level | What the Roots gain | Keys | Bombs | Hearts lying loose | Free chests | Crate factor | Way-down pedestal | Sanctuary: quick / finished |
|---|---|---|---|---|---|---|---|---|
| **0** | Poorer than today | one key **or** one bomb | (the other: none) | none | 0 | 0.2 | bare | 1 / 2 |
| 1 | A key and a breakthrough both lie in the Roots | 1 | 1 | | | | | |
| 2 | Crates give more | | | | | 0.4 | | |
| 3 | The pedestal holds a practice | | | | | | 1 | |
| 4 | A red heart | | | red | | | | |
| 5 | A chest that needs no key | | | | 1 | | | |
| 6 | Crates give more | | | | | 0.6 | | |
| 7 | A second key | 2 | | | | | | |
| 8 | The quick gift gets better | | | | | | | 1–2 / 2 |
| 9 | A blue heart | | | + blue | | | | |
| 10 | The pedestal's practice gets better | | | | | | 1–2 | |
| 11 | Crates give more | | | | | 0.8 | | |
| 12 | A second breakthrough | | 2 | | | | | |
| 13 | A second free chest | | | | 2 | | | |
| 14 | A finished meditation gives more | | | | | | | 1–2 / 3 |
| 15 | A stone heart | | | + stone | | | | |
| 16 | Crates give as they do on other floors | | | | | 1.0 | | |
| 17 | The pedestal's practice gets better | | | | | | 1–3 | |
| 18 | A third key | 3 | | | | | | |
| 19 | A third free chest | | | | 3 | | | |
| 20 | Crates give more than elsewhere | | | | | 1.2 | | |
| 21 | The pedestal can hold any practice | | | | | | 1–4 | |
| 22 | A blood heart | | | + blood | | | | |
| 25 | A fourth key | 4 | | | | | | |
| 28 | A second red heart | | | + red | | | | |
| 30 | A fourth free chest | | | | 4 | | | |
| 33 | A third breakthrough | | 3 | | | | | |
| 40 | A finished meditation can give the best | | | | | | | 1–2 / 3–4 |
| 45 | A fifth key | 5 | | | | | | |
| 50 | Free chests give one thing more | | | | (2 to 4 draws each) | | | |
| 55 | A star heart | | | + star | | | | |
| 60 | A fifth free chest | | | | 5 | | | |
| 65 | A fourth breakthrough | | 4 | | | | | |
| 70 | A second blue heart | | | + blue | | | | |
| 75 | A sixth free chest | | | | 6 | | | |
| 80 | An altar in the start room | | | | | | | |
| 85 | The pedestal never holds less than quality 2 | | | | | | 2–4 | |
| 90 | The altar can hold the best | | | | | | | |
| 95 | A black heart | | | + black | | | | |
| **100** | A second Sanctuary | 5 | 4 | 8 | 6 | 2.76 | 2–4 | 1–2 / 3–4, twice |

"Pedestal" and "Sanctuary" columns give the quality band of the practice drawn from the treasure pool (1 = gentle, 4 = the strongest). "Bare" means the stone stands empty. The altar (level 80) is one pedestal on a free tile of the start room with a practice of quality 1 to 3, and 2 to 4 from level 90. The second Sanctuary (level 100) is a second free chest with its own Boundary over it, on a free tile of the way-down room, with the same bands as the first.

### At a glance

| Level | The floor |
|---|---|
| 0 | One key or one breakthrough; crates give something 2 to 6% of the time; a bare pedestal; the Sanctuary gives a gentle practice (quality 1, or 2 for a finished sitting) |
| 5 | A key and a breakthrough, a red heart, one free chest, crates 4–12%, the pedestal holds a gentle practice |
| 10 | Two keys, a breakthrough, red and blue hearts, one free chest, crates 6–18%, pedestal up to quality 2, quick gift up to 2 |
| 15 | Two keys, two breakthroughs, red, blue and stone hearts, two free chests, crates 8–24%, a finished sitting gives quality 3 |
| 22 | Three keys, two breakthroughs, four hearts (red, blue, stone, blood), three free chests, crates 12–36%, the pedestal can hold any practice: richer than today |
| 50 | Five keys, three breakthroughs, five hearts, four free chests of two to four draws, crates 18–53%, a finished sitting up to quality 4 |
| 100 | Five keys, four breakthroughs, eight hearts, six free chests, crates 28–75%, pedestal 2–4, an altar 2–4 and two Sanctuaries |

## 3. Crates

- The crate chance on floor 0 is `min(0.75, base × factor)`, where `base` is today's per-seed chance of floor 0 (0.10 to 0.30, unchanged) and `factor` is the table's crate factor.
- **Level 0: factor 0.2, five times lower than today**: 0.02 to 0.06.
- From level 23 the factor grows by 0.02 a level: `factor = 1.2 + 0.02 × (level − 22)`, so 1.22 at 23, 1.76 at 50 and 2.76 at 100. That makes every level from 23 to 100 a real, small step, besides the named ones.
- The cap 0.75 keeps a crate from always giving: at level 100 the chance is 0.28 to 0.75.
- What a crate gives is unchanged (key, heart or bomb by today's weights and luck; a heart's kind by the floor's heart chances). Crates never hold practices.
- **Only crates broken inside floor 0's band** read the factor. Crates above the Roots (the surface counts as depth 0 for crates today) keep floor 0's base chance without it.
- The crates are the 28 of `roots-crates`, gathered in one room. No crate is added; no room changes.

## 4. Where things go (placement)

- Free chests, loose keys, bombs and hearts lie on free tiles of the eight lesson rooms (the normal rooms of the plan; the same free tiles the build uses for chests and keys elsewhere: never a door approach, the centre or next to a marker), at most one free chest per room. They are placed in this order: chests, keys, bombs, hearts (in the table's order). Each kind draws from its own fork of the run's seed: `floor/0/roots/chest`, `…/key`, `…/bomb`, `…/heart`; level 0's key-or-bomb choice draws once from `floor/0/roots/oneof`.
- A free chest needs no key (`keys: 0`) and holds what free-standing chests hold elsewhere, rolled when opened: one to three draws of the chest table (two to four from level 50). A practice that comes out of a Roots chest is drawn in the pedestal's band at that level.
- The way-down pedestal and the altar draw their practice at run start from the treasure pool, in their band, from the forks `floor/0/roots/pedestal` and `floor/0/roots/altar`, after every pedestal of floors 1 to 9 has been reserved, so they can never take a deeper floor's practice. A bare pedestal is the stone with nothing on it.
- The Sanctuary chests draw when they open, as today, in their bands.

## 5. Rules the table keeps

- **Bounded.** Counts never exceed 5 keys, 4 bombs, 8 hearts, 6 chests (fewer than the free tiles of the eight rooms); the crate chance never exceeds 0.75; every band lies in 1 to 4; the level is clamped to 0…100.
- **Monotonic.** For every level L, everything at L + 1 is at least what it is at L: counts, factor, both ends of every band, the presence of the altar and of the second Sanctuary.
- **Deterministic.** Floor 0 depends only on the seed and the level. The same seed at the same level gives the same Roots.
- **Only the Roots.** Floors 1 to 9, the sky and the surface are identical at every mastery level for a given seed. To make that true, the Roots' two pedestal slots leave the run-start reservation (`pedestalSlots`): the treasure slot was never used (the Sanctuary chest draws when it opens) and the way-down slot is replaced by the draw of section 4. This changes the practices of floors 1 to 9 for a given seed code once, so `GEN_VERSION` goes up.
- **Generation never reads the save.** `main.ts` loads the save once and hands the level to the game; `newRun` passes it to the carving of floor 0. A level earned during a run takes effect at the next run.

## 6. What each step says

The achievement notice ([ACHIEVEMENTS §4](../../progression/ACHIEVEMENTS.md#4-the-notice)) names the step the new level brings. The lines are message keys in both languages:

| Key | English | Spanish |
|---|---|---|
| `mastery.gain.both` | A key and a breakthrough both lie in the Roots. | En las raíces te esperan una llave y un avance. |
| `mastery.gain.key` | One more key lies in the Roots ({n} in all). | Una llave más te espera en las raíces ({n} en total). |
| `mastery.gain.bomb` | One more breakthrough lies in the Roots ({n} in all). | Un avance más te espera en las raíces ({n} en total). |
| `mastery.gain.heart.red` | A red heart lies in the Roots. | Un corazón rojo te espera en las raíces. |
| `mastery.gain.heart.blue` | A blue heart lies in the Roots. | Un corazón azul te espera en las raíces. |
| `mastery.gain.heart.stone` | A stone heart lies in the Roots. | Un corazón de piedra te espera en las raíces. |
| `mastery.gain.heart.blood` | A blood heart lies in the Roots. | Un corazón de sangre te espera en las raíces. |
| `mastery.gain.heart.star` | A star heart lies in the Roots. | Un corazón estrella te espera en las raíces. |
| `mastery.gain.heart.black` | A black heart lies in the Roots. | Un corazón negro te espera en las raíces. |
| `mastery.gain.chest` | One more chest that needs no key ({n} in all). | Un cofre más que no pide llave ({n} en total). |
| `mastery.gain.chestDraws` | Chests that need no key give one thing more. | Los cofres sin llave dan una cosa más. |
| `mastery.gain.crates` | Crates give something more often: {lo} to {hi} % of the time. | Las cajas dan algo más a menudo: entre el {lo} y el {hi} % de las veces. |
| `mastery.gain.pedestal` | The pedestal of the way down holds a practice (quality up to {q} of 4). | El pedestal de la bajada guarda una práctica (calidad hasta {q} de 4). |
| `mastery.gain.pedestalFloor` | The pedestal's practice is at least quality {q} of 4. | La práctica del pedestal es al menos de calidad {q} de 4. |
| `mastery.gain.quick` | The Sanctuary's quick gift can be a practice of quality {q} of 4. | El regalo rápido del Santuario puede ser una práctica de calidad {q} de 4. |
| `mastery.gain.finished` | A finished meditation can give a practice of quality {q} of 4. | Una meditación completa puede dar una práctica de calidad {q} de 4. |
| `mastery.gain.altar` | An altar rises in the first room, with a practice (quality up to {q} of 4). | Un altar se alza en la primera sala, con una práctica (calidad hasta {q} de 4). |
| `mastery.gain.altarBest` | The altar's practice can be quality {q} of 4. | La práctica del altar puede ser de calidad {q} de 4. |
| `mastery.gain.sanctuary` | A second Boundary keeps a chest by the way down. | Un segundo Límite guarda un cofre junto a la bajada. |

Percentages go through `fmtNum`. A level with two changes shows both lines; from 23 on, a level with only the crate step shows `mastery.gain.crates`.

## Open questions

- Level 0's "at most one bomb or one key": the design gives exactly one, chosen by the seed ([question 6](OPEN-QUESTIONS.md)).
- "Five times lower chance to hold an item" is read as the chance a crate gives anything ([question 7](OPEN-QUESTIONS.md)).
- The quality numbers are not shown to players anywhere else today; the step lines show them as "quality up to 2 of 4". The owner may prefer words.
