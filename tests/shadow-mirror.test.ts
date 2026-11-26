import { describe, expect, it } from 'vitest';
import { BASE_STATS, computeStats, type StatMod } from '../src/core/stats';
import { BOSSES, bossHp, bossLife } from '../src/content/bosses';
import {
  BEAT, IDLE, LIFE_PER_POINT, MIRROR_RULES, POINTS_PER_DAMAGE, VOLLEY_SHOTS, mirrorOf, shadowLife,
} from '../src/content/bosses/mirror';
import { STILLNESS_TAG, shadowState } from '../src/content/bosses/shadow';
import { MAT } from '../src/content/materials';
import { RunRandom } from '../src/core/rng';
import { BLAST_ACTOR_DAMAGE, BOMB_FUSE, lightBomb } from '../src/game/bomb';
import { DebrisSystem } from '../src/physics/debris';
import { ITEMS, ITEM_BY_ID } from '../src/content/items';
import { HEART } from '../src/entities/actors';
import type { Strike } from '../src/enemies/attacks';
import type { Enemy, EnemyCtx } from '../src/enemies/types';

// Issue #339: the Shadow is your equal. Its life is your health at entry, it copies the practices you hold then,
// and it fights by choosing, every frame, the best action for the moment (docs/design/built/bosses/SHADOW.md).

const DT = 1 / 60;
const SHADOW = BOSSES.find(b => b.id === 'shadow')!;
const FALLBACK = mirrorOf([]);
const GRAVITY = 26;

interface Bolt { t: number; damage: number; speed: number; radius: number }

interface Opts {
  held?: string[];
  /** Its health share (1: full; a third or less opens the stillness ending). */
  share?: number;
  /** Where you are at time t (a scripted player), and your velocity. */
  you?: (t: number) => { x: number; z: number; vx: number; vz: number };
  bombs?: number | (() => number);
  health?: number;
  /** Seconds between two of your hits on it (1 point each), 0: you never hit it. */
  hits?: number;
  /** The fight's seed (its `rng` fork). */
  seed?: number;
}

const still = (x: number) => () => ({ x, z: 0, vx: 0, vz: 0 });
/** A scripted player that runs a circle of five blocks round the room's centre, three blocks a second. */
const circling = (t: number) => ({ x: 5 * Math.cos(t * 0.6), z: 5 * Math.sin(t * 0.6), vx: -3 * Math.sin(t * 0.6), vz: 3 * Math.cos(t * 0.6) });

/** The Shadow in a fake room of 20 by 20 blocks with a floor at y = 0, its body moved by its wish and gravity. */
function fight(o: Opts = {}) {
  const held = o.held ?? [];
  const maxHp = shadowLife(o.health ?? 48);
  const e = {
    id: 7, hp: maxHp * (o.share ?? 1), maxHp, stage: 0, hold: 0, state: 'move', timer: 0, seq: 0, armed: true, hidden: false,
    wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: SHADOW.speed, clock: 0, aimX: 0, aimZ: 0, volley: 0,
    body: { x: -6, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: SHADOW.size[0], h: SHADOW.size[1], onGround: true },
    tags: new Set<string>(), room: 0, faction: 'projection', spec: SHADOW, def: SHADOW.id,
  } as unknown as Enemy;
  let t = 0, killed = false, walked = 0;
  const bolts: Bolt[] = [], strikes: { t: number; s: Strike }[] = [], rains: number[] = [];
  const placed: { t: number; blast: { radius: number; blocks: number; damage: number } }[] = [];
  const where = o.you ?? still(6);
  const you = () => { const p = where(t); return { id: 1, x: p.x, y: 0, z: p.z, vx: p.vx, vz: p.vz }; };
  const ctx = {
    dt: DT, target: you, near: you, practices: () => held, health: () => o.health ?? 48, bombs: () => (typeof o.bombs === 'function' ? o.bombs() : o.bombs ?? 0),
    placeBomb: (_e: Enemy, blast: { radius: number; blocks: number; damage: number }) => { placed.push({ t, blast }); },
    rng: (_e: Enemy, site: string) => new RunRandom(o.seed ?? 1).fork('boss', site),
    dist: (_e: Enemy, p: { x: number; z: number }) => Math.hypot(p.x - e.body.x, p.z - e.body.z),
    toward: (_e: Enemy, p: { x: number; z: number }) => { const dx = p.x - e.body.x, dz = p.z - e.body.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; },
    bounds: () => [-10, -10, 9, 9], centre: () => [0, 0],
    bolt: (_e: Enemy, _dx: number, _dy: number, _dz: number, speed: number, damage: number, radius?: number) => { bolts.push({ t, damage, speed, radius: radius ?? 0.12 }); },
    strike: (_e: Enemy, s: Strike) => { strikes.push({ t, s }); },
    rain: () => { rains.push(t); },
    shootAt: () => {}, rockfall: () => {}, summon: () => {}, quake: () => {}, cue: () => {}, crash: () => {}, fx: () => {},
    arena: () => {}, burst: () => {}, quiet: () => false, others: () => [], safe: () => true, hide: () => {},
    kill: () => { killed = true; },
  } as unknown as EnemyCtx;
  return {
    e, bolts, strikes, rains,
    get killed() { return killed; },
    get walked() { return walked; },
    bombs: () => placed,
    run(seconds: number) {
      for (let k = 0; k < Math.round(seconds / DT); k++) {
        if (o.hits && k > 0 && k % Math.round(o.hits / DT) === 0) e.hp -= 1;
        SHADOW.behaviour.update(e, ctx);
        const b = e.body;
        b.vx = e.wishX * e.speed; b.vz = e.wishZ * e.speed;
        const x = Math.min(9.6, Math.max(-9.6, b.x + b.vx * DT)), z = Math.min(9.6, Math.max(-9.6, b.z + b.vz * DT));
        walked += Math.hypot(x - b.x, z - b.z);
        b.x = x; b.z = z;
        b.vy -= GRAVITY * DT; b.y += b.vy * DT;
        if (b.y <= 0) { b.y = 0; b.vy = Math.max(0, b.vy); b.onGround = true; } else b.onGround = false;
        t += DT;
        if (killed) break;
      }
    },
  };
}

/** Shot times grouped into volleys: shots closer than a second belong to one. */
function volleys(times: number[]): number[][] {
  const out: number[][] = [];
  for (const t of [...new Set(times)].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && t - last[last.length - 1] < 1) last.push(t); else out.push([t]);
  }
  return out;
}

describe('the Shadow: every practice is classified', () => {
  it('every practice in src/content/items has a rule, in the catalogue or not, and every rule is a practice', () => {
    const files = import.meta.glob<{ default?: { id?: string; effect?: string } }>('../src/content/items/*.ts', { eager: true });
    const ids = [...new Set([
      ...ITEMS.map(i => i.id),
      ...Object.values(files).map(f => f.default).filter(d => d?.id && d.effect).map(d => d!.id!),
    ])];
    const missing = ids.filter(id => !MIRROR_RULES[id]);
    expect(missing, 'practices with no mirror rule: add them to MIRROR_RULES and the table in SHADOW.md').toEqual([]);
    expect(Object.keys(MIRROR_RULES).filter(id => !ids.includes(id))).toEqual([]);
  });

  it('a copied or adapted practice alone changes the mirror; a skipped one alone leaves the fallback', () => {
    for (const { id } of ITEMS) {
      const rule = MIRROR_RULES[id], m = mirrorOf([id]);
      if (rule.how === 'skipped') expect({ ...m, practices: [] }, id).toEqual(FALLBACK);
      else expect({ ...m, practices: [] }, id).not.toEqual(FALLBACK);
    }
  });

  it('meals, potions, crafting, loot and the miracles that are neither shots nor movement are skipped', () => {
    const skipped = (id: string) => MIRROR_RULES[id].how === 'skipped';
    for (const { id, tags } of ITEMS) if (tags?.includes('nourish')) expect(skipped(id), id).toBe(true);
    for (const id of ['apprenticeship', 'bookofsecrets', 'gratitude', 'omens', 'kairos', 'luciddream', 'solvecoagula']) expect(skipped(id), id).toBe(true);
    // the missile, the dash and the jumps are fight verbs: copied
    for (const id of ['drlauncher', 'irimi', 'triple-jump', 'mindset', 'pressurevalve']) expect(MIRROR_RULES[id].how, id).toBe('copied');
  });
});

describe('the Shadow: its life is your health at entry', () => {
  it('its starting life equals your health, heart for heart, for two different healths', () => {
    for (const points of [48, 24]) {
      const lifeNow = bossLife(SHADOW, 9, points);
      expect(lifeNow).toBe(shadowLife(points));
      // the same hearts as yours: a heart of yours (8 points) is 7 of its life
      expect(lifeNow / (HEART * LIFE_PER_POINT)).toBe(points / HEART);
    }
    expect(bossLife(SHADOW, 9, 48)).not.toBe(bossLife(SHADOW, 9, 24));
    expect(shadowLife(48)).toBe(42);
  });

  it('is exempt from the boss formula: any other boss keeps the life of its floor', () => {
    expect(bossLife(SHADOW, 9, 48)).not.toBe(bossHp(9));
    for (const b of BOSSES.filter(x => x.id !== 'shadow')) expect(bossLife(b, 9, 48), b.id).toBe(bossHp(9));
  });

  it('both sides need the same hits: your base shots to end it equal its base strands to end you', () => {
    for (const points of [48, 24, 72]) expect(shadowLife(points) / BASE_STATS.damage).toBeCloseTo(points / FALLBACK.shot.damage, 9);
    expect(FALLBACK.shot.damage).toBeCloseTo(BASE_STATS.damage * POINTS_PER_DAMAGE, 9);
  });
});

describe('the Shadow: the mirror', () => {
  it('a player with no practices meets the fallback: half a heart a strand, at your fire interval', () => {
    expect(FALLBACK.practices).toEqual([]);
    expect(FALLBACK.weapon).toBe('intent');
    expect(FALLBACK.shot.damage).toBe(4);
    expect(FALLBACK.shot.interval).toBeCloseTo(1 / 2.7, 9);
    expect(FALLBACK.shot.strands).toEqual([1]);
    expect(FALLBACK).toMatchObject({ harmless: false, move: 1, airJumps: 0, dash: false, missile: false });
    expect(FALLBACK.bomb.radius).toBe(BASE_STATS.bombRadius);
  });

  it('no cap beyond your own power: a strong build gives its damage, converted, and its speed', () => {
    const m = mirrorOf(['meditations', 'breakingbread', 'kairos']);
    expect(m.practices).toEqual(['meditations']);
    const yours = computeStats(ITEM_BY_ID.get('meditations')!.stats!.map(s => ({ ...s, source: 'meditations' }) as StatMod));
    expect(yours.damage).toBeCloseTo((3.5 + 2) * 3, 9);
    expect(m.shot.damage).toBeCloseTo(yours.damage * POINTS_PER_DAMAGE, 9);
    const fast = mirrorOf(['selfreliance', 'triangulation', 'stoic', 'flow']);
    expect(fast.shot.strands).toEqual([1, 0.6, 0.6]);
    expect(fast.shot.radius).toBeCloseTo(0.12 * 1.4, 9);
    expect(fast.move).toBeCloseTo(1.3, 9);
    expect(fast.shot.interval).toBeLessThan(FALLBACK.shot.interval / 2);
  });

  it('carries your burdens: Deep Focus lowers its damage as it lowers yours', () => {
    expect(mirrorOf(['deepfocus']).shot.damage).toBeCloseTo(FALLBACK.shot.damage * 0.8, 9);
  });

  it('weapons, missiles, dash and jumps', () => {
    expect(mirrorOf(['occamsrazor']).weapon).toBe('blade');
    expect(mirrorOf(['kiai']).weapon).toBe('beam');
    expect(mirrorOf(['kiai', 'occamsrazor']).weapon).toBe('greatcut');
    expect(mirrorOf(['drlauncher']).missile).toBe(true);
    expect(mirrorOf(['irimi']).dash).toBe(true);
    expect(mirrorOf(['triple-jump']).airJumps).toBe(2);
    expect(mirrorOf(['mindset']).jump).toBeGreaterThan(FALLBACK.jump);
    expect(mirrorOf(['pressurevalve']).bomb.radius).toBeCloseTo(BASE_STATS.bombRadius + 0.8, 9);
    expect(mirrorOf(['fartlek']).move).toBeCloseTo(1.45, 9);
  });
});

describe('the Shadow: it fights like a player', () => {
  const held = ['irimi', 'triple-jump', 'triangulation', 'drlauncher'];

  it('with a fixed build and a scripted player it moves, jumps, dashes and uses bombs', () => {
    const f = fight({ held, bombs: 4, you: circling, hits: 0.8 });
    f.run(40);
    const acts = shadowState(f.e)!.acts;
    expect(f.walked).toBeGreaterThan(30);
    expect(acts.jump).toBeGreaterThan(0);
    expect(acts.dash).toBeGreaterThan(0);
    expect(acts.bomb + acts.missile).toBeGreaterThan(0);
    expect(f.bombs().length + f.rains.length).toBe(acts.bomb + acts.missile);
    expect(shadowState(f.e)!.bombs).toBe(4 - acts.bomb - acts.missile);
    expect(acts.volley).toBeGreaterThan(0);
  });

  it('its fire is not continuous: between two volleys, at least a second and at most its seeded maximum', () => {
    const f = fight({ held, bombs: 4, you: circling, hits: 0.8 });
    f.run(40);
    const groups = volleys(f.bolts.map(b => b.t));
    expect(groups.length).toBeGreaterThan(3);
    for (const g of groups) expect(g.length).toBeLessThanOrEqual(VOLLEY_SHOTS);
    for (let k = 1; k < groups.length; k++) {
      const gap = groups[k][0] - groups[k - 1][groups[k - 1].length - 1];
      expect(gap, `gap before volley ${k}`).toBeGreaterThanOrEqual(IDLE.min + BEAT - 2 * DT);
    }
  });

  it('each fight draws its longest pause once from its own fork, and every pause in [1 s, that maximum]', () => {
    const most = new Set<number>();
    for (const seed of [1, 2, 3, 4, 5]) {
      const f = fight({ seed, you: still(6) });
      f.run(60);
      const m = shadowState(f.e)!.most;
      expect(m).toBeGreaterThanOrEqual(IDLE.max[0]);
      expect(m).toBeLessThanOrEqual(IDLE.max[1]);
      most.add(m);
      const groups = volleys(f.bolts.map(b => b.t));
      expect(groups.length).toBeGreaterThan(8);
      const gaps = groups.slice(1).map((g, k) => g[0] - groups[k][groups[k].length - 1]);
      // the gap is the pause plus the tell; you stand still in its range, so nothing else delays it
      for (const gap of gaps) {
        expect(gap).toBeGreaterThanOrEqual(IDLE.min + BEAT - 2 * DT);
        expect(gap).toBeLessThanOrEqual(m + BEAT + 2 * DT);
      }
      // the same seed, the same fight
      const again = fight({ seed, you: still(6) });
      again.run(60);
      expect(again.bolts).toEqual(f.bolts);
    }
    expect(most.size).toBeGreaterThan(1);
  });

  it('the same build and the same moves give the same fight', () => {
    const a = fight({ held, bombs: 4, you: circling, hits: 0.8 }), b = fight({ held, bombs: 4, you: circling, hits: 0.8 });
    a.run(15); b.run(15);
    expect(b.bolts).toEqual(a.bolts);
    expect(shadowState(b.e)).toEqual(shadowState(a.e));
  });

  it('chooses from the moment: close, it bombs; far, with the missile, it launches one', () => {
    const near = fight({ bombs: 3, you: still(-4.5) });
    near.run(4);
    expect(near.bombs().length).toBeGreaterThan(0);
    const far = fight({ held: ['drlauncher'], bombs: 3, you: still(9) });
    far.run(6);
    expect(far.rains.length).toBeGreaterThan(0);
  });

  it('takes its snapshot when the fight starts: practices and bombs gained later change nothing', () => {
    const held = ['stoic'];
    let bombs = 0;
    const f = fight({ held, bombs: () => bombs, you: still(6) });
    const g = fight({ held: ['stoic'], you: still(6) });
    f.run(0.1); g.run(0.1);
    held.push('triangulation', 'meditations'); bombs = 5;
    f.run(4); g.run(4);
    expect(f.bolts).toEqual(g.bolts);
    expect(f.bolts[0].damage).toBe(mirrorOf(['stoic']).shot.damage);
    expect(shadowState(f.e)!.bombs).toBe(0);
  });

  it('with no practices and no bombs the fight is fair: one strand a shot, half a heart each', () => {
    const f = fight({ you: circling });
    f.run(20);
    expect(f.bolts.length).toBeGreaterThan(0);
    expect(f.bolts.every(b => b.damage === 4)).toBe(true);
    expect(f.bolts.reduce((a, b) => a + b.damage, 0) / 20).toBeLessThan(6);
  });

  it('the beam and the great cut replace its shot and are always telegraphed', () => {
    for (const w of [['kiai'], ['kiai', 'occamsrazor']]) {
      const f = fight({ held: w, you: still(-3) });
      f.run(10);
      expect(f.bolts).toEqual([]);
      expect(f.strikes.length).toBeGreaterThan(0);
      for (const { s } of f.strikes) expect(s.lead).toBeGreaterThanOrEqual(0.8);
    }
  });
});

describe('the Shadow: its bombs are yours', () => {
  it('one implementation lights both: the same cube, material and fuse', () => {
    const d = new DebrisSystem(8, () => false, () => {});
    const fused: number[] = [];
    d.onFuse = i => { fused.push(i); };
    const i = lightBomb(d, 0.5, 1.5, 0.5, 0, 0, BOMB_FUSE, false);
    expect(d.material[i]).toBe(MAT.bomb);
    expect(d.isBomb(i)).toBe(true);
    expect(d.fuse[i]).toBeCloseTo(BOMB_FUSE, 6);
    expect(d.love[i]).toBe(0);
    for (let k = 0; k < 2 / DT; k++) d.update(DT);
    expect(fused).toEqual([i]);
  });

  it('the game lights the player bomb and the Shadow bomb through lightBomb, and spawns no other bomb', () => {
    const src = Object.values(import.meta.glob<string>('../src/game/game.ts', { query: '?raw', import: 'default', eager: true }))[0];
    const body = (name: string) => { const at = src.indexOf(`private ${name}(`); return src.slice(at, src.indexOf('\n  }\n', at)); };
    expect(body('placeBomb')).toContain('lightBomb(this.debris');
    expect(body('enemyBomb')).toContain('lightBomb(this.debris');
    expect(src).not.toContain('MAT.bomb');
  });

  it('drops them with your blast: your radius, your block damage, a heart to every actor, plus its own upgrades', () => {
    const f = fight({ bombs: 3, you: still(-4.5) });
    f.run(4);
    expect(f.bombs().length).toBeGreaterThan(0);
    expect(f.bombs()[0].blast).toEqual({ radius: BASE_STATS.bombRadius, blocks: BASE_STATS.bombDamage, damage: BLAST_ACTOR_DAMAGE });
    expect(mirrorOf(['controlledburn']).bomb.damage).toBe(BLAST_ACTOR_DAMAGE + 4);
    expect(mirrorOf(['pressurevalve']).bomb.blocks).toBeCloseTo(BASE_STATS.bombDamage * 1.6, 9);
  });
});

describe('the Shadow: the stillness ending', () => {
  it('with its health at a third, three seconds still beside it end the fight, and it does not attack', () => {
    const f = fight({ held: ['meditations', 'selfreliance', 'triangulation', 'kiai', 'occamsrazor', 'irimi'], share: 0.3, bombs: 3, you: still(-4) });
    f.run(8);
    expect(f.bolts).toEqual([]);
    expect(f.strikes).toEqual([]);
    expect(f.killed).toBe(true);
    expect(f.e.tags.has(STILLNESS_TAG)).toBe(true);
  });

  it('it does not yield while you move, nor while its health is above a third', () => {
    const moving = fight({ share: 0.3, you: circling });
    moving.run(8);
    expect(moving.killed).toBe(false);
    const strong = fight({ share: 0.5, you: still(-4) });
    strong.run(8);
    expect(strong.killed).toBe(false);
  });
});
