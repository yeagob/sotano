# The save record, version 2

Up: [progression](README.md) · Status: decided (owner, issue #147: the page, the achievements and the mastery level are kept between runs; generation never reads the save). Built for the Roots' page in package D1 (`src/game/meta.ts`; `main.ts` reads it once and gives it to `Game` with the browser store; `roots-keeper.ts` writes it when a run advances). The achievements and counts are written from D2 through the same record and store: `achievement-keeper.ts` saves at once when an unlock or a count changes, and the sandbox and the lab never write. The reset is a proposal.

Today the record is version 1 (`src/game/meta.ts`): `{ v: 1, staircase: boolean, metAt?: number }`, under the browser key `the-roots.meta`. Before package D1 nothing in `src/` loaded or saved it. Version 2 is wired in D1. The sky encounter still calls a host `saveMeta` (`src/endgame/encounter.ts`, declared in `src/sky/types.ts`) that no host implements yet, so the staircase unlock is not written by the game.

## 1. Fields

```ts
interface MetaState {
  v: 2;
  staircase: boolean;                 // as version 1
  metAt?: number;                     // as version 1
  roots: { page: number };            // the current page, an integer ≥ 1
  achievements: Record<string, number>;  // unlocked id → unlock time (ms since the epoch)
  counts: Record<string, number>;     // achievement id → matching events so far (only while locked, only for `times` > 1)
}
```

- The **mastery level** is not stored: it is computed from `achievements` ([MASTERY](MASTERY.md)).
- The **shown page** (browsing) is not stored.
- The settings (`the-roots.settings`) and the language keep their own keys and are not part of this record.

## 2. Reading

| What is stored | What is read |
|---|---|
| Nothing | The default: `{ v: 2, staircase: false, roots: { page: 1 }, achievements: {}, counts: {} }` |
| A version 1 record | Migrated: `staircase` and `metAt` kept, `roots.page` 1, no achievements, no counts. Written back as version 2 at the next save |
| A version 2 record | Each field checked on its own: a page that is not an integer ≥ 1 reads as 1; an achievement whose time is not a finite number is dropped; a count that is not an integer ≥ 0 is dropped; unknown fields are dropped |
| Broken JSON, not an object, `v` missing | The default |
| A version higher than 2 (a newer build wrote it) | The default **in read-only mode**: the game plays, earns nothing persistent and never writes, so an older build cannot destroy a newer record |

Reading and writing never throw: blocked storage, a private window or a full quota read as the default and quietly skip the write, as version 1 does.

## 3. Writing

- When an achievement unlocks (at once), when a count changes, and when a run ends with the page advanced.
- `main.ts` loads the record once at start and gives the game a store and the record; the game keeps it in memory. Generation reads only what `newRun` is handed (the page and the mastery level at that moment), never the store.
- **A save merges with the store.** Every write re-reads the store at that moment and writes the union of the two records (`mergeMeta`, `saveMeta` in `src/game/meta.ts`), so two tabs of the game never overwrite each other's progress:
  - the unlocked achievements of both, each at the earlier of its two times;
  - the higher page;
  - the higher count of each counter, and a counter of an achievement now unlocked by either tab is dropped;
  - the staircase unlock if either has it, and the earlier time of it.
  
  The tab takes the merged record over (`adoptMeta`), so its later unlocks see what the store holds. A stored record of a newer build still makes the write refuse, and a read-only record is never written.
- The sandbox and the lab use an in-memory record that is never written.
- **The debug page is not saved.** `S.roots(n)` (the console) sets an in-memory override of the page the next run starts on (`startPage`, roots-keeper.ts). The record is never changed by it, and a run started on it advances nothing, so no debug page reaches the store.

## 4. Reset

- **Forget the Roots**, in the debug console: `S.meta.reset()` writes the default record (page 1, no achievements, no counts) and keeps the staircase unlock, which already has its own console command (owner, 2026-11-03). The reset is the one write that is not merged: it replaces the stored progress, as a reset means. It still writes nothing over a newer build's record.
- A player-facing reset (a "forget my progress" entry with a confirmation) is not part of #147: [open question 11](../levels/roots/OPEN-QUESTIONS.md).
- Clearing the browser's site data forgets everything, as today.

## 5. Tests

Round trip of every field; the version 1 migration; each broken field read on its own; broken JSON; the read-only newer version (a write is refused); a store that throws on read and on write; the reset keeping the staircase; two tabs (an unlock in one, a page in the other, both in the store); the merge rules (earlier unlock time, higher page, higher counts dropped when unlocked, staircase either way); the debug page never reaching the store (`tests/roots-book-game.test.ts`).
