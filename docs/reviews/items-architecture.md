# Review: item & synergy architecture (M1)

A three-party review of the proposal in [../ITEMS.md](../ITEMS.md), as requested by the project owner:

- **Engineer** — wrote the proposal and implements the outcome.
- **Architect** — attacks the proposal, finds weaknesses, proposes alternatives.
- **Mediator** — external technical consultant: weighs each critique against the owner's goals and decides.

The owner's goals, in their words (translated): *everything must potentially be affected by items — the one-block carry limit, how we interact with cubes (e.g. breaking weak ones on contact), what happens when you drop them, jumping, movement. How items are created, stored and treated so they can affect everything and everything can affect them, and so we can fix exceptions easily.* Also: *without too much complexity for now.*

---

## 1. Architect's critique

### Verdict

The core idea — items as data plus hooks, stats recomputed from scratch, exceptions in one file — is right. The weakness is the edges: the Inventory assumes it is the only thing that can ever change stats or hooks, items have no lifecycle or state, and the event set only covers "items change blocks". As written, "everything can affect items" (curses, rooms, enemies, timed effects) isn't possible, and about half of the typical Isaac item patterns would need workarounds that break the "rebuild from scratch, no residue" guarantee.

### Critiques

1. **(High) The Inventory wipes the whole StatSheet; only items can install effects.** `stats.clear()` in `rebuild()` erases any non-item modifier (curse, room aura, timed potion) on every pickup; synergies and `suppress` only look at held items, so a curse can't disable an item. *Proposal:* an `EffectHost` owning every active effect from any source (items, synergies, curses, rooms, buffs), with the Inventory as one provider; wildcard suppression (`'drill.*'`).
2. **(High) No lifecycle, no per-instance state, no stable instance identity.** No `onAcquire`/`onLose`; a one-shot effect placed in install code would re-fire on every rebuild. Counters and charges have nowhere to live. Sources are keyed by array index, so `lose()` renumbers later copies. *Proposal:* `ItemInstance { uid, id, state }`, `initState`, `onAcquire`/`onLose` (never called by `restore`), hooks receive the instance; serialize instances.
3. **(High) The owner's own list isn't fully covered by events.** The pickup-vs-kick decision is hard-coded (can't write "stack same-type blocks beyond carry"); no `drop` event; `blockPlace` can only cancel; missing `tick`, `land`, `intentHit`, `roomClear`; `kick`/`debrisImpact` don't identify the cube; conditional stats ("+damage while holding a block") impossible. *Proposal:* one `contactCube { cube, action: 'pickup'|'kick'|'ignore' }` decision event; add `drop`, `land`, `intentHit`; mutable `blockPlace.material`; stat values as `number | (q) => number` with `invalidate()`.
4. **(High) `suppress` doesn't scale.** Two synergies replacing the same hook both install (double effect, undetected); stats can't be suppressed; synergy hooks have no ids; item/synergy ids share a namespace; `requires` is AND-only (no "3 items tagged X" transformations). *Proposal:* structured `Req` (`{tag,count}`, `{not}`, `{any}`), `replaces` with most-specific-wins, `suppressStats`, mandatory ids, a test that fails on ambiguous double replacement.
5. **(Medium) Hook order depends on history.** Stable sort by insertion means order changes after rebuilds relative to other hooks; `final` stat layer is "last wins" by acquisition order. *Proposal:* sort by `(priority, sourceRank, sourceId, hookId)`; permutation-equivalence test.
6. **(Medium) Event semantics underspecified.** `cancel()` stops later hooks so side effects never learn of a veto; side effects at 200 run before the game commits; fact fields are writable; at max depth the event is silently cancelled (changes gameplay). *Proposal:* pre/post phases (`blockBreak` mutable, `blockBroken` readonly, only if not cancelled); readonly fact fields; defer instead of drop at max depth.
7. **(Medium) Deferred reactions are unowned.** They outlive their item, aren't saved, can hit the next floor's world after a trapdoor; queue has no total cap; Chain uses damage *kind* as provenance, which excludes future crush sources; "full chain reaction" description vs one-ring code. *Proposal:* `defer(fn, { source, cause })` with a `cause { origin, gen }` carried through damage → break; `off(source)` drops pending calls; clear on `floorEnter`; cap the queue.
8. **(Medium) Cube tags are untyped strings, never consumed.** Typos fail silently; a volatile cube explodes on every bounce; only cubes have tags. *Proposal:* typed tag registry; impact consumes the tag; same tag set on intents/entities (TearFlags).
9. **(Medium) Determinism and saves.** No RNG in `ItemApi` (first "10% chance" item will use `Math.random`); pools and RNG state not serializable; `restore()` doesn't remove held items from pools. *Proposal:* `api.rng(stream)`, `Rng.getState/setState`, serializable pools.
10. **(Low) Testing.** Add permutation-equivalence, no-double-replacement, gain→lose leaves no residue, recording `ItemApi` stub.
11. **(Low) Over-engineering.** Lean, if anything too lean; replace the `'tag:'` prefix parsing with a structured `Req`.

### Keep as is

`defineItem` + one file per item + typed `hook()`; the `ItemApi` facade; recomputed layered stats; `synergies.ts` as the single home for exceptions with suppression by `itemId.hookId`; ids in acquisition order as save format (extended with state); per-purpose RNG streams; `bus.trace`; priority bands; `crush` as a stat driving a core rule.

---

## 2. Mediator's ruling

### Summary

The architect is right about the foundation, but most fixes can be small: rebuild must stop wiping effects it doesn't own, items need a stable identity and a one-shot "on gain" moment, the cube-contact decision should be an event, and the bus must fail safely. The bigger machinery (a general EffectHost for curses and rooms, per-item state, pre/post event phases, cause tracking, serializable RNG and pools) waits for the milestones that need it. **Missed by both:** the game loop was still the M0 code, so half of the "everything is a stat or an event" contract wasn't wired at all. M1 must make that contract true and test it.

### Fact-check

- #1 `stats.clear()` — true; `removeSource` already exists, so the fix is one line.
- #2 index-keyed sources — true, harmless today (rebuild reinstalls everything); it bites once state or deferred work is keyed by source.
- #5 history-dependent order — **overstated** for M1: only item/synergy hooks exist and they're always reinstalled in acquisition order.
- #6 max depth — true (not silent: there's a warning), and a real gameplay bug: a cancelled `blockBreak` leaves a 0-HP block standing.
- #7 "full chain" vs one ring — true, and worse: `breakBlock` didn't pass `source`, so Wrecking Ball never fired.
- #8 volatile explodes every bounce — true: tags were never cleared.

### Decisions

| # | Critique | Decision | M1 action / later |
|---|---|---|---|
| 1 | Inventory wipes StatSheet | **Now (minimal)** | `rebuild()` removes only its own sources. EffectHost + wildcard suppression → M2 (curses, rooms). |
| 2 | Lifecycle, state, identity | **Now: identity + onGain**; state → M2 | `ItemInstance { uid, def }`, source `item:<uid>`; `onGain(api)` only from `gain()`, never from rebuild/restore. `state`/`initState` → M2. |
| 3 | Event coverage | **Now (partial)** | `touchCube { cube, action: 'pickup'\|'kick'\|'ignore' }` replaces `pickup`; add `drop`, `land`; mutable `blockPlace.material`; cube ids on `kick`/`throw`/`debrisImpact`. `tick`, `intentHit`, `roomClear`, conditional stats → M2. |
| 4 | `suppress` doesn't scale | **Now: checks only**; rest → M2 | Synergy hooks need ids; tests: no hook suppressed by two co-active synergies; no synergy/item id collision. `replaces`, `suppressStats` → M2. |
| 5 | History-dependent order | **Later (M2)** | Sort by `(priority, sourceRank, seq)` once non-item hooks exist. Permutation test rejected: acquisition order legitimately matters. |
| 6 | Event semantics | **Now: depth only**; rest → M2 | At max depth: warn and return the payload uncancelled with no hooks run. Document: cancel only below 200. Pre/post phases → M2. |
| 7 | Deferred reactions unowned | **Now (minimal)** | `defer(fn, source)`; `off(source)` purges its pending calls; clear on new floor/run. Chain guards on `source === 'chain'`. Cause/gen + queue cap → M2. |
| 8 | Cube tags | **Now: consumption**; typing → M2 | Core clears a cube's tags after `debrisImpact` unless a hook sets `keepTags`. Items export tag constants. |
| 9 | Determinism, saves | **Now: `api.rng()`**; saves → M4 | `api.rng()` on a new `items` stream. RNG state, pool serialization, restore-removes-from-pools → M4. |
| 10 | Testing | **Now (subset)** | gain→lose leaves no residue (stats, hooks, deferred); double-suppression test. Permutation equivalence rejected. |
| 11 | `'tag:'` parsing | **Now** | `type Req = string \| { tag: string; count?: number }`. `not`/`any` → M2. |

### Missed by both

1. The contract wasn't wired in `game.ts` (old `install` path, single held block, `kick`/`throw` stats ignored, `jump`/`touchBlock`/`debrisImpact` never emitted). These are the owner's priority-1 list.
2. One throwing hook crashes the frame: wrap each hook in try/catch and log its source.
3. Introspection: `bus.dump()` (hooks per event with source, id, priority) in the dev console.
4. `restore()` silently drops unknown ids: warn.

## 3. Engineer's resolution

All "Now" decisions are implemented in M1; "Later" items are tracked in [../ITEMS.md §9](../ITEMS.md#9-deferred-decisions-from-the-architecture-review). Wrecking Ball's description was changed to match its behaviour (one ring around each block you shatter by contact).

- **Bus:** per-hook try/catch logging `source` and hook id; at max depth the event returns uncancelled without running hooks; `defer(fn, source)`, `off(source)` purges pending calls, `clearDeferred()`, `dump()` (`S.hooks()` in the console).
- **Inventory:** `ItemInstance { uid, def }`, sources `item:<uid>` / `syn:<id>`, removes only its own stat sources, `onGain` only from `gain()`, structured `Req`, warns on unknown ids.
- **Events:** `touchCube` decision event, `drop`, `land`, mutable `blockPlace.material`, cube ids on `kick`/`throw`/`debrisImpact`, `keepTags`, `source` on `blockBreak`.
- **Game:** carry stack limited by `floor(carry)`; `kick`/`throw` stats; `jump` and `land` emitted; contact crushing via `touchBlock`; tags consumed after impact; deferred queue cleared on each new floor.
- **API:** `api.rng()` (stream `items`), `api.held()`.
- **Tests:** contract test (every event has an emit site, every stat is read outside `stats.ts`), no residue after gain→lose, no double suppression, no id collisions.

## 3. Engineer's resolution

*(pending)*
