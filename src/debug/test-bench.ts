// The test bench (docs/testing/TEST-BENCH.md): what the ?test panel does, without the DOM, so the tests can drive it.
// It owns no rule of its own. God mode reuses the console's helpers (S.god, S.keys, S.bombs, S.heal in main.ts) and
// keeps them applied on a tick; floors and the sky go through Game.debugFloor and Game.debugSky; practices through
// Game.give (with its banner) and Game.grant (quietly, for Give all). Nothing here runs unless ?test is in the URL.

import { BOSS_BY_ID, BOSS_ZONES, bossHp } from '../content/bosses';
import { ITEMS } from '../content/items';
import { LEVELS, tollOf, type LevelDef } from '../content/levels';
import type { MessageKey } from '../i18n/locales/en';
import { SPIRIT_MAX } from '../sky/types';

/** The flag is `?test`; without it nothing of the bench is loaded or built. */
export function testBenchOn(params: URLSearchParams): boolean {
  return params.has('test');
}

/** God mode tops the counters up when they fall under this, so spending one makes no sound. */
export const COUNTER_FLOOR = 90;
const COUNTER_TOP = 99;
/** `S.god(true)` sets this; a run's restart or a toll clears it, and the tick sets it again. */
const GOD_INVULN = 1e8;

/** The console's helpers the bench reuses (main.ts `S`). */
export interface BenchHelpers {
  god(on?: boolean): void;
  keys(n?: number): void;
  bombs(n?: number): void;
  /** Hearts (S.heal heals n × 4 points). */
  heal(n?: number): void;
}

/** What the bench reads and calls on the game: every member is a real Game member. */
export interface BenchGame {
  readonly player: { invulnT: number; keys: number; bombs: number; hp: number };
  readonly maxHp: number;
  readonly spiritNow: number;
  readonly inSky: boolean;
  readonly depth: number;
  debugFloor(k: number): boolean;
  debugSky(): void;
  refillSpirit(): void;
  give(id: string): void;
  grant(id: string): boolean;
}

export class TestBench {
  private godOn = false;

  constructor(private readonly game: BenchGame, private readonly helpers: BenchHelpers) {}

  get god() { return this.godOn; }

  setGod(on: boolean) {
    this.godOn = on;
    this.helpers.god(on);
    if (on) this.tick();
  }

  /** Keeps god mode true: called a few times a second by the panel (a new run, a toll or a spent key undo it). */
  tick() {
    if (!this.godOn) return;
    const g = this.game, p = g.player;
    if (p.invulnT < GOD_INVULN) this.helpers.god(true);
    if (p.keys < COUNTER_FLOOR) this.helpers.keys(COUNTER_TOP - p.keys);
    if (p.bombs < COUNTER_FLOOR) this.helpers.bombs(COUNTER_TOP - p.bombs);
    if (p.hp < g.maxHp) this.helpers.heal(Math.ceil((g.maxHp - p.hp) / 4));
    if (g.spiritNow < SPIRIT_MAX) g.refillSpirit();
  }

  floor(k: number): boolean { return this.game.debugFloor(k); }

  sky() { this.game.debugSky(); }

  refillSpirit() { this.game.refillSpirit(); }

  give(id: string) { this.game.give(id); }

  /** Every practice (the sky's gifts too), without banners; the count of the ones gained. */
  giveAll(): number {
    let n = 0;
    for (const def of ITEMS) if (this.game.grant(def.id)) n++;
    return n;
  }
}

// ───────────────────────── the guide (the same text as docs/testing/TEST-BENCH.md) ─────────────────────────

export interface GuideRow { label?: MessageKey; text: MessageKey | { key: MessageKey; params: Record<string, string | number> } | { boss: number } }
export interface GuideEntry { title: MessageKey; n?: number; rows: GuideRow[] }

/** The underground floor k's guide text keys, by its kind and depth. */
function floorKeys(l: LevelDef): { layout: MessageKey; exit: MessageKey } {
  if (l.kind === 'roots') return { layout: 'test.g.roots.layout', exit: 'test.g.roots.exit' };
  if (l.frozen) return { layout: 'test.g.ice.layout', exit: 'test.g.ice.exit' };
  if (l.kind === 'random') return { layout: 'test.g.circle.layout', exit: 'test.g.circle.exit' };
  if (l.floor === 5) return { layout: 'test.g.pit.layout', exit: 'test.g.pit.exit' };
  return { layout: 'test.g.tree.layout', exit: 'test.g.tree.exit' };
}

function tollRow(floor: number): GuideRow {
  const t = tollOf(floor);
  if (!t) return { label: 'test.guide.asks', text: 'test.toll.none' };
  return { label: 'test.guide.asks', text: { key: t.practices ? 'test.toll.practices' : 'test.toll.things', params: { n: t.count } } };
}

/** One entry per underground floor (from LEVELS), then silence. */
export function dungeonGuide(): GuideEntry[] {
  const out: GuideEntry[] = LEVELS.map(l => {
    const k = floorKeys(l);
    return {
      title: `level.${l.key}` as MessageKey, n: l.floor,
      rows: [
        { label: 'test.guide.layout', text: k.layout },
        { label: 'test.guide.boss', text: { boss: l.floor } },
        { label: 'test.guide.exit', text: k.exit },
        tollRow(l.floor),
      ],
    };
  });
  out.push({ title: 'level.silence', rows: [{ label: 'test.guide.layout', text: 'test.g.silence.layout' }, { label: 'test.guide.exit', text: 'test.g.silence.exit' }] });
  return out;
}

/** The boss of an underground floor, from its zone (content/bosses): the pool's ids, or the keystone; empty on the roots. */
export function bossesOf(floor: number): { ids: string[]; fixed: boolean; hp: number } {
  const zone = BOSS_ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1]);
  if (!zone) return { ids: [], fixed: false, hp: 0 };
  const ids = zone.keystone ? [zone.keystone] : [...zone.pool];
  return { ids: ids.filter(id => BOSS_BY_ID.has(id)), fixed: !!zone.keystone, hp: bossHp(floor) };
}

const SKY_FLOORS = ['panda', 'koala', 'elephant', 'lion', 'horse'] as const;

/** The deck, the five guardian floors in their order, Totality, then the spirit rules. */
export function skyGuide(): GuideEntry[] {
  return [
    { title: 'level.skyDeck', rows: [{ text: 'test.g.sky.note' }, { label: 'test.guide.layout', text: 'test.g.deck.layout' }, { label: 'test.guide.exit', text: 'test.g.deck.exit' }] },
    ...SKY_FLOORS.map((a, i): GuideEntry => ({
      title: `level.sky${i + 1}` as MessageKey, n: i + 1,
      rows: [
        { label: 'test.guide.layout', text: `test.g.${a}.layout` as MessageKey },
        { label: 'test.guide.win', text: `test.g.${a}.win` as MessageKey },
        { label: 'test.guide.exit', text: `test.g.${a}.exit` as MessageKey },
      ],
    })),
    { title: 'test.g.totality.title', rows: [{ label: 'test.guide.layout', text: 'test.g.totality.layout' }, { label: 'test.guide.exit', text: 'test.g.totality.exit' }] },
    { title: 'test.guide.spirit', rows: [
      { text: 'test.g.spirit.health' },
      { text: 'test.g.spirit.zero' },
      { text: 'test.g.spirit.rules' },
    ] },
  ];
}
