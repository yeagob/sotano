# Achievements

Up: [progression](README.md) · Status: decided (owner, issue #147, decisions 8 and 10). The names are a proposal for the owner to confirm. Not built.

An achievement is a moment the game recognises once and keeps for ever: the first time a boss is destroyed or turned to your side, a meditation sat three times, a first potion, a first meal, a page of the hidden book reached. Each one raises the Roots' [mastery level](MASTERY.md) by one and tells the player what the Roots gained.

## 1. The 40 that ship with #147

Ids are stable: the save refers to them. Names follow `sotano-lore`: each names what the moment means, not the mechanic.

### Bosses: destroyed, and turned to your side (28)

Each boss has two achievements, independent of each other (owner, 2026-11-12):

- **Destroyed**: the boss's health reaches zero. Good intentions never take a projection's last point (`src/combat/polarity.ts`), so zero is always the work of harm: bad intentions, bombs, kicked or thrown blocks, weapons.
- **Turned to your side**: good intentions fill its warmth and it converts (`convert` in `src/game/game.ts`), staying in the room as an ally.

A player who only converts a boss gets only that boss's conversion achievement; holding both means doing each at least once, in different runs (a boss is overcome once per run). Every first time counts, several in one run too.

**The Shadow's own ending.** Standing still beside the Shadow for three seconds ends its fight (`src/content/bosses/shadow.ts` ends it through its behaviour, not through damage). The design counts it as **turning it to your side**, not as destroying it: its pattern wants "to be seen, and to come home", and the stillness ending is the game's integration of the Shadow, the opposite of breaking it. So `boss.shadow.converted` unlocks by a conversion or by the stillness ending, and `boss.shadow.destroyed` only by bringing its health to zero.

The event says how: `bossOvercome { boss, floor, how }` with `how` one of `destroyed`, `converted`, `stillness` (section 2).

#### Destroyed (14)

| Id | Boss | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `boss.resistance.destroyed` | Resistance | The Work Begins | Empieza la obra | Destroy Resistance: bring its health to zero. | Destruye a la Resistencia: deja su salud a cero. |
| `boss.inertia.destroyed` | Inertia | The First Push | El primer empujón | Destroy Inertia: bring its health to zero. | Destruye a la Inercia: deja su salud a cero. |
| `boss.insatiable.destroyed` | The Insatiable | The Cup Breaks | La copa se rompe | Destroy the Insatiable: bring its health to zero. | Destruye al Insaciable: deja su salud a cero. |
| `boss.overwhelm.destroyed` | Overwhelm | One Wave at a Time | Ola a ola | Destroy Overwhelm: bring its health to zero. | Destruye a Desbordar: deja su salud a cero. |
| `boss.hoard.destroyed` | The Hoard | Open Hands | Manos abiertas | Destroy the Hoard: bring its health to zero. | Destruye al Acaparador: deja su salud a cero. |
| `boss.downpour.destroyed` | The Downpour | After the Rain | Después de la lluvia | Destroy the Downpour: bring its health to zero. | Destruye al Aguacero: deja su salud a cero. |
| `boss.threshold-guardian.destroyed` | The Threshold Guardian | Across the Threshold | Al otro lado del umbral | Destroy the Threshold Guardian: bring its health to zero. | Destruye al Guardián del Umbral: deja su salud a cero. |
| `boss.verdict.destroyed` | The Verdict | Free to Be Wrong | Libre para equivocarse | Destroy the Verdict: bring its health to zero. | Destruye al Veredicto: deja su salud a cero. |
| `boss.grudge.destroyed` | The Grudge | Letting Go | Soltar | Destroy the Grudge: bring its health to zero. | Destruye al Rencor: deja su salud a cero. |
| `boss.old-rule.destroyed` | The Old Rule | A Rule Outgrown | Una regla que se quedó pequeña | Destroy the Old Rule: bring its health to zero. | Destruye a la Vieja Regla: deja su salud a cero. |
| `boss.furnace.destroyed` | The Furnace | Already Enough | Ya es suficiente | Destroy the Furnace: bring its health to zero. | Destruye al Horno: deja su salud a cero. |
| `boss.impostor.destroyed` | The Impostor | Nothing to Hide | A cara descubierta | Destroy the Impostor: bring its health to zero. | Destruye al Impostor: deja su salud a cero. |
| `boss.many-faces.destroyed` | The Many Faces | One Face | Una sola cara | Destroy the Many Faces: bring its health to zero. | Destruye a Muchas Caras: deja su salud a cero. |
| `boss.shadow.destroyed` | The Shadow | Light on the Shadow | Luz sobre la sombra | Destroy the Shadow: bring its health to zero. | Destruye a la Sombra: deja su salud a cero. |

#### Turned to your side (14)

| Id | Boss | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `boss.resistance.converted` | Resistance | A Steady Door | Una puerta firme | Turn Resistance to your side with good intentions. | Pon a la Resistencia de tu lado con intenciones buenas. |
| `boss.inertia.converted` | Inertia | Rest, Not a Stop | Descanso, no parada | Turn Inertia to your side with good intentions. | Pon a la Inercia de tu lado con intenciones buenas. |
| `boss.insatiable.converted` | The Insatiable | Full Enough | La justa medida | Turn the Insatiable to your side with good intentions. | Pon al Insaciable de tu lado con intenciones buenas. |
| `boss.overwhelm.converted` | Overwhelm | A Tide That Holds | Una marea que sostiene | Turn Overwhelm to your side with good intentions. | Pon a Desbordar de tu lado con intenciones buenas. |
| `boss.hoard.converted` | The Hoard | Enough to Share | Bastante para compartir | Turn the Hoard to your side with good intentions. | Pon al Acaparador de tu lado con intenciones buenas. |
| `boss.downpour.converted` | The Downpour | Rain That Waters | Lluvia que riega | Turn the Downpour to your side with good intentions. | Pon al Aguacero de tu lado con intenciones buenas. |
| `boss.threshold-guardian.converted` | The Threshold Guardian | A Guide at the Edge | Un guía en el borde | Turn the Threshold Guardian to your side with good intentions. | Pon al Guardián del Umbral de tu lado con intenciones buenas. |
| `boss.verdict.converted` | The Verdict | A Fair Judge | Un juez justo | Turn the Verdict to your side with good intentions. | Pon al Veredicto de tu lado con intenciones buenas. |
| `boss.grudge.converted` | The Grudge | A Lighter Heart | Un corazón más ligero | Turn the Grudge to your side with good intentions. | Pon al Rencor de tu lado con intenciones buenas. |
| `boss.old-rule.converted` | The Old Rule | The Rule, Rewritten | La regla, reescrita | Turn the Old Rule to your side with good intentions. | Pon a la Vieja Regla de tu lado con intenciones buenas. |
| `boss.furnace.converted` | The Furnace | A Fire That Warms | Un fuego que abriga | Turn the Furnace to your side with good intentions. | Pon al Horno de tu lado con intenciones buenas. |
| `boss.impostor.converted` | The Impostor | You Belong Here | Este es tu sitio | Turn the Impostor to your side with good intentions. | Pon al Impostor de tu lado con intenciones buenas. |
| `boss.many-faces.converted` | The Many Faces | Loved as You Are | Que te quieran como eres | Turn the Many Faces to your side with good intentions. | Pon a Muchas Caras de tu lado con intenciones buenas. |
| `boss.shadow.converted` | The Shadow | Coming Home | Volver a casa | Turn the Shadow to your side, or stay still beside it until it comes home. | Pon a la Sombra de tu lado, o no te muevas de su lado hasta que vuelva a casa. |

Why these names: each answers the boss's pattern (`pattern` in its definition), once as the pattern broken and once as the pattern befriended. Resistance stops creative work: broken, the work begins; befriended, it is a door that holds steady. Inertia is rest that became a stop: pushed, it moves; befriended, it is rest again. The Insatiable wants to be full: its cup breaks, or it learns the right measure. Overwhelm is too much at once: taken a wave at a time, or a tide that holds you. The Hoard holds on to everything: open hands, or enough to share. The Downpour keeps the room grey: after the rain, or rain that waters. The Guardian keeps the edge of change: crossed, or a guide at the edge. The Verdict wants to be beyond reproach: free to be wrong, or a fair judge. The Grudge never wants to be hurt again: letting go, or a lighter heart. The Old Rule is a belief from childhood: outgrown, or rewritten. The Furnace wants to be enough: already enough, or a fire that warms instead of burning. The Impostor fears being found out: nothing to hide, or belonging. The Many Faces wants to be loved: one face, or loved as you are. The Shadow wants to be seen and to come home: light on it, or bringing it home.

Renamed from the first draft, whose single boss achievement became the "destroyed" one: the Insatiable's was "Full Enough" (now its conversion name), it is "The Cup Breaks"; the Shadow's was "Coming Home" (now its conversion name), it is "Light on the Shadow". The ids changed from `boss.<id>` to `boss.<id>.destroyed` and `boss.<id>.converted`; nothing was saved under the old ids.

### Meditations: each one completed three times (6)

"Completed" is the Sanctuary's own outcome `complete`: the timer of the chosen sitting reached zero and the player received the better reward ([MEDITATION-APP](../../built/presences/MEDITATION-APP.md)). A quick reward or a cancel does not count. The count is kept across runs, per meditation. Only a Sanctuary opened by a Boundary counts (the Roots' chest or a vault's); the debug console's `S.sanctuary()` does not.

| Id | Meditation | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `meditation.ground` | Grounding | Rooted | Con raíces | Complete the Grounding meditation three times. | Completa tres veces la meditación de Enraizamiento. |
| `meditation.dusk` | Gratitude | Lanterns at Dusk | Faroles al anochecer | Complete the Gratitude meditation three times. | Completa tres veces la meditación de Gratitud. |
| `meditation.night` | Visualization | Seen Before Done | Visto antes de hecho | Complete the Visualization meditation three times. | Completa tres veces la meditación de Visualización. |
| `meditation.box` | Box Breathing | Four Sides | Cuatro lados | Complete the Box Breathing meditation three times. | Completa tres veces la meditación de Respiración cuadrada. |
| `meditation.warm` | Self-Compassion | A Kinder Voice | Una voz más amable | Complete the Self-Compassion meditation three times. | Completa tres veces la meditación de Autocompasión. |
| `meditation.river` | Listening to the River | By the River | A la orilla del río | Complete the Listening to the River meditation three times. | Completa tres veces la meditación de Escuchar el río. |

The ids use the meditation ids of `src/content/presences/meditations.ts` (`ground`, `dusk`, `night`, `box`, `warm`, `river`). The names come from each sitting's scene (lanterns rising at dusk, the square of the breath, the river) or its practice.

### Stations: the first brew and the first meal (2)

| Id | Rule | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `brew.first` | The first potion brewed in an alembic (the `brew` event, any potion, the Plain Tonic included) | First Distillation | Primera destilación | Brew a potion in an alembic for the first time. | Destila una poción en un alambique por primera vez. |
| `cook.first` | The first meal cooked in a kitchen (a new `cook` event) | A Warm Meal | Un plato caliente | Cook a meal in a kitchen for the first time. | Prepara una comida en una cocina por primera vez. |

### Book pages (4)

The current page reaching a number at a run's end ([PAGES §1](../levels/roots/PAGES.md#1-the-current-page)): the event `pageReached { page }`. Pages 54, 69 and 100 **cannot be earned until the book has that many pages** (it has 9 today); they are in the catalogue, but a player cannot reach level 40 until the owner has written a hundred pages.

| Id | Rule | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `book.page.7` | `pageReached` with page 7 | The Hidden Book | El libro escondido | Reach page 7: the first page of the hidden book. | Llega a la página 7: la primera del libro escondido. |
| `book.page.54` | `pageReached` with page 54 | Lucky Number | Número de la suerte | Reach page 54 of the Roots' book. | Llega a la página 54 del libro de las raíces. |
| `book.page.69` | `pageReached` with page 69 | Nice | Nice | Reach page 69 of the Roots' book. | Llega a la página 69 del libro de las raíces. |
| `book.page.100` | `pageReached` with page 100 | Still Reading | Sigues leyendo | Reach page 100 of the Roots' book. | Llega a la página 100 del libro de las raíces. |

The names for 54 and 69 are the owner's; "Nice" stays as it is in both languages (the wink is English in Spanish too). Page 7 names what the player finds; page 100 says that a hundred pages in, the reading goes on.

## 2. The data model (takes the other 60 without code changes)

The catalogue is data, in `src/content/achievements.ts`:

```ts
interface AchievementDef {
  id: string;                                    // stable, `^[a-z0-9.-]+$`
  on: AchievementEvent;                          // one of ACHIEVEMENT_EVENTS: the event that may unlock it
  where?: Readonly<Record<string, string | number | boolean | readonly (string | number)[]>>;  // payload fields that must match; a list means any of them
  times?: number;                                // matching events needed across runs (default 1)
}
```

The 40 are written as data: `{ id: 'boss.resistance.destroyed', on: 'bossOvercome', where: { boss: 'resistance', how: 'destroyed' } }`, `{ id: 'boss.shadow.converted', on: 'bossOvercome', where: { boss: 'shadow', how: ['converted', 'stillness'] } }`, `{ id: 'meditation.ground', on: 'meditationComplete', where: { meditation: 'ground' }, times: 3 }`, `{ id: 'brew.first', on: 'brew' }`, `{ id: 'cook.first', on: 'cook' }`, `{ id: 'book.page.7', on: 'pageReached', where: { page: 7 } }`. The tracker (`src/game/achievements.ts`) matches `where` against the payload, counts matches per id in the save when `times` > 1, and unlocks the id when the count is reached. The game feeds it through `listenAchievements` (`game.ts`), which has one listener per name in `ACHIEVEMENT_EVENTS`; an event the tracker is not listening to never unlocks anything. A new achievement for #179 is a new entry and two message keys (`achievement.<id>.name`, `achievement.<id>.desc`); it needs new code only if no existing event says what it waits for. Then the event is added: its payload in `GameEvents` (`src/game/events.ts`), its name in `ACHIEVEMENT_EVENTS`, its emit site, a sample in the synergy matrix (`tests/synergy-matrix.test.ts`, which checks each `where` field against it), and a listener in `listenAchievements`.

New events the 40 need (`src/game/events.ts`):

| Event | Payload | Emitted |
|---|---|---|
| `bossOvercome` | `{ boss: string; floor: number; how: 'destroyed' \| 'converted' \| 'stillness' }` | In `bossDown`, once per boss room, with the floor's boss id and how it ended: `converted` from `convert`, `stillness` when the Shadow's stillness rule ends it (its behaviour marks that end), `destroyed` for every other death |
| `meditationComplete` | `{ meditation: string; source: 'roots' \| 'vault' }` | When the Sanctuary ends with `complete`, from the Roots' chest or a vault's Boundary |
| `pageReached` | `{ page: number }` | When a run's end advances the current page, once, with the new page (`RootsBook`, D1) |
| `cook` | `{ meal: 'meal-small' \| 'meal-hearty'; part: string }` | When a kitchen turns a part into a meal (`src/game/kitchen.ts`) |

Rules the tracker keeps:

- An unlocked id is never unlocked again; its counter stops.
- An entry whose `on` is not in `ACHIEVEMENT_EVENTS` fails `catalogueErrors` (`src/game/achievements.ts`); an entry whose `where` names a field the event's payload does not have fails the synergy-matrix check, against the event's sample.
- The sandbox and the lab never unlock achievements and never write the save.
- `catalogueErrors` checks every id is shaped and unique, every `on` is in `ACHIEVEMENT_EVENTS`, every `times` is a whole number from 1, every `where` value is a string, number, boolean or a list of them, and the total never exceeds the cap (100). `tests/achievements.test.ts` checks every id has its two message keys in English and in Spanish.

## 3. Saved

`achievements: { <id>: <unlock time, ms> }` and `counts: { <id>: <n> }` in the save record ([SAVE](SAVE.md)). An unlock is written at once, so a closed tab never loses it.

## 4. The notice

When an achievement is earned the player reads, in one window: its name, its description, what the Roots gained, and the new mastery level.

- **Type: the Presence card** (`#banner`, `presenceCard`), the read-only blocking card that stays until the player confirms it (`sotano-popups` §2). It fits: a name and a few lines, read once, confirmed on keyboard, mouse, gamepad and touch like every banner. It gets one new option instead of a new type: a **kicker**, a short line above the name ("Achievement" / "Logro") with the gold diamond, so the card reads as an achievement and not as a presence speaking. The skill's registry row for the Presence card gains that option in the same change. A toast was rejected: it vanishes in 2.5 seconds, a new toast replaces it, and the boss-down toast fires in the same moment.
- **Lines**, in order:
  1. `achievement.<id>.desc`
  2. `achievement.card.gain`: "Next time you wake in the Roots: {gain}" / "La próxima vez que despiertes en las raíces: {gain}", where `{gain}` is the step line of the new level ([REWARDS §7](../levels/roots/REWARDS.md#7-what-each-step-says)).
  3. `achievement.card.mastery`: "Mastery of the Roots: {level} of 100" / "Maestría de las raíces: {level} de 100".
- **Kicker:** `achievement.card.kicker`: "Achievement" / "Logro".
- **When it shows.** The unlock is saved at once; the card waits for a calm moment: no other blocking window open (item banner, presence card or offer, toll, menu, death screen, Sanctuary), and the player not in a sealed room with live projections. After a boss is overcome the room is cleared, so the card shows at once, before the way down cracks open; the toll window waits until the card is closed, and only for a card a session can show (a sandbox or the lab shows none, so a queued card never holds its toll). Pending cards are kept in order and shown one at a time; the HUD never stacks them. A card leaves the queue only when the player confirms it. A card cut off before that (a restart, a death, another banner, a jump to a floor's spawn) stays first in the queue and is shown again at the next calm moment, so no unlock is lost. Built in D2 (`game/achievement-keeper.ts`, `game.ts` `showAchievement`): the queue is kept across runs, not dropped at a run's end. This departs from the first draft's default, because a page achievement (`book.page.7`) is earned by the run's end itself and its card would otherwise never show; the owner should confirm it (open question below).
- **Juice.** A burst of gold motes around the player, a soft rising chime (a new short WebAudio cue, gentle, no repetition), no screen shake. The card is redrawn on a language change like the item banner (`Hud.relocalize`).
- **Cap.** At level 100 the gain line names no step if none is left; the mastery line still shows 100 of 100.

## 5. What the issue asked that the owner's decisions replace

- "The first ten improvements are earned sequentially, at most one boss step per run": replaced by decision 8 and its correction (two achievements per boss, destroyed and converted; every first time counts, several per run, any order).
- "A first clear of each sky plant grants its improvement": out of scope (decision 11).
- "Keep later objectives as explicitly pending entries": the catalogue holds only the 40 defined ones; the other 60 are pending in #179 (the issue still says 78 and should be updated) and enter as data when the owner defines them.

## Open questions

- The names (both languages) are a proposal, except the owner's "Lucky Number" and "Nice".
- Should cards that were pending when a run ended show at the start of the next run? The first draft said no; package D2 built yes, because the page achievements are earned at a run's end (see §4). The owner decides.
- The Shadow's stillness ending is tagged on its enemy (`STILLNESS_TAG` in `src/content/bosses/shadow.ts`); `game.ts` reads the tag when it dies and reports `how: 'stillness'`.
