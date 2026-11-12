# What the Roots give, by mastery level

Up: [the Roots as an evolving tutorial](README.md) · Status: decided (owner, issue #147: decision 9, and the corrections of 2026-11-12: level 0 gives exactly one key or one breakthrough; "five times lower" is the chance a crate gives anything; the Roots' two practices of today never change; an extra guaranteed practice from level 10 and a second from level 25; steps through level 36; step lines in stars). The exact numbers are a proposal. Mastery itself is in [MASTERY](../../progression/MASTERY.md).

The Roots read one number when a run starts: the mastery level, 0 to 100. Everything below is a pure function of that level and the run's seed. It changes only floor 0's own sources; every other floor, and the surface, keep their numbers.

## 1. What exists today

| Source | Today (`src/world/floor.ts`, `src/content/tables/`) | With mastery |
|---|---|---|
| The Sanctuary chest (`roots-gift`) | Free, under the Boundary. Quick reward: a practice of ★ to ★★; a finished meditation: ★★★ (the ★★★ to ★★★★ band capped at ★★★ on the Roots) | **Unchanged at every level** |
| The way-down pedestal (`roots-door`) | A practice of up to ★★★★ from the treasure pool, reserved at run start (`pedestalSlots`) | **Unchanged at every level** |
| Loose loot | Always one key and one bomb, each on a free tile of a lesson room (`floor/0/loot` fork) | Level 0: exactly one key **or** one breakthrough; both from level 1, more later |
| Crates | The 28 crates of `roots-crates`. A broken crate gives something with the floor's chance, drawn per seed uniformly in **0.10 to 0.30** (`CRATE_DROP` 0.3, `CRATE_DROP_MIN` 0.1, `floorCrateChance`); a key (3), a heart (3) or a bomb (2) by weight. Crates never hold practices | The chance times a factor: level 0 is five times lower |
| Hearts, chests, extra practices | None | Grow with the level |
| The player | Starts every run with one bomb | Unchanged |

"Poorer at level 0" applies only to the loose loot and the crates of the lesson rooms; the two practices of the Roots are what they are today.

## 2. The table

Each row is the level at which something changes. Every step is kept at every higher level (monotonic). Levels 1 to 36 each bring one named step (36 achievements exist today, so 36 is the most a player can reach now). From 37 to 100, the crate factor grows a little every level and a few larger steps come on top.

| Level | What the Roots gain | Keys | Breakthroughs | Hearts lying loose | Free chests | Crate factor | Extra practices |
|---|---|---|---|---|---|---|---|
| **0** | Poorer than today | one key **or** one breakthrough | | none | 0 | 0.2 | 0 |
| 1 | A key and a breakthrough both | 1 | 1 | | | | |
| 2 | Crates give more | | | | | 0.3 | |
| 3 | A red heart | | | red | | | |
| 4 | A chest that needs no key | | | | 1 | | |
| 5 | Crates give more | | | | | 0.4 | |
| 6 | A second key | 2 | | | | | |
| 7 | A blue heart | | | + blue | | | |
| 8 | Crates give more | | | | | 0.5 | |
| 9 | A second breakthrough | | 2 | | | | |
| 10 | **A practice waits on a pedestal** | | | | | | 1 |
| 11 | Crates give more | | | | | 0.6 | |
| 12 | A second free chest | | | | 2 | | |
| 13 | A stone heart | | | + stone | | | |
| 14 | A third key | 3 | | | | | |
| 15 | Crates give more | | | | | 0.7 | |
| 16 | A second red heart | | | + red | | | |
| 17 | A third free chest | | | | 3 | | |
| 18 | Crates give more | | | | | 0.8 | |
| 19 | A third breakthrough | | 3 | | | | |
| 20 | A blood heart | | | + blood | | | |
| 21 | Crates give more | | | | | 0.9 | |
| 22 | A fourth key | 4 | | | | | |
| 23 | A fourth free chest | | | | 4 | | |
| 24 | Crates give as on every other floor | | | | | 1.0 | |
| 25 | **A second practice waits on a pedestal** | | | | | | 2 |
| 26 | A star heart | | | + star | | | |
| 27 | Crates give more than elsewhere | | | | | 1.1 | |
| 28 | A fourth breakthrough | | 4 | | | | |
| 29 | A fifth free chest | | | | 5 | | |
| 30 | Crates give more | | | | | 1.2 | |
| 31 | A fifth key | 5 | | | | | |
| 32 | A second blue heart | | | + blue | | | |
| 33 | Free chests give one thing more | | | | (2 to 4 draws each) | | |
| 34 | Crates give more | | | | | 1.3 | |
| 35 | A sixth free chest | | | | 6 | | |
| 36 | A black heart | | | + black | | | |
| 37 to 100 | Crates give a little more each level | | | | | +0.02 a level | |
| 45 | A sixth key | 6 | | | | | |
| 55 | A fifth breakthrough | | 5 | | | | |
| 65 | A second stone heart | | | + stone | | | |
| 70 | A second star heart | | | + star | | | |
| 80 | An altar in the start room | | | | | | + the altar (★ to ★★★) |
| 90 | The altar can hold the best | | | | | | altar ★★ to ★★★★ |
| **100** | A second Sanctuary | 6 | 5 | 10 | 6 | 2.58 | 2 + altar, and a second Sanctuary chest |

### At a glance

| Level | The floor (besides today's Sanctuary chest and way-down pedestal, always there) |
|---|---|
| 0 | One key or one breakthrough; crates give something 2 to 6% of the time |
| 5 | A key, a breakthrough, a red heart, one free chest; crates 4–12% |
| 10 | Two keys, two breakthroughs, red and blue hearts, one free chest, crates 5–15%, **one extra practice** |
| 15 | Three keys, two breakthroughs, red, blue and stone hearts, two free chests, crates 7–21%, one extra practice |
| 22 | Four keys, three breakthroughs, five hearts (two red, blue, stone, blood), three free chests, crates 9–27%, one extra practice |
| 25 | As 22 with four free chests, crates 10–30% (as other floors), **two extra practices** |
| 36 | Five keys, four breakthroughs, eight hearts (two red, two blue, stone, blood, star, black), six free chests of two to four draws, crates 13–39%, two extra practices |
| 50 | Six keys, four breakthroughs, eight hearts, six free chests, crates 16–47%, two extra practices |
| 100 | Six keys, five breakthroughs, ten hearts, six free chests, crates 26–75%, two extra practices, an altar up to ★★★★, and two Sanctuaries |

## 3. Crates

- The crate chance on floor 0 is `min(0.75, base × factor)`, where `base` is today's per-seed chance of floor 0 (0.10 to 0.30, unchanged) and `factor` is the table's crate factor.
- **Level 0: factor 0.2, five times lower than today**: a crate gives anything 2 to 6% of the time.
- From level 37: `factor = 1.3 + 0.02 × (level − 36)`, so 1.58 at 50 and 2.58 at 100.
- The cap 0.75 keeps a crate from always giving: at level 100 the chance is 0.26 to 0.75.
- What a crate gives is unchanged (key, heart or bomb by today's weights and luck; a heart's kind by the floor's heart chances). Crates never hold practices.
- **Only crates broken inside floor 0's band** read the factor. Crates above the Roots (the surface counts as depth 0 for crates today) keep floor 0's base chance without it.
- The crates are the 28 of `roots-crates`. No crate is added; no room changes.

## 4. The extra practices, the altar and the second Sanctuary

- **Extra practices (level 10: one; level 25: two).** Each is a practice floating over a pedestal block, in the open, like the way-down pedestal. The pedestal stands on a free tile of a lesson room (never a door approach, the centre or next to a marker), with nothing within three blocks above it (the pedestal rule of the validator), in a room that holds no other pedestal. The room and tile come from the fork `floor/0/roots/practice-spot`. The practice is drawn **at run start, after every pedestal of every floor has been reserved**, with a runtime draw from the treasure pool in the band ★ to ★★★ (the Roots' gentle practices), from the fork `floor/0/roots/practice/<i>`. A runtime draw never takes a reserved practice, so it can never take a deeper floor's practice; it marks its practice taken, so no later chest gives it again.
- **The altar (level 80).** One more pedestal, on a free tile of the start room (`roots-hall`), drawn the same way (`floor/0/roots/altar`), band ★ to ★★★, and ★★ to ★★★★ from level 90.
- **The second Sanctuary (level 100).** A second free chest with its own Boundary standing over it, on a free tile of the way-down room, behaving exactly as the first (same bands: quick ★ to ★★, finished ★★★).

## 5. Where the rest goes

- Free chests, loose keys, breakthroughs and hearts lie on free tiles of the eight lesson rooms (the same free tiles the build uses for chests and keys elsewhere), at most one free chest per room. They are placed after the extra practices, in this order: chests, keys, breakthroughs, hearts (in the table's order). Each kind draws from its own fork: `floor/0/roots/chest`, `…/key`, `…/bomb`, `…/heart`; level 0's key-or-breakthrough choice draws once from `floor/0/roots/oneof`.
- A free chest needs no key and holds what free-standing chests hold elsewhere, rolled when opened: one to three draws of the chest table (two to four from level 33). A practice that comes out of a Roots chest is drawn in the band ★ to ★★★.

## 6. Rules the table keeps

- **Bounded.** At most 6 keys, 5 breakthroughs, 10 hearts, 6 free chests, 2 extra practices, one altar, two Sanctuary chests (far fewer than the free tiles of eight rooms); the crate chance never exceeds 0.75; every band lies in ★ to ★★★★; the level is clamped to 0…100.
- **Monotonic.** For every level L, everything at L + 1 is at least what it is at L.
- **Deterministic.** Floor 0 depends only on the seed and the level.
- **Only the Roots.** Floors 1 to 9, the sky and the surface are identical at every mastery level for a given seed, because every new Roots practice is a runtime draw made after the whole reservation, and every other new decision draws from a new `floor/0/roots/*` fork.
- **`pedestalSlots` stays as it is.** The earlier draft took the Roots' two slots out of the reservation so that a scaled way-down pedestal could not change deeper floors. The way-down pedestal no longer scales, so the reservation, and with it every deeper floor's practices for a given seed, stays exactly as today. The treasure room's slot is still reserved and unused (the Sanctuary chest draws when it opens); it is left alone so the reservation order does not move.
- **`GEN_VERSION` still goes up by one**, because floor 0 itself changes for a given seed (level 0 lays one key or one breakthrough instead of both, and the new forks place new things); the levels skill asks for a bump whenever a random decision is added. Floors 1 to 9 replay identically.
- **Generation never reads the save.** `main.ts` loads the record once and hands the level to the game; `newRun` passes it to the carving of floor 0. A level earned during a run takes effect at the next run.

## 7. What each step says

The achievement notice ([ACHIEVEMENTS §4](../../progression/ACHIEVEMENTS.md#4-the-notice)) names the step the new level brings. Stars are written with the game's own `qualityStars` (`src/render/icons.ts`): the same ★★★☆ the item banner and the inventory already show for a practice's tier, passed as the `{stars}` parameter (for a band, its top: `★★★☆`).

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
| `mastery.gain.practice` | A practice waits on a pedestal in the Roots, up to {stars} ({n} in all). | Una práctica te espera en un pedestal de las raíces, hasta {stars} ({n} en total). |
| `mastery.gain.altar` | An altar rises in the first room, with a practice up to {stars}. | Un altar se alza en la primera sala, con una práctica hasta {stars}. |
| `mastery.gain.altarBest` | The altar's practice can reach {stars}. | La práctica del altar puede llegar a {stars}. |
| `mastery.gain.sanctuary` | A second Boundary keeps a chest by the way down. | Un segundo Límite guarda un cofre junto a la bajada. |

Percentages go through `fmtNum`. From 37 on, a level with only the crate step shows `mastery.gain.crates`; a level with two changes shows both lines.
