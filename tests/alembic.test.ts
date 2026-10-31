// The laboratory's alembic (docs/design/not-built/practices/potions/BREWING-RULES.md §1, approved
// 2026-10-28): three things in the bulb, a positive intention brews and spends one of three brews,
// a negative one boils the bulb off for nothing, and the third brew leaves it cold.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { brew, BREWS, BULB, feed, hit, HIT_GAP, newAlembic, tick, tickLabs, type BrewOutcome } from '../src/game/alembic';
import { createBus, type GameEvents } from '../src/game/events';
import { MAT } from '../src/content/materials';
import { PARTS } from '../src/content/parts';
import { Intents, intentFromStats } from '../src/combat/intents';
import { Beam, GreatCut, type WeaponHost } from '../src/combat/weapons';
import type { Polarity } from '../src/combat/polarity';
import { BASE_STATS } from '../src/core/stats';

describe('the alembic bulb', () => {
  it('takes three things from the hand and refuses a fourth', () => {
    const a = newAlembic();
    expect([feed(a, 1), feed(a, 2), feed(a, PARTS[0])]).toEqual(['fed', 'fed', 'fed']);
    expect(a.bulb).toHaveLength(BULB);
    expect(feed(a, 3)).toBe('full');
    expect(a.bulb).toHaveLength(BULB);
  });

  it('a positive intention on a loaded bulb brews: one brew is spent and what was fed is gone', () => {
    const a = newAlembic();
    feed(a, 1);
    expect(hit(a, 'positive')).toBe('brew');
    expect(a.brews).toBe(BREWS - 1);
    expect(a.bulb).toEqual([]);
  });

  it('a negative intention boils the bulb off and spends no brew', () => {
    const a = newAlembic();
    feed(a, 1);
    feed(a, PARTS[1]);
    expect(hit(a, 'negative')).toBe('boil');
    expect(a.brews).toBe(BREWS);
    expect(a.bulb).toEqual([]);
  });

  it('an intention on an empty bulb does nothing and spends nothing', () => {
    const a = newAlembic();
    expect(hit(a, 'positive')).toBe('empty');
    tick(a, HIT_GAP);
    expect(hit(a, 'negative')).toBe('empty');
    expect(a.brews).toBe(BREWS);
  });

  it('three brews per run, then the alembic goes cold and takes nothing more', () => {
    const a = newAlembic();
    for (let i = 0; i < BREWS; i++) {
      expect(feed(a, i)).toBe('fed');
      tick(a, HIT_GAP);
      expect(hit(a, 'positive')).toBe('brew');
      tick(a, HIT_GAP);
    }
    expect(a.brews).toBe(0);
    expect(feed(a, 9)).toBe('cold');
    expect(a.bulb).toEqual([]);
    tick(a, HIT_GAP);
    expect(hit(a, 'positive')).toBe('cold');
  });

  it('counts one intention per HIT_GAP, so a swing or a beam tick does not brew twice', () => {
    const a = newAlembic();
    feed(a, 1);
    feed(a, 2);
    expect(hit(a, 'positive')).toBe('brew');
    feed(a, 3);
    expect(hit(a, 'positive')).toBe('cool');
    expect(a.bulb).toHaveLength(1);
    tick(a, HIT_GAP / 2);
    expect(hit(a, 'positive')).toBe('cool');
    tick(a, HIT_GAP / 2);
    expect(hit(a, 'positive')).toBe('brew');
    expect(a.brews).toBe(BREWS - 2);
  });
});

describe('the brew event', () => {
  const heart = (source: string) => PARTS.find(p => p.source === source && p.kind === 'heart')!;
  const listen = () => {
    const bus = createBus();
    const seen: GameEvents['brew'][] = [];
    bus.on('brew', { priority: 200, source: 'test', fn: e => { seen.push({ ...e }); } });
    return { bus, seen };
  };

  it('a positive brew emits the potion the bulb resolves to, where the alembic stands, and returns its flask', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    const out = brew(a, 'positive', bus, 4, 5, 6);
    expect(out).toEqual({ result: 'brew', flask: { potion: 'ember-tonic' } });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ potion: 'ember-tonic', iced: false, contents: 1, x: 4, y: 5, z: 6 });
  });

  it('says when ice kept the brew cold', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    feed(a, MAT.ice);
    expect(brew(a, 'positive', bus, 0, 0, 0).flask).toEqual({ potion: 'ember-tonic', iced: true });
    expect(seen[0]).toMatchObject({ iced: true, contents: 2 });
  });

  it('a boil, an empty bulb, a cold alembic or a hit inside the gap emit nothing', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    expect(brew(a, 'negative', bus, 0, 0, 0)).toEqual({ result: 'boil', flask: null });
    tick(a, HIT_GAP);
    expect(brew(a, 'positive', bus, 0, 0, 0)).toEqual({ result: 'empty', flask: null });
    feed(a, 1);
    expect(brew(a, 'positive', bus, 0, 0, 0).result).toBe('cool');
    a.brews = 0;
    tick(a, HIT_GAP);
    expect(brew(a, 'positive', bus, 0, 0, 0).result).toBe('cold');
    expect(seen).toEqual([]);
  });

  it('a fourth brew is refused whatever the bulb holds', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    for (let i = 0; i < BREWS + 1; i++) {
      feed(a, heart('panic'));
      brew(a, 'positive', bus, 0, 0, 0);
      tick(a, HIT_GAP);
    }
    expect(seen).toHaveLength(BREWS);
    expect(a.brews).toBe(0);
  });
});

describe('the alembic ticks once, however many tiles hold it', () => {
  it('a laboratory registered under two tiles cools at the normal rate', () => {
    const lab = newAlembic();
    hit(lab, 'positive');
    tickLabs([lab, lab], 0.2);
    expect(lab.cool).toBeCloseTo(HIT_GAP - 0.2);
  });
});

describe('the alembic under the love-shot and under Remember Breathing (three items)', () => {
  // The alembic is the only solid thing in this world: one tile two blocks in front of the player,
  // who stands at (0.5, 0, 0.5) and looks down -Z. The hooks mirror game.ts: an intention or a beam
  // that reaches the alembic calls the same brew, with the stroke's polarity.
  const LAB = '0,1,-2';
  const at = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const heart = PARTS.find(p => p.kind === 'heart')!;
  const flesh = PARTS.find(p => p.kind === 'flesh')!;
  const mind = PARTS.find(p => p.kind === 'mind')!;

  function rig() {
    const bus = createBus();
    const seen: GameEvents['brew'][] = [];
    bus.on('brew', { priority: 200, source: 'test', fn: e => { seen.push({ ...e }); } });
    const lab = newAlembic();
    for (const item of [heart, flesh, mind]) expect(feed(lab, item)).toBe('fed');
    const outcomes: BrewOutcome[] = [];
    const state = { casting: false, polarity: 'positive' as Polarity };
    const hitLab = (polarity: Polarity) => { outcomes.push(brew(lab, polarity, bus, 0, 1, -2)); };

    // the love-shot: the game's own intention, which reaches the block through hitBlock
    const intents = new Intents(new THREE.Scene(), {
      solid: (x, y, z) => at(x, y, z) === LAB,
      hitBlock: (hit, spec) => { if (at(hit.x, hit.y, hit.z) === LAB) hitLab(spec.polarity); return false; },
      tier: () => 0,
      debrisAt: () => -1,
      hitDebris: () => {},
      enemyAt: () => -1,
      hitEnemy: () => {},
      splash: () => {},
      hit: () => {},
      nearestBlock: () => null,
    });

    // Remember Breathing: the beam, through the weapon host, as game.ts wires it. The alembic cannot
    // be broken (its HP is infinite), so the beam can only reach it through the answer hook.
    const host: WeaponHost = {
      stats: () => BASE_STATS,
      eye: () => new THREE.Vector3(0.5, 1.6, 0.5),
      forward: () => new THREE.Vector3(0, 0, -1),
      casting: () => state.casting,
      strike: (_weapon, damage, mining, reach) => ({ damage, mining, reach, tags: new Set() }),
      solid: (x, y, z) => at(x, y, z) === LAB,
      breakable: () => false,
      cut: () => {},
      burn: () => false,
      answer: (x, y, z) => { if (at(x, y, z) === LAB) hitLab(state.polarity); },
      targets: () => [],
      hit: () => {},
      clearProjectiles: () => {},
      clearCubes: () => {},
      sliceCubes: () => {},
      particles: () => {},
      shake: () => {},
      swingHands: () => {},
      chargeHands: () => {},
      sound: () => {},
    };
    const beam = new Beam(new THREE.Scene(), host);
    // One Clear Cut: Remember Breathing with Occam's Razor, the great cut that also replaces the shot
    const cut = new GreatCut(new THREE.Scene(), host);

    const shoot = () => {
      intents.fire(intentFromStats(BASE_STATS, state.polarity), new THREE.Vector3(0.5, 1.4, 0.5), new THREE.Vector3(0, 0, -1), new THREE.Vector3());
      for (let t = 0; t < 1; t += 1 / 60) intents.update(1 / 60);
    };
    const fireBeam = () => {
      state.casting = true;
      for (let t = 0; t < 3; t += 1 / 60) beam.update(1 / 60);
      state.casting = false;
      for (let t = 0; t < 1.5; t += 1 / 60) beam.update(1 / 60);
    };
    const fireGreatCut = () => {
      state.casting = true;
      for (let t = 0; t < 3; t += 1 / 60) cut.update(1 / 60);
      state.casting = false;
      for (let t = 0; t < 1.5; t += 1 / 60) cut.update(1 / 60);
    };
    return { lab, outcomes, seen, state, shoot, fireBeam, fireGreatCut };
  }

  it('the love-shot brews three fed items once, and the bulb is empty after it', () => {
    const r = rig();
    r.shoot();
    expect(r.outcomes.map(o => o.result)).toEqual(['brew']);
    expect(r.outcomes[0].flask).toEqual({ potion: 'plain-tonic' });
    expect(r.seen).toHaveLength(1);
    expect(r.lab.bulb).toEqual([]);
    expect(r.lab.brews).toBe(BREWS - 1);
  });

  it('Remember Breathing brews the same three fed items once, however many beam ticks land', () => {
    const r = rig();
    r.fireBeam();
    // the beam's other ticks land inside the hit gap: they are 'cool' and count for nothing
    expect(r.outcomes.length).toBeGreaterThan(1);
    expect(r.outcomes.filter(o => o.result !== 'cool').map(o => o.result)).toEqual(['brew']);
    expect(r.outcomes[0].flask).toEqual({ potion: 'plain-tonic' });
    expect(r.seen).toHaveLength(1);
    expect(r.lab.bulb).toEqual([]);
    expect(r.lab.brews).toBe(BREWS - 1);
  });

  it('One Clear Cut (Remember Breathing with Occam\'s Razor) brews the same three items once', () => {
    const r = rig();
    r.fireGreatCut();
    expect(r.outcomes.map(o => o.result)).toEqual(['brew']);
    expect(r.seen).toHaveLength(1);
    expect(r.lab.bulb).toEqual([]);
    expect(r.lab.brews).toBe(BREWS - 1);
  });

  it('a negative love-shot boils the three items off, and a negative beam does the same', () => {
    const shot = rig();
    shot.state.polarity = 'negative';
    shot.shoot();
    expect(shot.outcomes.map(o => o.result)).toEqual(['boil']);
    expect(shot.lab.brews).toBe(BREWS);
    expect(shot.lab.bulb).toEqual([]);

    const beam = rig();
    beam.state.polarity = 'negative';
    beam.fireBeam();
    expect(beam.outcomes.filter(o => o.result !== 'cool').map(o => o.result)).toEqual(['boil']);
    expect(beam.lab.brews).toBe(BREWS);
    expect(beam.lab.bulb).toEqual([]);
  });
});
