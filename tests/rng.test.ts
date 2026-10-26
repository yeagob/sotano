// Seeds and randomness (docs/architecture/RNG.md): determinism, isolation, variety, tables,
// seed codes, and the rule that only core/fx.ts may use Math.random.

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ENEMY_BUDGET } from '../src/content/enemies';
import { ITEMS } from '../src/content/items';
import { ROOM_TEMPLATES, validateTemplate } from '../src/content/rooms';
import { ALL_TABLES } from '../src/content/tables';
import { ROOM_CLEAR } from '../src/content/tables/rewards';
import { hashPath, Rng, RunRandom } from '../src/core/rng';
import { decodeSeed, encodeSeed, SEED_ALPHABET } from '../src/core/seed';
import { ItemPools } from '../src/items/pool';
import { carveFloor, createDungeonWorld, planDungeon } from '../src/world/floor';
import { buildRun, signature } from './helpers';

describe('seed codes', () => {
  it('round-trip every root exactly (a bijection)', () => {
    const rng = new Rng(9);
    for (let i = 0; i < 2000; i++) {
      const root = rng.u32();
      const code = encodeSeed(root);
      expect(code).toHaveLength(8);
      expect(decodeSeed(code)).toBe(root);
    }
    expect(decodeSeed(encodeSeed(0))).toBe(0);
    expect(decodeSeed(encodeSeed(0xffffffff))).toBe(0xffffffff);
  });

  it('accept spaces, dashes and lower case', () => {
    const code = encodeSeed(123456789);
    expect(decodeSeed(`${code.slice(0, 4)}-${code.slice(4)}`.toLowerCase())).toBe(123456789);
    expect(decodeSeed(`${code.slice(0, 4)} ${code.slice(4)}`)).toBe(123456789);
  });

  it('reject bad length, unknown letters and most single-character typos', () => {
    expect(decodeSeed('ABC')).toBeNull();
    expect(decodeSeed('ABCDEFG0')).toBeNull(); // 0 is not in the alphabet
    const rng = new Rng(4);
    let caught = 0, total = 0;
    for (let i = 0; i < 300; i++) {
      const code = encodeSeed(rng.u32());
      const pos = rng.int(0, 7);
      const other = SEED_ALPHABET[(SEED_ALPHABET.indexOf(code[pos]) + rng.int(1, 31)) % 32];
      total++;
      if (decodeSeed(code.slice(0, pos) + other + code.slice(pos + 1)) === null) caught++;
    }
    expect(caught / total).toBeGreaterThan(0.95); // an 8-bit checksum catches ~99.6%
  });
});

describe('derivation', () => {
  it('fork() is a pure function of (root, path)', () => {
    const a = new RunRandom(77), b = new RunRandom(77);
    b.stream('drops').next(); b.fork('anything').next();
    expect(a.fork('floor', 2, 'room', 5, 'layout').u32()).toBe(b.fork('floor', 2, 'room', 5, 'layout').u32());
  });

  it('paths never collide by concatenation and roots never correlate', () => {
    expect(hashPath(1, ['floor', 2, 'room', 5])).not.toBe(hashPath(1, ['floor', 25]));
    expect(hashPath(1, ['ab', 'c'])).not.toBe(hashPath(1, ['a', 'bc']));
    expect(hashPath(1, ['x'])).not.toBe(hashPath(2, ['x']));
  });

  it('rejects non-integer path parts', () => {
    expect(() => hashPath(1, ['floor', 1.5])).toThrow();
  });
});

describe('determinism and isolation', () => {
  it('the same seed builds the same four floors (voxels, rooms, pedestals, rosters)', () => {
    const a = buildRun(0xC0FFEE), b = buildRun(0xC0FFEE);
    expect(signature(a)).toBe(signature(b));
    expect(a.w.data).toEqual(b.w.data);
  });

  it('runtime randomness never changes the structure', () => {
    const plain = buildRun(42);
    const busy = buildRun(42, undefined, (rr, pools) => {
      // the player draws items at runtime, gets some from elsewhere, and burns through streams
      for (let i = 0; i < 5; i++) pools.drawRuntime('treasure', rr.stream('loot'));
      pools.remove(ITEMS[3].id);
      for (let i = 0; i < 500; i++) { rr.stream('drops').next(); rr.stream('ai').next(); rr.fork('item', 'kaizen', 0).next(); }
    });
    expect(signature(busy)).toBe(signature(plain));
    expect(busy.w.data).toEqual(plain.w.data);
  });

  it('runtime draws never take a reserved pedestal item', () => {
    const run = buildRun(7);
    const reserved = new Set(run.floors.flatMap(f => f.pedestals.map(p => p.item)));
    for (let i = 0; i < 6; i++) expect(reserved.has(run.pools.drawRuntime('treasure', run.rr.stream('loot')))).toBe(false);
  });

  it('a room\'s layout depends only on its own fork (rosters and items are separate)', () => {
    const rr1 = new RunRandom(5), rr2 = new RunRandom(5);
    const d1 = planDungeon(rr1), d2 = planDungeon(rr2);
    const w1 = createDungeonWorld(rr1, d1), w2 = createDungeonWorld(rr2, d2);
    const f1 = carveFloor(w1, rr1, 1, d1.plans[0], { templates: ROOM_TEMPLATES, pedestalItem: () => 'meditations', enemies: ENEMY_BUDGET });
    const f2 = carveFloor(w2, rr2, 1, d2.plans[0], { templates: ROOM_TEMPLATES, pedestalItem: () => null, enemies: { pick: () => [] } });
    expect(f1.rooms.map(r => [r.template, r.flipX, r.flipZ, r.mood])).toEqual(f2.rooms.map(r => [r.template, r.flipX, r.flipZ, r.mood]));
    expect(w1.data).toEqual(w2.data);
  });

  it('room-clear rewards are pre-rolled per room: same seed and luck, same reward, in any clear order', () => {
    const rr = new RunRandom(11);
    const reward = (room: number, luck: number) => ROOM_CLEAR.pickU(rr.fork('floor', 1, 'room', room, 'clear').next(), { floor: 1, luck });
    const order1 = [3, 1, 2].map(r => reward(r, 0));
    const order2 = [1, 2, 3].map(r => reward(r, 0));
    expect([order1[1], order1[2], order1[0]]).toEqual(order2);
  });
});

describe('variety', () => {
  it('200 seeds give 200 different runs, with every template, mood and item in use', () => {
    const sigs = new Set<string>();
    const templates = new Map<string, number>(), moods = new Map<string, number>(), items = new Map<string, number>();
    const rng = new Rng(1234);
    for (let i = 0; i < 200; i++) {
      const run = buildRun(rng.u32(), 1);
      sigs.add(signature(run));
      for (const r of run.floors[0].rooms) {
        templates.set(r.template, (templates.get(r.template) ?? 0) + 1);
        moods.set(r.mood, (moods.get(r.mood) ?? 0) + 1);
      }
      for (const p of run.floors[0].pedestals) items.set(p.item!, (items.get(p.item!) ?? 0) + 1);
    }
    expect(sigs.size).toBe(200);
    for (const t of ROOM_TEMPLATES) expect(templates.get(t.id) ?? 0, `template ${t.id} never used`).toBeGreaterThan(0);
    for (const m of ['sparse', 'normal', 'cluttered']) expect(moods.get(m) ?? 0).toBeGreaterThan(0);
    // no single item dominates the pedestals
    const total = [...items.values()].reduce((a, b) => a + b, 0);
    expect(Math.max(...items.values()) / total).toBeLessThan(0.15);
    expect(items.size).toBeGreaterThan(ITEMS.length * 0.7);
  });
});

describe('tables and templates', () => {
  it('every table has finite, positive weights', () => {
    for (const t of ALL_TABLES) {
      expect(t.entries.length, t.name).toBeGreaterThan(0);
      for (const e of t.entries) { expect(Number.isFinite(e.weight), t.name).toBe(true); expect(e.weight, t.name).toBeGreaterThan(0); }
    }
  });

  it('rolls follow the weights', () => {
    const rng = new Rng(3);
    const counts = new Map<unknown, number>();
    for (let i = 0; i < 20000; i++) { const v = ROOM_CLEAR.roll(rng, { floor: 1 }); counts.set(v, (counts.get(v) ?? 0) + 1); }
    expect((counts.get(null) ?? 0) / 20000).toBeCloseTo(7 / 14, 1);
    expect((counts.get('heart') ?? 0) / 20000).toBeCloseTo(3 / 14, 1);
  });

  it('luck only affects runtime tables', () => {
    const lucky = ROOM_CLEAR.weights({ floor: 1, luck: 4 }), plain = ROOM_CLEAR.weights({ floor: 1 });
    expect(lucky.find(e => e.value === 'heart')!.w).toBeGreaterThan(plain.find(e => e.value === 'heart')!.w);
  });

  it('every room template, including the new decor-slot ones, is valid', () => {
    for (const t of ROOM_TEMPLATES) expect(validateTemplate(t)).toEqual([]);
  });
});

describe('randomness discipline', () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });

  it('only core/fx.ts calls Math.random', () => {
    const offenders = files('src').filter(p => !p.endsWith(join('core', 'fx.ts')) && /Math\.random\(/.test(readFileSync(p, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('structure code (world, content) never imports the cosmetic fx module', () => {
    const offenders = [...files(join('src', 'world')), ...files(join('src', 'content'))]
      .filter(p => /from ['"].*core\/fx['"]/.test(readFileSync(p, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('pools never leave a pedestal empty', () => {
    const pools = new ItemPools(ITEMS.slice(0, 2));
    pools.reserve([{ key: 'a', pool: 'treasure' }, { key: 'b', pool: 'treasure' }, { key: 'c', pool: 'vault' }], new Rng(1));
    for (const k of ['a', 'b', 'c']) expect(pools.reservedFor(k)).toBeTruthy();
  });
});
