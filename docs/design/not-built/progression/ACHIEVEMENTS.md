# Achievements

Up: [progression](README.md) · Status: decided (owner, issue #147, decisions 8 and 10). The names are a proposal for the owner to confirm. Not built.

An achievement is a moment the game recognises once and keeps for ever: the first time a boss is overcome, a meditation sat three times, a first potion, a first meal. Each one raises the Roots' [mastery level](MASTERY.md) by one and tells the player what the Roots gained.

## 1. The 22 that ship with #147

Ids are stable: the save refers to them. Names follow `sotano-lore`: each names what the moment means, not the mechanic.

### Bosses: the first time each is overcome (14)

"Overcome" is the game's own word for a boss's defeat (`toast.bossDown`): its health reaching zero, its turning to the player's side through good intentions, or, for the Shadow, the player standing still beside it. All three run the same defeat (`bossDown` in `src/game/game.ts`). Every first time counts, several in one run too.

| Id | Boss | Name (EN) | Name (ES) | Description (EN) | Description (ES) |
|---|---|---|---|---|---|
| `boss.resistance` | Resistance | The Work Begins | Empieza la obra | Overcome Resistance for the first time. | Supera a la Resistencia por primera vez. |
| `boss.inertia` | Inertia | The First Push | El primer empujón | Overcome Inertia for the first time. | Supera a la Inercia por primera vez. |
| `boss.insatiable` | The Insatiable | Full Enough | La justa medida | Overcome the Insatiable for the first time. | Supera al Insaciable por primera vez. |
| `boss.overwhelm` | Overwhelm | One Wave at a Time | Ola a ola | Overcome Overwhelm for the first time. | Supera a Desbordar por primera vez. |
| `boss.hoard` | The Hoard | Open Hands | Manos abiertas | Overcome the Hoard for the first time. | Supera al Acaparador por primera vez. |
| `boss.downpour` | The Downpour | After the Rain | Después de la lluvia | Overcome the Downpour for the first time. | Supera al Aguacero por primera vez. |
| `boss.threshold-guardian` | The Threshold Guardian | Across the Threshold | Al otro lado del umbral | Overcome the Threshold Guardian for the first time. | Supera al Guardián del Umbral por primera vez. |
| `boss.verdict` | The Verdict | Free to Be Wrong | Libre para equivocarse | Overcome the Verdict for the first time. | Supera al Veredicto por primera vez. |
| `boss.grudge` | The Grudge | Letting Go | Soltar | Overcome the Grudge for the first time. | Supera al Rencor por primera vez. |
| `boss.old-rule` | The Old Rule | A Rule Outgrown | Una regla que se quedó pequeña | Overcome the Old Rule for the first time. | Supera a la Vieja Regla por primera vez. |
| `boss.furnace` | The Furnace | Already Enough | Ya es suficiente | Overcome the Furnace for the first time. | Supera al Horno por primera vez. |
| `boss.impostor` | The Impostor | Nothing to Hide | A cara descubierta | Overcome the Impostor for the first time. | Supera al Impostor por primera vez. |
| `boss.many-faces` | The Many Faces | One Face | Una sola cara | Overcome the Many Faces for the first time. | Supera a Muchas Caras por primera vez. |
| `boss.shadow` | The Shadow | Coming Home | Volver a casa | Overcome the Shadow for the first time. | Supera a la Sombra por primera vez. |

Why these names: each answers the boss's pattern (`pattern` in its definition). Resistance stops creative work, so beating it begins the work; Inertia wakes with a push; the Insatiable wants to be full, and the answer is the right measure; Overwhelm is too much at once; the Hoard holds on to everything; the Downpour keeps the room grey; the Guardian keeps the edge of change; the Verdict wants to be beyond reproach; the Grudge never wants to be hurt again; the Old Rule is a belief from childhood; the Furnace wants to be enough; the Impostor fears being found out; the Many Faces wants to be loved; the Shadow wants to be seen and to come home.

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

## 2. The data model (takes the other 78 without code changes)

The catalogue is data, in `src/content/achievements.ts`:

```ts
interface AchievementDef {
  id: string;                                    // stable, `^[a-z0-9.-]+$`
  on: keyof GameEvents;                          // the event that may unlock it
  where?: Readonly<Record<string, string | number | boolean>>;  // payload fields that must match
  times?: number;                                // matching events needed across runs (default 1)
}
```

The 22 are written as data: `{ id: 'boss.resistance', on: 'bossOvercome', where: { boss: 'resistance' } }`, `{ id: 'meditation.ground', on: 'meditationComplete', where: { meditation: 'ground' }, times: 3 }`, `{ id: 'brew.first', on: 'brew' }`, `{ id: 'cook.first', on: 'cook' }`. One tracker in the game listens to every event the catalogue names, matches `where` against the payload, counts matches per id in the save when `times` > 1, and unlocks the id when the count is reached. A new achievement for #179 is a new entry and two message keys (`achievement.<id>.name`, `achievement.<id>.desc`); it needs new code only if no existing event says what it waits for (then the event is added like any event: emit site, synergy-matrix sample, contract list).

New events the 22 need (`src/game/events.ts`):

| Event | Payload | Emitted |
|---|---|---|
| `bossOvercome` | `{ boss: string; floor: number }` | In `bossDown`, once per boss room, with the floor's boss id |
| `meditationComplete` | `{ meditation: string; source: 'roots' \| 'vault' }` | When the Sanctuary ends with `complete`, from the Roots' chest or a vault's Boundary |
| `cook` | `{ meal: 'meal-small' \| 'meal-hearty'; part: string }` | When a kitchen turns a part into a meal (`src/game/kitchen.ts`) |

Rules the tracker keeps:

- An unlocked id is never unlocked again; its counter stops.
- An entry whose `on` is not an event, or whose `where` names a field the payload does not have, fails the catalogue test (the entries are checked against the event samples of the synergy matrix).
- The sandbox and the lab never unlock achievements and never write the save.
- The catalogue test checks every id is unique, every id has its two message keys in every language, and the total never exceeds 100.

## 3. Saved

`achievements: { <id>: <unlock time, ms> }` and `counts: { <id>: <n> }` in the save record ([SAVE](SAVE.md)). An unlock is written at once, so a closed tab never loses it.

## 4. The notice

When an achievement is earned the player reads, in one window: its name, its description, what the Roots gained, and the new mastery level.

- **Type: the Presence card** (`#banner`, `presenceCard`), the read-only blocking card that stays until the player confirms it (`sotano-popups` §2). It fits: a name and a few lines, read once, confirmed on keyboard, mouse, gamepad and touch like every banner. It gets one new option instead of a new type: a **kicker**, a short line above the name ("Achievement" / "Logro") with the gold diamond, so the card reads as an achievement and not as a presence speaking. The skill's registry row for the Presence card gains that option in the same change. A toast was rejected: it vanishes in 2.5 seconds, a new toast replaces it, and the boss-down toast fires in the same moment.
- **Lines**, in order:
  1. `achievement.<id>.desc`
  2. `achievement.card.gain`: "Next time you wake in the Roots: {gain}" / "La próxima vez que despiertes en las raíces: {gain}", where `{gain}` is the step line of the new level ([REWARDS §6](../levels/roots/REWARDS.md#6-what-each-step-says)).
  3. `achievement.card.mastery`: "Mastery of the Roots: {level} of 100" / "Maestría de las raíces: {level} de 100".
- **Kicker:** `achievement.card.kicker`: "Achievement" / "Logro".
- **When it shows.** The unlock is saved at once; the card waits for a calm moment: no other blocking window open (item banner, presence card or offer, toll, menu, death screen, Sanctuary), and the player not in a sealed room with live projections. After a boss is overcome the room is cleared, so the card shows at once, before the way down cracks open; the toll window waits until the card is closed. Pending cards are kept in the game's run state, in order, and shown one at a time; the HUD never stacks them. If the run ends first, the remaining cards are dropped (the achievements stay saved).
- **Juice.** A burst of gold motes around the player, a soft rising chime (a new short WebAudio cue, gentle, no repetition), no screen shake. The card is redrawn on a language change like the item banner (`Hud.relocalize`).
- **Cap.** At level 100 the gain line names no step if none is left; the mastery line still shows 100 of 100.

## 5. What the issue asked that the owner's decisions replace

- "The first ten improvements are earned sequentially, at most one boss step per run": replaced by decision 8 (every first defeat counts, several per run, any order).
- "A first clear of each sky plant grants its improvement": out of scope (decision 11).
- "Keep later objectives as explicitly pending entries": the catalogue holds only the 22 defined ones; the other 78 are pending in #179 and enter as data when the owner defines them.

## Open questions

- The 22 names (both languages) are a proposal.
- Does a converted boss count as overcome? Default: yes, as the game already treats it (`bossDown`).
- Should cards that were pending when a run ended show at the start of the next run? Default: no.
