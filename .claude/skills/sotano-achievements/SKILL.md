---
name: sotano-achievements
description: Achievement discipline for The Roots. Use it EVERY time an achievement is added, changed or removed, or anything grants or reads the Roots' mastery level (the rewards table of floor 0, the notice card, the save's achievements and counts). Says what an achievement is, the owner's binding rules, the exact steps to add one as data (catalogue entry, event, message keys, tests), how unlocking, saving and the notice work, how mastery gives each level a named step, and what must never be done. Also use sotano-i18n (every word), sotano-lore (names), sotano-items (a new event), sotano-popups (the card) and sotano-docs.
---

# The Roots achievements skill

An **achievement** is a moment the game remembers between runs: a boss overcome, a meditation sat to the end, a first potion, a page of the Roots' book. **Each achievement is one level of the Roots' mastery**, and the mastery level decides what floor 0 lays out for the next run. The catalogue is data; the tracker is pure; the game only feeds it events and shows a card.

Design, for depth: [ACHIEVEMENTS](../../../docs/design/built/progression/ACHIEVEMENTS.md) (the 45, the data model, the notice), [MASTERY](../../../docs/design/built/progression/MASTERY.md), [SAVE](../../../docs/design/built/progression/SAVE.md), [REWARDS](../../../docs/design/built/levels/roots/REWARDS.md) (the table, §6 rules, §7 the step lines).

## 1. The owner's rules (binding)

- **One achievement is one mastery level**, earned in any order, kept between runs. The level is the count of unlocked catalogue ids, **capped at 100**.
- **45 exist. The other 55 are pending in GitHub issue #179** and enter only when the owner defines them. **Never invent criteria**, never add a placeholder entry "to fill the slot". If an idea comes up, write it in #179 and ask.
- **Every first time counts**, several in one run too.
- **A boss has two achievements: destroyed and turned to your side.** A player who only converts gets only the conversion one. The Shadow's own ending (stillness) counts as conversion.
- **A meditation counts when completed** (never the quick reward, never a cancel), **three times per meditation, counted across runs**, and only from a Sanctuary a Boundary opened (the Roots' chest or a vault's).
- **First potion brewed; first meal cooked.**
- **Book pages: 7** (the first page of the hidden book), **54 ("Lucky Number"), 69 ("Nice"), 100.** A page achievement cannot be earned until the book has that many pages: the page never advances past the last page of the files (`RootsBook.endRun`), so `pageReached` never carries a page the book does not have.
- **The notice** shows the achievement's name, its description (what the achievement does) and the mastery level "of 100". It does **not** show what the Roots gain (owner, 2026-11-14, issue #191): the gain lines stay in the data (`gainsAt`, `gainText`) for a place that shows them later. It is the corner **Achievement notice** of `sotano-popups` §2: not blocking, no input, 5 s (7 s for a long description).
- **Names carry meaning** (`sotano-lore`): they name what the moment means, not the mechanic.
- **Out of scope, tracked elsewhere:** sky-plant first clears, the unlockables of issue #113, the completion percentage of issue #180.

## 2. Where it lives

| What | File | Notes |
|---|---|---|
| The catalogue | [src/content/achievements.ts](../../../src/content/achievements.ts) | `ACHIEVEMENTS` (entries), `ACHIEVEMENT_EVENTS` (events it may listen to), `ACHIEVEMENT_BOSSES`, `ACHIEVEMENT_MEDITATIONS`, `ACHIEVEMENT_CAP = 100` |
| The tracker (pure) | [src/game/achievements.ts](../../../src/game/achievements.ts) | `matches`, `track`, `isUnlocked`, `mastery`, `catalogueErrors` |
| The session keeper | [src/game/achievement-keeper.ts](../../../src/game/achievement-keeper.ts) | `AchievementKeeper` (track, save at once, queue notices), `sittingPayload`, `noticeKeys`, `gainText`, `tollMayOpen` |
| The events | [src/game/events.ts](../../../src/game/events.ts) `GameEvents` | `bossOvercome`, `meditationComplete`, `brew`, `cook`, `pageReached` |
| Listening and the card | `src/game/game.ts` | `listenAchievements`, `achieved`, `showAchievement`, `presentAchievement` |
| The save | [src/game/meta.ts](../../../src/game/meta.ts) | `achievements: { id: unlock time }`, `counts: { id: n }` in the version 2 record |
| The rewards table | [src/content/tables/roots-mastery.ts](../../../src/content/tables/roots-mastery.ts) | `rootsRewards(level)`, `gainsAt(level)` |
| Words | `src/i18n/locales/en.ts`, `es.ts` | `achievement.<id>.name`, `achievement.<id>.desc`, `achievement.card.*`, `mastery.gain.*` |

## 3. Anatomy of an entry

```ts
{ id: 'boss.shadow.converted', on: 'bossOvercome', where: { boss: 'shadow', how: ['converted', 'stillness'] } },
{ id: 'meditation.ground', on: 'meditationComplete', where: { meditation: 'ground' }, times: 3 },
{ id: 'brew.first', on: 'brew' },
```

- **`id`**: stable, `^[a-z0-9.-]+$`, dotted from general to particular (`boss.<boss>.<how>`, `meditation.<scene>`, `book.page.<n>`). The save refers to it: **never rename or reuse an id**. A removed id stays in old saves, is kept and simply not counted.
- **`on`**: one event of `ACHIEVEMENT_EVENTS`.
- **`where`** (optional): payload fields that must equal the value. A **list means any of its values** (the Shadow's `how`). Values are strings, numbers, booleans or lists of strings and numbers. A missing payload field never matches. No `where` means every event of that kind matches (`brew.first` counts any potion, the Plain Tonic too).
- **`times`** (optional, default 1): matching events needed **across runs**. While the entry is locked its count lives in the save's `counts`; it is removed when it unlocks.

## 4. Adding an achievement

Only one the owner defined (issue #179). In one change:

1. **Is an existing event enough?** Read `GameEvents` and the payloads of the five catalogue events. If the moment is one of them with a field to match, it is data only: go to step 3.
2. **A new event**, when nothing existing says what it waits for. Everything it needs:
   - its payload type in `GameEvents` (`src/game/events.ts`) with a doc comment that says when it fires and "React only";
   - **one emit site** in the game, at the moment itself, emitted once (guard it the way `bossDown` guards `st.defeated`);
   - its name in **`ACHIEVEMENT_EVENTS`** (`src/content/achievements.ts`), or `catalogueErrors` refuses the entry;
   - a listener line in **`listenAchievements`** in `game.ts` (priority 300, source `'achievements'`), or the tracker never hears it;
   - a sample payload in `SAMPLES` of `tests/synergy-matrix.test.ts` (TypeScript forces it), carrying every field a `where` names: the matrix checks each `where` field against its event's sample;
   - its name in the event contract list of `tests/items.test.ts` ("every event has an emit site");
   - the event row in ACHIEVEMENTS §2 and, if items may use it, `docs/architecture/ITEMS.md` (`sotano-items`).
3. **The entry** in `ACHIEVEMENTS`, in its group, with a comment line if it opens a new group.
4. **Two message keys in both languages** (`sotano-i18n`): `achievement.<id>.name` and `achievement.<id>.desc` in `src/i18n/locales/en.ts` and `es.ts`, beside the others. The description says plainly what to do ("Destroy Resistance: bring its health to zero."); the name says what it means (section 7).
5. **Tests.** Raise the count in `tests/achievements.test.ts` ("holds the 40 achievements…"), and add one test that feeds the event and unlocks exactly this id and no other. A `times` entry: test that it needs that many events and keeps its count. A new boss or meditation in `src/content` breaks the tests that check `ACHIEVEMENT_BOSSES` and `ACHIEVEMENT_MEDITATIONS` against the game: add both boss entries (destroyed and converted) or the meditation entry with `times: 3`.
6. **The mastery step** of the new level, if the catalogue grows past the levels the table names (section 6).
7. **Docs** (`sotano-docs`, `sotano-design`): the row in ACHIEVEMENTS §1, the count where it is stated, and #179 updated.

Green before committing: `tests/achievements.test.ts`, `tests/achievements-game.test.ts`, `tests/synergy-matrix.test.ts`, `tests/roots-mastery.test.ts`, `tests/i18n.test.ts`, then `npm run typecheck && npm test`.

## 5. How it works, and what must never be done

- **Tracking.** The game listens to the catalogue's events on each run's bus and hands each one to `AchievementKeeper.track(event, payload, now)`. `track` (pure) counts every matching locked entry and unlocks it when its count reaches `times`. **An unlocked id is never counted or unlocked again**: a second destruction of the same boss gives nothing.
- **Saving.** An unlock or a count change is written to the record **at once** (`saveMeta`), so a closed tab never loses it. A record from a newer build is read-only: nothing is tracked or written.
- **The notice.** Each unlock queues one `AchievementNotice` (id, level, gain lines), kept across runs (a page achievement is earned at a run's end and waits for the next calm start). `showAchievement` shows one at a time at a calm moment (playing, no window open, not in a sealed room with live projections, no transition, no notice on screen). It is the **Achievement notice** (`hud.achievementNotice`, `sotano-popups`): the kicker `achievement.card.kicker`, the name, the description, and `achievement.card.mastery` ("{level} of 100"). The card keys come from `cardKeys`, which has no gain line (issue #191). It is not blocking: it leaves after `noticeMillis(desc)` (5 s, 7 s over 70 characters) and then leaves the queue (`keeper.confirm`). The toll window waits while a notice is queued or open (`tollMayOpen`).
- **Never:**
  - unlock, count or write in the sandbox or the lab (`keeper.live` is false there; keep it so);
  - read or write the save from generation: `main.ts` loads the record once, the game passes the page and the level to the carving, and a level earned during a run takes effect at the next run;
  - re-award an id, store the mastery level, or add a second path that unlocks outside `track`;
  - unlock from a debug path (`S.sanctuary` opens a Sanctuary without a Boundary and emits nothing; keep it so);
  - show a notice with a toast or a new window type.

## 6. Mastery and the rewards table

- `mastery(state)` = unlocked ids that exist in the catalogue, capped at 100. Computed, never stored.
- `rootsRewards(level)` is a pure table: each step is written once as **the level it starts at**, in the arrays at the top of `roots-mastery.ts` (`KEYS_AT`, `BOMBS_AT`, `CHESTS_AT`, `PRACTICES_AT`, `HEARTS_AT`, `CRATE_STEPS`, and the single thresholds `DRAWS_UP_AT`, `ALTAR_AT`, `SANCTUARY_AT`…). `gainsAt(level)` names the difference between `level - 1` and `level` as message keys `mastery.gain.*`.
- **To give a level its named step:** add the threshold to the right array (or a new field with its threshold and a new branch in `gainsAt`), then
  - keep it **bounded** (REWARDS §6 limits: at most 6 keys, 5 bombs, 11 hearts with one star heart, 6 free chests, 2 extra practices, crate chance ≤ `CRATE_CHANCE_CAP`) and **monotonic** (nothing at L + 1 is less than at L);
  - add a `mastery.gain.<step>` line in `en.ts` and `es.ts` ("…lies in the Roots" / "…te espera en las raíces"), with `{n}` for a count and `{stars}` for a tier (formatted by `qualityStars`, never typed by hand);
  - keep `tests/roots-mastery.test.ts` green (levels 1 to 40 name exactly one step; 41 to 100 at least the crate step) and add a spot value for the new step;
  - update REWARDS §2 and §7.
- Floor 0 changes for a seed when the table changes: follow `sotano-levels` (a new random decision draws from a new `floor/0/roots/*` fork, and `GEN_VERSION` in `src/core/seed.ts` goes up).
- Debug: `S.mastery(36)` then `S.restart()` carves the next runs at that level, in memory only. `S.roots(7)` sets the page the next run starts on.

## 7. Names

A name says **what the moment means**; the description says what to do. Real examples:

| Id | Name (EN / ES) | Why it works |
|---|---|---|
| `boss.resistance.destroyed` | The Work Begins / Empieza la obra | Overcoming resistance is where work starts |
| `boss.verdict.converted` | A Fair Judge / Un juez justo | The inner judge, turned, becomes fair |
| `boss.shadow.converted` | Coming Home / Volver a casa | The Shadow integrated, not beaten |
| `meditation.ground` | Rooted / Con raíces | What grounding leaves in you |
| `brew.first` | First Distillation / Primera destilación | The craft, not the button |
| `book.page.54`, `book.page.69` | Lucky Number, Nice | The owner's own names: keep them as given |

Rules: short (two to four words), title case in English, sentence case in Spanish, no mechanic words ("Kill", "Defeat 10"), no trademarks, the Spanish written as native Spanish, not translated word by word. The names are a proposal the owner may change (ACHIEVEMENTS, open questions): ask when unsure.

## 8. Checklist

- [ ] The owner defined it (issue #179); no criterion invented.
- [ ] Entry in `ACHIEVEMENTS` with a stable new id; `catalogueErrors` empty; total ≤ 100.
- [ ] Existing event reused, or the new event has: `GameEvents` type, one emit site, `ACHIEVEMENT_EVENTS`, `listenAchievements`, matrix sample, contract list.
- [ ] `achievement.<id>.name` and `.desc` in English and Spanish.
- [ ] Count test raised; a test unlocks exactly this id; `times` and boss/meditation coverage tests green.
- [ ] Nothing unlocks in the sandbox or the lab; generation never touches the save; no re-award.
- [ ] If the level is new to the table: its step added, bounded, monotonic, its `mastery.gain.*` line in both languages, REWARDS updated.
- [ ] Seen in the browser: the corner notice shows the name, description and "N of 100", leaves after 5 s (7 s for a long description), in both languages, with no gain line.
- [ ] Docs: ACHIEVEMENTS §1 (and §2 for a new event), #179.
- [ ] `npm run typecheck && npm test`.
