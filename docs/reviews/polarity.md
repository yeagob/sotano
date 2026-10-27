# Review: intention polarity

Subject: positive and negative intentions, the polarity toggle, warmth on projections, allies that can be harmed or healed and turn back ([../design/BESTIARY.md §1.1](../design/BESTIARY.md#11-intention-polarity-owner-2026-10-27)). Written before the code, as [`sotano-docs` §4](../../.claude/skills/sotano-docs/SKILL.md) asks. This change touches damage, factions and the room clear, so it is a key decision.

The three parties are: **engineer** (part 1, the proposal), **architect** (part 2, the critique, a read-only review of the proposal against the code), **mediator** (part 3, the ruling: now, later or reject, after fact-checking the critique against the code and representing the owner's interests). Part 4 records what the engineer built from the ruling.

---

## 1. Engineer's proposal

### 1.1 What the owner asked for

From [BESTIARY §1.1](../design/BESTIARY.md#11-intention-polarity-owner-2026-10-27):

1. One toggle switches the loaded intention between positive and negative. The default is positive. The HUD shows the polarity with a round mark that never flickers.
2. **Positive** intentions deal half damage to hostile projections and add warmth. At full warmth the projection turns to the self (`setFaction(a, 'self', source)`), not destroyed.
3. **Negative** intentions deal full damage. A projection killed this way releases, as today.
4. An **ally** hit by a negative intention loses health. At zero it turns hostile again. Positive intentions heal and nourish allies.
5. Presences and inhabitants are **not** built in this change (the owner's brief and BESTIARY §1.1 table). Their columns are not implemented.

### 1.2 The concrete design

**State and control.** `Game` holds `polarity: Polarity = 'positive'`. `KeyF` toggles it (`inp.pressed.has('KeyF')` in the game loop, next to Q and E). `F` is free: no code or README binding uses it, and it sits under the hand on WASD. The toggle emits a react-only event `polarityChange { from, to }`, so items can see it, and plays a short tick. It is never cancelled.

**The intention carries its polarity.** `IntentSpec` gains `polarity: Polarity`. `intentFromStats(stats, polarity)` sets it. The `fire` event therefore carries it: an item that changes the shot sees it, and an item may change it.

**The rules live in one pure module**, `src/combat/polarity.ts`, with no three.js and no DOM, so they can be tested directly. Its numbers are the proposals of BESTIARY §1.1, tuned on paper:

| Constant | Value | Reading |
|---|---|---|
| `POSITIVE_DAMAGE` | 0.5 | Positive intentions deal half damage to hostile projections |
| `WARMTH_PER_HIT` | 0.2 | Five positive hits fill the warmth (0 → 1) |
| `WARMTH_COOL` | 0.25 | A negative hit cools warmth by a quarter; it does not reset it |
| `ALLY_HEAL` | 0.5 | A positive hit heals an ally by half the damage, capped at its maximum |
| `RELAPSE_HP` | 0.5 | An ally that turns hostile again returns with half its maximum health |

With the base damage of 3.5 (`core/stats.ts`), Doubt (12 hp) gets five positive hits (5 × 1.75 = 8.75 damage), so it converts before it dies. The Lectern (9 hp) also converts after five hits (8.75). A negative hit does the full 3.5.

Pure functions:

- `projectionHit(polarity, damage, hp, warmth) → { damage, warmth, convert }`
  - positive: `damage = min(damage × 0.5, hp − 1)`, never below 0; `warmth = min(1, warmth + 0.2)`; `convert = warmth ≥ 1` (with a 1e-9 tolerance, since 0.2 summed five times is not exact).
  - negative: `damage = damage`; `warmth = max(0, warmth − 0.25)`; `convert = false`.
- `allyHit(polarity, damage, hp, maxHp) → { damage, heal }`
  - positive: `heal = min(damage × 0.5, maxHp − hp)`, `damage = 0`.
  - negative: `damage = damage`, `heal = 0`.

**Rule: a positive intention never kills a projection.** The cap `hp − 1` keeps it alive at one point, and the warmth still fills, so the route of light always ends in a conversion. Negative intentions are the only way a projection dies by intention. This is the single most debatable rule in the proposal (see the critique).

**Projections.** `Enemy` gains `warmth: number` (0 to 1, starts at 0). The hit handler in `Game` (`hitEnemy`, `game.ts`) does:

1. `r = projectionHit(polarity, damage, e.hp, e.warmth)`; `e.warmth = r.warmth` (even when the damage is 0, so the warmth still grows at one point of health).
2. `damageActor(e, r.damage, 'intent', 'intent', player.id, kx, kz)`. The pipeline is unchanged, so items still see `actorDamage` and knockback still applies.
3. If the projection is still alive and `r.convert`: `setFaction(e, 'self', 'polarity')`, a gold burst, a sound, and a toast (`toast.converted`).

A projection killed by a negative intention releases through `kill()` as today.

**Allies.** Today the player's intentions pass through allies (`enemyAt` filters to hostile ones). Under this proposal the filter accepts `projection` and `self` (not `neutral`), and the hit handler branches on polarity:

- positive: `allyHit` heals the ally (through `e.hp`, not `damageActor`). The emissive seam of its model grows with `hp / maxHp` (visual, see §1.3).
- negative: `damageActor(e, damage, 'intent', 'intent', player.id, kx, kz, { relapse: true })`. The option is read in `damageActor`'s enemy branch: if the ally's health after the `actorDamage` event is ≤ 0, it does not die. It becomes `projection` again through `setFaction`, returns with `RELAPSE_HP × maxHp`, warmth 0, a cold burst, and a toast (`toast.relapsed`).

Only intentions set `relapse`. Projection attacks on allies keep today's behaviour (an ally at zero dissolves like any other projection).

**Room clear.** `Enemies.blockingIn` already counts only `faction === 'projection'`. Allies do not keep doors shut, so converting the last hostile clears the room. This needs a test, not a change.

**Events and items.** New: `polarityChange`. Changed: `fire` (`IntentSpec.polarity`). The contract test (`tests/items.test.ts`, `ACTOR_EVENTS`) and `docs/architecture/ITEMS.md` list the events, so they are updated in the same change.

### 1.3 Look and feel

These are visual elements: the sotano-art gate applies, and an Opus 5.5 art agent reviews them before they ship.

- **Negative intention**: still round (the shot is yours), a darker core and a cold rim (BESTIARY §10 ruling 6). The colour is not decided: the proposal uses palette tokens only (`cold.deep` core, `cold.rim` shell, `light.ember` halo at lower opacity), and the art agent rules.
- **Positive intention**: unchanged (`light.gold` shell, `light.core` core).
- **HUD mark**: a round mark beside the counters. Positive is a filled circle in `light.gold`; negative is a hollow ring in `cold.dim`. The shape carries the meaning first (art §2: shape before colour). The mark is static: it changes only when the toggle is pressed, with no animation, no pulse and no flicker. It has a text title through i18n.
- **Warmth on a projection**: its emissive tint lerps toward `light.gold` at a low level as warmth grows (repair is gold: art reserved colours). Converted allies keep the existing steady gold glow, which now scales with their health.

### 1.4 Tests

`tests/polarity.test.ts`:

- positive halves the damage, and negative does not change it;
- five positive hits convert a Doubt-sized projection (12 hp) without killing it;
- a positive hit at 1 hp deals 0 and still adds warmth;
- a negative hit cools warmth by 0.25 and never drops it below 0;
- an ally healed by positive intentions never exceeds its maximum;
- an ally at zero from a negative intention turns to `projection` at `RELAPSE_HP × maxHp` (the pure part: `allyHit` and the decision);
- `blockingIn` does not count allies (a room with only allies is clear).

### 1.5 Not built (on purpose)

- Presences and inhabitants (their columns of BESTIARY §1.1 are design only).
- The Threshold Guardian's two routes (BESTIARY §6.5). It is not built at all: no Guardian exists in `src`. It is a boss milestone (E6), and this change gives it its rules, nothing more.
- Gifts from full-health allies, and the once-per-floor limit (they belong to the second session, agreements and gifts).
- Warmth decay. Warmth persists until the projection is hit negatively or converted. Decay is a later tuning question.

### 1.6 Risks I already see

- **Items can break the cap.** An `actorDamage` hook can raise a positive hit above `hp − 1` and kill. That is by design for items ("fun first"), but it means "positive never kills" is a rule of the base game, not an invariant.
- **Allies can still dissolve** to projection attacks and blasts (unchanged). An ally lost that way is a release, not a flip. Consistent with today, but a player may read it as a betrayal of the rule.
- **Converted projections keep their pattern and their attacks.** An ally that fires projectiles at the player is not possible (projectiles hit the first actor hostile to their thrower), but an ally's contact damage hits hostile projections in its room as designed.

---

## 2. Architect's critique

A read-only architect agent (Plan) checked each claim against the working tree. Its points, in its own order:

1. **BLOCKER: "the route of light always ends in a conversion" is false.** The `hp − 1` cap protects only intention hits. Lava and fire, kicks, blasts (bombs and Panic's bursts) and ally contact go through `damageActor` without `projectionHit`. Doubt at 1.75 hp with warmth 0.8 that touches lava dies with no conversion. "Never kills" is also not in BESTIARY §1.1. *Change:* scope the rule to intention hits, or carry polarity on every player-caused source. Label it as a rule added for owner ruling.
2. **MAJOR: the clamp runs before `actorDamage`.** An item that doubles intent damage turns 1.75 into 3.5 and kills a 1-hp projection, and the event payload carries no polarity, so items cannot tell. *Change:* halve before the event, cap after it (`min(ev.amount, hp − 1)` for positive intents), and put `polarity` in the `actorDamage` payload. If items may kill by design, rename the rule.
3. **MAJOR: weapons that replace the intention bypass polarity.** Occam's Razor, Kiai and One Clear Cut hit through the weapon host (`cut`, `beam`). The F toggle does nothing with them, and a positive player kills projections with a blade. *Change:* add polarity to the `strike` payload and route the weapon host through the same rules, or state in the proposal and HUD that polarity is intention-only.
4. **MAJOR: the relapse decision must come before `hurt`.** The enemy branch of `damageActor` calls `enemies.hurt`, which kills at `hp ≤ 0`. The proposal does not say where the "does not die" happens. *Change:* when relapse is set, the target is self and `hp − ev.amount ≤ 0`, set the hp, call `setFaction` to projection, apply knockback and flash, and return before `hurt`.
5. **MAJOR: relapse into a cleared room.** `updateCombat` skips cleared rooms. The usual case is the ally that cleared the room, so its relapse gives an unsealed hostile with no waves and no clear. *Change:* state the rule. The architect recommends no reseal, since doors never close on the player (BESTIARY §2.1), and add a test.
6. **MAJOR: allies now absorb intentions.** `intents.ts` spends the shot on any foe hit. Once the filter accepts `self`, an ally in front of a projection eats the shot, and a positive shot at a full-health ally is wasted. ACTORS §4 says the opposite ("intents pass through allies"). *Change:* decide, then let positive shots pass full-health allies, or record the blocking as intended and update ACTORS §4.
7. **MAJOR: converts are fragile.** Doubt ends at 12 − 8.75 = 3.25 hp, and its contact damage is 4, so one touch from a hostile dissolves a fresh ally as a release. *Change:* on conversion, raise hp to at least `RELAPSE_HP × maxHp`, or retune, and say which.
8. **MINOR: arithmetic.** For the 9-hp Lectern, the cap bites on hit 5 (2 hp becomes 1, dealing 1.0), so it ends at 1 hp, not after 8.75. Panic (7 hp) also ends at 1 hp. The proposal's "converts after five hits" is only true for Doubt.
9. **MINOR: relapse health.** `relapseHp` rounds `maxHp × 0.5` with a minimum of 1. The proposal should write the rounding down (the Lectern returns at 5, not 4.5).
10. **MINOR: cancelled hits still convert.** Warmth is set before `damageActor`, and the convert check runs even when an item cancels the hit. *Change:* convert only when the hit landed, or document the choice.
11. **MINOR: blasts and hazards dissolve allies.** Bombs, lava and fire kill allies outright, with no relapse. §1.6 should name them, not only "projection attacks".
12. **MINOR: docs and art.** ACTORS §4 ("intents pass through allies", "allies glow a steady warm gold") must change, and the doc list omits it. The warm tint on projections conflicts with the art ledger's "projections are cold" unless its cause is the player.
13. **PROCESS: the ruling should have come before the code.** The working tree already held the rules module, the event and field additions and the strings, while `game.ts` was not yet wired. The engineer's pre-ruling edits are data-only (a field, a payload type, strings, the intent's `polarity` value), with no behaviour changed. They are disclosed here, not hidden.

Verified correct by the architect: `blockingIn` already excludes allies (`enemies.ts:122`); the `enemyAt` filter is at `game.ts:229`; `setFaction`'s guard and target reset are at `game.ts:624–630`; warmth 0 at spawn is safe because spawning actors are unhittable; `F` is unbound in `src`; each intention hits one target (`intents.ts:98–102`); the 1e-9 tolerance is harmless; the intention carrying its polarity from `fire` matches BESTIARY §1.1.

Engineer's first response to the critique (for the mediator to test): accept 2, 4, 5, 6 (with the refinement that a positive shot passes a full-health ally and a negative one always hits), 7, 8, 9, 10, 11, 12 and 13. On 1, scope the cap to intention hits and label it as an added rule. On 3, either route weapons through the rules now (the strike payload carries polarity) or state that polarity is intention-only and the HUD says so; the engineer leans to routing them now, because a toggle that does nothing with the blade is a visible bug.

## 3. Mediator's ruling

A mediator agent (general-purpose) fact-checked the critique against the code, and ruled on each point. Where the architect was wrong, the ruling says so.

**Fact-check.** The architect is right on points 1–8, 10, 11 and 12, and on the "verified correct" list. Two corrections: point 9 contradicts itself (rounding down gives 4 for the Lectern, not 5); point 13 understates the state, because `intentFromStats` now requires `polarity` and `game.ts:1211` still passes one argument, so typecheck fails (TS2554). Two gaps the architect missed: the weapon `targets()` filter excludes allies (`game.ts:458–460`), and the beam calls `host.hit` on each of 10 ticks per beam (`weapons.ts:202, 229`), so per-hit warmth would convert in about half a second. `damageActor` also returns false for zero damage (`game.ts:535, 541`), so "landed" cannot be its return value.

**Rulings.**

1. **NOW (scope).** The positive-never-kills cap covers positive intention hits only. Blasts, lava, fire, kicks and contact keep today's behaviour: a kill means a release, with no warmth. Carrying polarity onto bombs and hazards is rejected: BESTIARY §1.1 says every intention has a polarity, and a bomb is not one.
2. **NOW.** `polarity` goes into the `actorDamage` payload (`null` for non-intentions). Halve before the event, then cap after it: `final = min(ev.amount, hp − 1)` for positive intention hits. Items can change damage or cancel, but cannot make a positive intention kill.
3. **NOW.** Weapons carry the loaded polarity. A held weapon replaces the intention (`game.ts:1591–1592`; Occam's Razor: "your intention becomes an edge of light"), so without this the HUD mark would be false. The `strike` payload carries polarity, and hits follow the intention rules. Each target gains warmth at most once per strike (the beam: once per beam). The HUD text is unchanged.
4. **NOW.** In `damageActor` (`game.ts:533–543`), before `enemies.hurt`: for a negative intention on an ally where `hp − ev.amount ≤ 0`, skip `hurt` (`enemies.ts:139` kills at ≤ 0). Set hp to `relapseHp`, call `setFaction(projection)`, apply knockback and flash, and return.
5. **NOW: no reseal.** BESTIARY §2.1 describes today's trigger, and `game.ts:649` gates it with `!st.cleared`. §1.1 says only "turns hostile again". A reseal would reopen a fight with no waves, omens or reward. A relapsed projection in a cleared room fights in the open, can be converted again, and never changes door state. Tested.
6. **NOW.** Positive shots (intentions and weapons) pass allies at full health, and heal damaged allies, absorbing the shot. Negative shots always hit allies. One filter serves `enemyAt` (`game.ts:229`) and the weapon `targets()` (`game.ts:458`). Kicks keep ignoring allies. ACTORS §4 is updated.
7. **NOW.** On conversion, `hp = max(hp, RELAPSE_HP × maxHp)`. Doubt goes from 3.25 to 6. The 9-hp Lectern goes from 1 to 4.5. Panic (7 hp) goes from 1 to 3.5.
8. **NOW (text).** The arithmetic is accepted. Only Doubt converts above 1 hp (3.25 after five hits). The 9-hp Lectern and Panic reach 1 hp on hit 5 and convert there. The proposal's "converts after five hits" sentence is corrected.
9. **NOW.** The observation is accepted; the rounding is rejected. Relapse hp is `max(1, maxHp × 0.5)`, without rounding (the `Math.round` in `polarity.ts` goes). The 9-hp Lectern returns at 4.5, since its hp is already fractional (1.75 per hit).
10. **NOW.** Warmth and conversion count only if no hook cancelled `actorDamage`. The cancel flag is tested, not `damageActor`'s return value. A landed hit that deals 0 (a 1-hp positive hit) still adds warmth.
11. **NOW (rule and docs).** Only a negative intention relapses an ally. Any other source that takes an ally to zero releases it, as today. ACTORS §4 names bombs, lava, fire and contact.
12. **NOW, with a ledger entry.** The warm tint on projections is allowed as "your light held captive" (ART-GUIDE §2, DECISIONS §2), only if its cause is the player and it stays low. But ART-GUIDE §2 says "Projections are cold." The art gate decides, records the ruling in DECISIONS.md (§14.1), and keeps the art-content test green in the same change.
13. **NOW.** The process point is accepted, and its premise corrected: the pre-ruling edits break typecheck. The loaded polarity is passed at `game.ts:1211` before anything else changes.

**Open questions.**

- (a) Yes: a base-game rule, scoped to positive intention hits (shots and weapons only), enforced after `actorDamage`. The owner's "killed this way releases" implies it but does not say "never", so it is an added rule.
- (b) Weapons carry polarity now (ruling 3). Intention-only would leave a positive player's blade killing projections at full damage under a "mends" label.
- (c) Full-health allies are passed by positive shots and always hit by negative ones. Damaged allies are healed by positive shots, which absorb the shot.
- (d) `hp = max(hp, 0.5 × maxHp)`: Doubt 6, the Lectern 4.5, Panic 3.5.
- (e) No reseal. The trigger is gated on `!cleared`, and §1.1 says only "turns hostile again". A relapse before the clear keeps the existing fight.
- (f) No. A cancelled hit gives no warmth, no conversion and no `factionChange`. A landed hit that deals 0 still counts.

**Added rules, for owner ruling.**

- A positive intention never kills a projection. The cap comes after `actorDamage`, so items cannot break it. Scope: intention hits only.
- A converted projection returns with at least half its maximum health (on conversion and on relapse).
- Only a negative intention relapses an ally. Other sources release it.
- No reseal: a relapsed projection in a cleared room never closes doors.
- Weapons add warmth at most once per target per strike.
- Positive shots pass full-health allies; negative shots always hit allies.

## 4. Resolution

Built as ruled, with these results:

- **Rules:** `src/combat/polarity.ts` (pure, tested in `tests/polarity.test.ts`, 17 tests). `Game` applies `resolveHit` inside `damageActor`: the halving happens before `actorDamage`, the positive ceiling after it, and warmth and conversion only when the hit is not cancelled.
- **Weapons:** the `strike` payload carries the loaded polarity. A stroke warms each target once (`Game.stroke`). The beam's repeat ticks still deal damage.
- **Allies:** `meetsIntention` (a healthy ally passes a positive shot and a negative one always hits it) and `allyHeal`. A relapse is decided before `hurt`, so an ally at zero does not dissolve. No reseal.
- **Conversion floor:** `convertedHp` gives at least half maximum health on conversion and on relapse. The Lectern returns at 4.5, as ruled.
- **Art (Opus 5.5 agent, `docs/art/DECISIONS.md` §14.1):** the negative intention is ash shell, ember core and ember halo at 0.6×, with no cold anywhere. The HUD mark is a gold disc (positive) or an ember ring round an ink centre (negative), 14 px, no animation. Projection warming uses `captive.ember` × 0.35 × warmth, held under the dimmest ally glow. Ally glow is `light.ember` × 0.25 × (0.5 + 0.5 · hp/maxHp). The colours await the owner's confirmation.
- **Verified in the browser:** F flips the HUD mark (attributes, title, toast, both languages). A debug-driven sequence converted a Doubt in five positive hits, took full damage on the ally from a negative shot, relapsed it at zero to half health, and healed a hurt ally. No console errors. The simulation only advances after pointer lock, so the sequence advanced the enemy system directly. The mark itself was not captured on the play field.
- **Tests:** the full suite passes (200 tests), with typecheck and the link check clean.

Open after this change:

- **Weapon look.** Blade, beam and great-cut strikes still use `light.hot` whatever the polarity. The HUD says negative while a blade looks the same. This needs an art ruling, so it is flagged, not built.
- **Bombs, blasts, lava, fire, kicks and contact** keep today's damage, as ruled. They release allies and projections alike.
- **Owner to confirm** the negative colours (DECISIONS §14.1).
- **Not built:** inhabitants, presences, the gifts of full-health allies, warmth decay, and the Threshold Guardian.
