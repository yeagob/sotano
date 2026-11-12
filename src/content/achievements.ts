// The achievement catalogue (docs/design/not-built/progression/ACHIEVEMENTS.md §1-2): the 40 that ship with
// #147, as data (36 plus the 4 book pages). The names and descriptions are message keys (`achievement.<id>.name|desc`,
// in src/i18n/locales). The tracker that reads this list is src/game/achievements.ts.
//
// An entry says which event may unlock it (`on`), the payload fields that must match (`where`; a list means any
// of its values) and how many matching events it needs across runs (`times`, default 1). A boss has two entries,
// `destroyed` and `converted`; the Shadow's `converted` also takes the stillness ending (`how: 'stillness'`).

/**
 * The events the catalogue listens to. `bossOvercome`, `meditationComplete` and `cook` are added to GameEvents by package D2,
 * `pageReached` (the current page of the Roots' book at a run's end) by package D1; until then nothing emits it.
 */
export const ACHIEVEMENT_EVENTS = ['bossOvercome', 'meditationComplete', 'brew', 'cook', 'pageReached'] as const;
export type AchievementEvent = (typeof ACHIEVEMENT_EVENTS)[number];

export type WhereValue = string | number | boolean | readonly (string | number)[];

export interface AchievementDef {
  /** Stable, shaped `^[a-z0-9.-]+$`: the save refers to it. */
  readonly id: string;
  readonly on: AchievementEvent;
  /** Payload fields that must match. A list value matches any of its items. */
  readonly where?: Readonly<Record<string, WhereValue>>;
  /** Matching events needed across runs (default 1). */
  readonly times?: number;
}

/** The bosses of the catalogue: the ids of src/content/bosses (each one has a `destroyed` and a `converted` entry). */
export const ACHIEVEMENT_BOSSES = [
  'resistance', 'inertia', 'insatiable', 'overwhelm', 'hoard', 'downpour', 'threshold-guardian',
  'verdict', 'grudge', 'old-rule', 'furnace', 'impostor', 'many-faces', 'shadow',
] as const;

/** The meditations of the catalogue: the scene ids of src/content/presences/meditations.ts. */
export const ACHIEVEMENT_MEDITATIONS = ['ground', 'dusk', 'night', 'box', 'warm', 'river'] as const;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // Bosses destroyed: their health reaches zero (14).
  { id: 'boss.resistance.destroyed', on: 'bossOvercome', where: { boss: 'resistance', how: 'destroyed' } },
  { id: 'boss.inertia.destroyed', on: 'bossOvercome', where: { boss: 'inertia', how: 'destroyed' } },
  { id: 'boss.insatiable.destroyed', on: 'bossOvercome', where: { boss: 'insatiable', how: 'destroyed' } },
  { id: 'boss.overwhelm.destroyed', on: 'bossOvercome', where: { boss: 'overwhelm', how: 'destroyed' } },
  { id: 'boss.hoard.destroyed', on: 'bossOvercome', where: { boss: 'hoard', how: 'destroyed' } },
  { id: 'boss.downpour.destroyed', on: 'bossOvercome', where: { boss: 'downpour', how: 'destroyed' } },
  { id: 'boss.threshold-guardian.destroyed', on: 'bossOvercome', where: { boss: 'threshold-guardian', how: 'destroyed' } },
  { id: 'boss.verdict.destroyed', on: 'bossOvercome', where: { boss: 'verdict', how: 'destroyed' } },
  { id: 'boss.grudge.destroyed', on: 'bossOvercome', where: { boss: 'grudge', how: 'destroyed' } },
  { id: 'boss.old-rule.destroyed', on: 'bossOvercome', where: { boss: 'old-rule', how: 'destroyed' } },
  { id: 'boss.furnace.destroyed', on: 'bossOvercome', where: { boss: 'furnace', how: 'destroyed' } },
  { id: 'boss.impostor.destroyed', on: 'bossOvercome', where: { boss: 'impostor', how: 'destroyed' } },
  { id: 'boss.many-faces.destroyed', on: 'bossOvercome', where: { boss: 'many-faces', how: 'destroyed' } },
  { id: 'boss.shadow.destroyed', on: 'bossOvercome', where: { boss: 'shadow', how: 'destroyed' } },

  // Bosses turned to your side: good intentions convert them; the Shadow's stillness ending counts too (14).
  { id: 'boss.resistance.converted', on: 'bossOvercome', where: { boss: 'resistance', how: 'converted' } },
  { id: 'boss.inertia.converted', on: 'bossOvercome', where: { boss: 'inertia', how: 'converted' } },
  { id: 'boss.insatiable.converted', on: 'bossOvercome', where: { boss: 'insatiable', how: 'converted' } },
  { id: 'boss.overwhelm.converted', on: 'bossOvercome', where: { boss: 'overwhelm', how: 'converted' } },
  { id: 'boss.hoard.converted', on: 'bossOvercome', where: { boss: 'hoard', how: 'converted' } },
  { id: 'boss.downpour.converted', on: 'bossOvercome', where: { boss: 'downpour', how: 'converted' } },
  { id: 'boss.threshold-guardian.converted', on: 'bossOvercome', where: { boss: 'threshold-guardian', how: 'converted' } },
  { id: 'boss.verdict.converted', on: 'bossOvercome', where: { boss: 'verdict', how: 'converted' } },
  { id: 'boss.grudge.converted', on: 'bossOvercome', where: { boss: 'grudge', how: 'converted' } },
  { id: 'boss.old-rule.converted', on: 'bossOvercome', where: { boss: 'old-rule', how: 'converted' } },
  { id: 'boss.furnace.converted', on: 'bossOvercome', where: { boss: 'furnace', how: 'converted' } },
  { id: 'boss.impostor.converted', on: 'bossOvercome', where: { boss: 'impostor', how: 'converted' } },
  { id: 'boss.many-faces.converted', on: 'bossOvercome', where: { boss: 'many-faces', how: 'converted' } },
  { id: 'boss.shadow.converted', on: 'bossOvercome', where: { boss: 'shadow', how: ['converted', 'stillness'] } },

  // Meditations: a sitting completed three times, across runs (6).
  { id: 'meditation.ground', on: 'meditationComplete', where: { meditation: 'ground' }, times: 3 },
  { id: 'meditation.dusk', on: 'meditationComplete', where: { meditation: 'dusk' }, times: 3 },
  { id: 'meditation.night', on: 'meditationComplete', where: { meditation: 'night' }, times: 3 },
  { id: 'meditation.box', on: 'meditationComplete', where: { meditation: 'box' }, times: 3 },
  { id: 'meditation.warm', on: 'meditationComplete', where: { meditation: 'warm' }, times: 3 },
  { id: 'meditation.river', on: 'meditationComplete', where: { meditation: 'river' }, times: 3 },

  // Stations: the first potion brewed, the first meal cooked (2).
  { id: 'brew.first', on: 'brew' },
  { id: 'cook.first', on: 'cook' },

  // Book pages: the Roots' book reached at a page number (4). Pages 54, 69 and 100 need that many pages in the book.
  { id: 'book.page.7', on: 'pageReached', where: { page: 7 } },
  { id: 'book.page.54', on: 'pageReached', where: { page: 54 } },
  { id: 'book.page.69', on: 'pageReached', where: { page: 69 } },
  { id: 'book.page.100', on: 'pageReached', where: { page: 100 } },
];

/** The most achievements the catalogue can hold: the mastery level is capped at this. */
export const ACHIEVEMENT_CAP = 100;
