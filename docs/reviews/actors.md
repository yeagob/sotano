# Review: actors, split damage, chain safety, factions

This is the three-party review of the P0 refactors proposed in [../architecture/ACTORS.md](../architecture/ACTORS.md), which came out of the [stress test](stress-test.md).

The owner asked (translated) to *start the P0 refactors in order: PR1 bus safety, PR2 split damage, PR3 actors, PR4 factions*.

PR1 and PR2 were committed before the ruling (445da62). The ruling's PR1 fixes landed in their own commit right after.

---

## 1. Architect's critique

### Verdict

The direction and the PR order are right. The problems are in the semantics at the edges.

### Critiques

**High**

- **H1. Fail closed vs `death`.** A cancelled `death` means "survive". If a lethal hit landed past the depth cap, the player would become immortal. `doorOpen` and `enemySpawn` would also misbehave.
  - *Change:* defer ItemApi actions at a soft depth, plus a per-event overflow policy.
- **H2. One `actorDamage` event silently widens existing hooks.** Radical Acceptance, migrated literally, would cancel your bomb's damage to every projection.
  - *Change:* a declarative `target` filter on hooks, required on actor events, plus a matrix case.
- **H3. Contact between non-player actors has no rate limit.** That means 240 damage per second, and a double emit per pair.
  - *Change:* a per-pair cooldown, with i-frames checked before the emit.
- **H4. Cancellable enemy death loops.** A Panic would burst every frame, and so would a fall-out kill.
  - *Change:* keep cancellable death player-only; `actorDeath` is react-only.
- **H5. The blast queue:**
  - the owner of a Panic burst is dangling by the time the blast runs;
  - doors can open before the last Panic's blast lands;
  - the queue cap can drop a real bomb.
  - *Change:* run root blasts immediately, queue only chains, and snapshot the owner.

**Medium**

- **M1. The cause is lost through flung volatile cubes.**
  - *Change:* per-cube cause arrays.
- **M2. Hearts rounding.**
  - *Change:* use `ceil(points / 4)` with a minimum of 1, matching today; export `HALF_HEART`.
- **M3. Owners.**
  - *Change:* add `api.isPlayer(id)`; hook sources become `actor:<id>`.
- **M4. Flow fields and targeting.**
  - *Change:* cache per (room, target); retarget at 4 Hz with hysteresis; behaviours shoot at the target.
- **M5. "Allies follow".**
  - *Change:* cut it from P0. Doors seal behind the player, and descents are undefined.

**Low**

- **L1.** The `Hit` type is unused. Cut it.
- **L2.** Add a guard against `add` on `mining`.
- **L3.** `damageActor` must skip materialising actors.
- **L4.** Actor lifecycle: reset ids each run; call `bus.off` on removal.
- **L5.** `halfHearts?: true` instead of a model enum; defer `api.actors.query`; `factionChange` react-only.
- **L6.** The projectile thrower was already stored.

### Keep as is

- the PR order;
- no hook bypass at depth;
- the 8-per-frame blast budget and the generation cap;
- `Cause` on `explosion`;
- absolute `mining`;
- one id space, with the enemy uid becoming the actor id;
- one damage function, with points as the unit for projections;
- three factions with a pure `hostile()`;
- friendly fire from explosions;
- the player's intents passing through allies;
- `blocksClear` deciding room clear;
- `S.charm()` as a debug tool only.

---

## 2. Mediator's ruling

| # | Ruling | Reason |
|---|---|---|
| H1 | **Reject the deferral. Now: invariant and test** | The immortality is not real. `death` is emitted after `actorDamage` returns, at the same depth, so a hit that passed the cap also passes `death`. `doorOpen`, `enemySpawn` and `roomClear` come only from the core loop. Add `bus.depth`, assert root-only events, and keep fail closed. |
| H2 | **Now (PR3)** | Real. Add a `target` filter applied by the installer, required by validation and a contract test, plus a matrix case. |
| H3 | **Now (PR3)** | A live bug today (see "Missed by both"). Add a 0.5 s per-pair cooldown, with i-frames checked before the emit. |
| H4 | **Now (PR3)** | `death` stays player-only and cancellable; `actorDeath` is react-only. |
| H5a: roots run immediately | **Reject** | It brings nesting back. Catharsis explodes from inside `debrisImpact`, inside `debris.update`. |
| H5b: the cap drops bombs | **Now, one line** | Apply the cap to chain links only. |
| H5c: doors open before a blast | **Now** | A room doesn't clear while blasts are pending. |
| H5d: owner snapshot | **Reject** | The owner is only used for credit. Consumers must tolerate a missing actor; `isPlayer` is enough. |
| M1 | **Later** | No item sets `keepTags` and Catharsis blasts are roots, so there is no unbounded chain today. Now: a guard test forbidding `keepTags = true`. |
| M2 | **Now** | Use `ceil`; export `HALF_HEART`; `heal` stays in half-hearts. Ask the owner about fractional reductions. |
| M3 | **Now** | `api.player()`, `api.isPlayer()`, `Owner = ActorId \| 'world'`, sources `actor:<id>`. |
| M4 | **Now, minimal** | Retarget at 4 Hz with 1.5-block hysteresis; flow fields per (room, target); `ctx.target` returns a snapshot. A linear scan is fine. |
| M5 | **Cut** | Allies stay in their room. Following moves to PR7. |
| L1–L5 | **Now** (except `actors.query`, **later**) | |
| L6 | **Done** | |

### Missed by both

1. **Forgiveness was a live bug.** `enemyContact` fired every frame while touching, and i-frames weren't checked first. Forgiveness's +4 landed every frame (about 240 damage per second), and its rolls depended on frame rate. The contact gate fixes it.
2. **`bombCause` was keyed by debris slot**, so a stale cause could stick to the next bomb in that slot. Reset it when a bomb is placed.
3. **Blast cost.** Each blast emits `blockDamage` for every cell in its sphere and scans every cube. Keep an eye on it in performance passes.
4. **`bus.depth` was missing.**
5. **Mixed units.** The ×4 in the blast code had to become a single points value.

---

## 3. Engineer's resolution

Everything ruled "now" is built; see [../architecture/ACTORS.md](../architecture/ACTORS.md). Later items are listed there in §6.

**PR1 fixes**

- Root blasts are never dropped.
- Rooms clear only after pending blasts.
- `ROOT_EVENTS` with `bus.depth`.
- `bombCause` is reset when a bomb is placed.
- Guard tests: no `keepTags = true`, no `add` on `mining`.

**PR3 (actors)**

- `src/entities/actors.ts`: `Actor`, `ActorRegistry`, `HALF_HEART`, `halfHeartsFor`, `ContactGate`, `hostile`.
- `Player` and `Enemy` implement `Actor`.
- `damageActor` with one `actorDamage` event (`playerDamage` and `enemyDamage` are removed).
- `contact` with the gate; react-only `actorDeath`.
- `HookSpec.target`, enforced by the validator and the contract test.
- Acceptance, Forgiveness and Nothing Personal are migrated; `api.player` and `api.isPlayer` added.

**PR4 (factions)**

- `ctx.target`, `toward` and `dist` replace the player-only API. Behaviours idle without a target.
- Contact and projectiles are checked against every hostile actor.
- The player's intents skip allies.
- `blockingIn` decides room clear.
- `setFaction` with `factionChange`; a warm tint for allies; `S.charm()`.

**Owner answer (M2):** yes, small reductions must count. The player's health is now in points too (a heart is 8) and the HUD draws quarter hearts; the minimum of one half-heart per hit is gone.
