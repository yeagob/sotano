import { describe, expect, it } from 'vitest';
import { FreezeSpheres, SPHERE_EVERY, SPHERE_FREEZE, SPHERE_GROW, SPHERE_RADIUS, sphereRadius, type SphereTarget } from '../src/combat/freeze-sphere';
import guardingTheCentre from '../src/content/items/guarding-the-centre';
import { Freeze } from '../src/core/freeze';

const DT = 1 / 60;

describe('Guarding the Centre, the koala gift: the freezing sphere (#357)', () => {
  it('a sphere every 3 s, growing linearly from 0 to 4 blocks in 1.5 s (at 0.5 s it is not yet 4), freezing for 3 s', () => {
    expect([SPHERE_EVERY, SPHERE_RADIUS, SPHERE_GROW, SPHERE_FREEZE]).toEqual([3, 4, 1.5, 3]);
    expect(sphereRadius(0)).toBe(0);
    expect(sphereRadius(0.5)).toBeCloseTo(4 / 3);
    expect(sphereRadius(0.75)).toBeCloseTo(2);
    expect(sphereRadius(1.5)).toBe(4);
    expect(sphereRadius(3)).toBe(4);
    expect(guardingTheCentre.stats).toEqual([{ stat: 'freezeSphere', layer: 'add', value: 1 }]);
  });

  it('is emitted every 3 s while held, and none without it', () => {
    const s = new FreezeSpheres();
    const born: number[] = [];
    for (let t = DT; t <= 9.1; t += DT) if (s.update(DT, true, { x: 0, y: 0, z: 0 }, [], () => {})) born.push(Math.round(t * 10) / 10);
    expect(born).toEqual([3, 6, 9]);
    const off = new FreezeSpheres();
    let any = false;
    for (let t = 0; t < 9; t += DT) any = !!off.update(DT, false, { x: 0, y: 0, z: 0 }, [], () => {}) || any;
    expect(any).toBe(false);
  });

  it('reaches a target when its radius gets there, once per sphere; beyond 4 blocks nothing is frozen', () => {
    const s = new FreezeSpheres();
    const targets: SphereTarget[] = [{ id: 1, x: 2, y: 0, z: 0 }, { id: 2, x: 0, y: 0, z: 3.9 }, { id: 3, x: 5, y: 0, z: 0 }];
    const hits: [number, number][] = [];
    let t = 0;
    for (; t < 3 + 1.6; t += DT) s.update(DT, true, { x: 0, y: 0, z: 0 }, targets, id => hits.push([id, t]));
    expect(hits.map(h => h[0])).toEqual([1, 2]);
    expect(hits[0][1] - 3).toBeCloseTo(0.75, 1);
    expect(hits[1][1] - 3).toBeCloseTo(1.46, 1);
  });

  it('a target in a freeze cadence is not frozen again: frozen 3 s, then 3 s of cadence', () => {
    const s = new FreezeSpheres();
    const ice = new Freeze();
    const frozenAt: number[] = [];
    let t = 0;
    for (; t < 15; t += DT) {
      ice.tick(DT);
      s.update(DT, true, { x: 0, y: 0, z: 0 }, [{ id: 1, x: 1, y: 0, z: 0 }], () => { if (ice.start(SPHERE_FREEZE)) frozenAt.push(t); });
    }
    expect(frozenAt.length).toBeGreaterThanOrEqual(2);
    expect(frozenAt[0]).toBeCloseTo(3.375, 1);
    for (let k = 1; k < frozenAt.length; k++) expect(frozenAt[k] - frozenAt[k - 1]).toBeGreaterThanOrEqual(6 - 2 * DT);
  });
});
