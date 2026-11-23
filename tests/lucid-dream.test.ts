// Lucid Dream (docs/design/built/practices/MIRACLES.md, miracle #122). The rules that move the body are pure
// (game/phase.ts): the passable solid, the room box, and the rescue that ends a phase inside a block. The item's
// pickup hook runs through the real bus and inventory with a stand-in host. Random positions use a fixed seed.

import { describe, expect, it } from 'vitest';
import luciddream from '../src/content/items/luciddream';
import { ITEM_BY_ID } from '../src/content/items';
import { validateItem } from '../src/items/validate';
import { Inventory } from '../src/items/inventory';
import type { HostApi, ItemDef } from '../src/items/types';
import { createBus, type GameBus } from '../src/game/events';
import { StatSheet } from '../src/core/stats';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { PHASE_CAP, PHASE_SECONDS, PHASE_STATUS, phasedSolid, rescueSpot, roomBox, roomInterior, fallbackBox, inBox, type CellBox } from '../src/game/phase';
import { boxHits } from '../src/physics/voxel-collide';

/** A seeded generator, so the random cases are the same every run. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

const ROOM = { x0: 2, y0: 1, z0: 2, w: 13, d: 7, height: 4 };
const INTERIOR = roomInterior(ROOM);
const BOX = roomBox(ROOM);

/**
 * A room in a rock world: everything outside the room's interior is solid (walls, floor, ceiling, rock), and inside it
 * the cells in `blocks` are solid. `finite` marks which solid cells have finite hp (passable while phased).
 */
function roomWorld(blocks: Set<string>, finite: Set<string>) {
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const inside = (x: number, y: number, z: number) => inBox(INTERIOR, x, y, z);
  const solid = (x: number, y: number, z: number) => !inside(x, y, z) || blocks.has(key(x, y, z));
  const breakable = (x: number, y: number, z: number) => finite.has(key(x, y, z)) && inside(x, y, z) && blocks.has(key(x, y, z));
  return { solid, breakable, key };
}

describe('Lucid Dream is a miracle that lets the body pass through finite blocks', () => {
  it('is a valid practice of the Miracles path, in the vault and boss pools, quality 4, with the miracle tag', () => {
    expect(validateItem(luciddream)).toEqual([]);
    expect(ITEM_BY_ID.get('luciddream')).toBe(luciddream);
    expect(luciddream.pools).toEqual({ vault: 1, boss: 0.5 });
    expect(luciddream.tags).toEqual(expect.arrayContaining(['milagros', 'miracle']));
    expect(luciddream.quality).toBe(4);
  });

  it('its effect states the numbers, and its name, effect and teaching exist in both languages with the same numbers', () => {
    expect(luciddream.effect).toContain('3 seconds');
    expect(luciddream.effect).toContain('up to 6');
    const es = (ES.content.items as Record<string, { name: string; effect: string }>).luciddream;
    expect(es.name).toBeTruthy();
    expect(es.effect).toContain('3 s');
    expect(es.effect).toContain('hasta 6');
    expect((EN.messages as Record<string, string>)['teach.luciddream.quote']).toBeTruthy();
    expect((ES.messages as Record<string, string>)['teach.luciddream.quote']).toBeTruthy();
    expect((EN.messages as Record<string, string>)['teach.luciddream.lesson']).toBeTruthy();
    expect((ES.messages as Record<string, string>)['teach.luciddream.lesson']).toBeTruthy();
    expect((EN.messages as Record<string, string>)['hud.phase.left']).toBeTruthy();
    expect((ES.messages as Record<string, string>)['hud.phase.left']).toBeTruthy();
  });

  it('a bomb, a key or a heart that is collected starts or extends the phase; a refused pickup does nothing', () => {
    const bus: GameBus = createBus();
    const calls: { id: string; s: number; opts?: { add?: boolean; cap?: number } }[] = [];
    const api = {
      get bus() { return bus; },
      stats: () => new StatSheet().all,
      has: () => false, hasTag: () => false, held: () => [],
      rng: () => ({ next: () => 0.5 }),
      defer: (fn: () => void) => bus.defer(fn),
      grantStatus: (id: string, s: number, opts?: { add?: boolean; cap?: number }) => { calls.push({ id, s, opts }); },
    } as unknown as HostApi;
    const catalog = new Map<string, ItemDef>([[luciddream.id, luciddream]]);
    const inv = new Inventory(catalog, [], new StatSheet(), () => bus, () => api);
    inv.gain('luciddream');

    bus.emit('pickupCollect', { kind: 'bomb', amount: 1 });
    bus.emit('pickupCollect', { kind: 'key', amount: 1 });
    bus.emit('pickupCollect', { kind: 'heart', amount: 2, heart: 'red' });
    bus.flush(64);
    expect(calls).toHaveLength(3);
    for (const c of calls) expect(c).toEqual({ id: PHASE_STATUS, s: PHASE_SECONDS, opts: { add: true, cap: PHASE_CAP } });
    expect(PHASE_SECONDS).toBe(3);
    expect(PHASE_CAP).toBe(6);

    calls.length = 0;
    bus.emit('pickupCollect', { kind: 'key', amount: 0 });
    bus.flush(64);
    expect(calls).toHaveLength(0);
  });

  it('a phased body passes finite blocks inside the room box, never unbreakable blocks, and is solid outside the box', () => {
    const blocks = new Set(['5,2,4', '5,2,5', '6,2,4']);
    const finite = new Set(['5,2,4', '5,2,5']); // (6,2,4) is unbreakable
    const w = roomWorld(blocks, finite);
    const phased = phasedSolid(w.solid, w.breakable, BOX);
    expect(phased(5, 2, 4)).toBe(false);          // finite block: passable
    expect(phased(6, 2, 4)).toBe(true);           // unbreakable block: solid
    expect(phased(BOX.x1 + 1, 2, 4)).toBe(true);  // beyond the walls of the room: solid
    expect(phased(BOX.x0 - 1, 2, 4)).toBe(true);  // the wall layer is in the box, but this rock is not finite: solid
    expect(phased(4, BOX.y1 + 1, 4)).toBe(true);  // above the ceiling layer: solid
    expect(phased(4, BOX.y0 - 1, 4)).toBe(true);  // the floor layer is outside the box: a phased body cannot sink
    expect(phased(4, 2, 4)).toBe(false);          // open room cell: free as before
  });

  it('the rescue ends inside free room interior from many random positions inside blocks (seeded, 400 cases)', () => {
    const rnd = lcg(122);
    for (let n = 0; n < 400; n++) {
      const blocks = new Set<string>();
      const finite = new Set<string>();
      for (let z = INTERIOR.z0; z <= INTERIOR.z1; z++) for (let x = INTERIOR.x0; x <= INTERIOR.x1; x++) for (let y = INTERIOR.y0; y <= INTERIOR.y1; y++) {
        if (rnd() < 0.35) { blocks.add(`${x},${y},${z}`); if (rnd() < 0.7) finite.add(`${x},${y},${z}`); }
      }
      const w = roomWorld(blocks, finite);
      // the body is somewhere inside the room box, possibly inside a block (a phase that is ending)
      const feet = {
        x: BOX.x0 + rnd() * (BOX.x1 - BOX.x0 + 1),
        y: BOX.y0 + rnd() * (BOX.y1 - BOX.y0 + 1),
        z: BOX.z0 + rnd() * (BOX.z1 - BOX.z0 + 1),
      };
      const at = rescueSpot(w.solid, feet, [{ box: INTERIOR }], 0.3, 1.8);
      if (!at) throw new Error(`no free spot at case ${n}`);
      expect(inBox(INTERIOR, Math.floor(at.x), Math.floor(at.y), Math.floor(at.z))).toBe(true);
      expect(boxHits(w.solid, at.x, at.y, at.z, 0.3, 1.8)).toBe(false);
    }
  });

  it('the rescue picks the nearest free spot (checked against a brute-force search on the same room)', () => {
    const rnd = lcg(7);
    for (let n = 0; n < 60; n++) {
      const blocks = new Set<string>();
      for (let z = INTERIOR.z0; z <= INTERIOR.z1; z++) for (let x = INTERIOR.x0; x <= INTERIOR.x1; x++) for (let y = INTERIOR.y0; y <= INTERIOR.y1; y++) {
        if (rnd() < 0.3) blocks.add(`${x},${y},${z}`);
      }
      const w = roomWorld(blocks, new Set());
      const feet = { x: INTERIOR.x0 + rnd() * 13, y: INTERIOR.y0 + rnd() * 3, z: INTERIOR.z0 + rnd() * 7 };
      const at = rescueSpot(w.solid, feet, [{ box: INTERIOR }], 0.3, 1.8);
      expect(at).not.toBeNull();
      // the score of a standing cell (cx, cy, cz): its centre's distance to the feet, plus a penalty without ground
      const score = (cx: number, cy: number, cz: number) => {
        const ground = w.solid(cx, cy - 1, cz);
        return (cx + 0.5 - feet.x) ** 2 + (cy - feet.y) ** 2 + (cz + 0.5 - feet.z) ** 2 + (ground ? 0 : 16);
      };
      let best = Infinity;
      for (let z = INTERIOR.z0; z <= INTERIOR.z1; z++) for (let y = INTERIOR.y0; y <= INTERIOR.y1; y++) for (let x = INTERIOR.x0; x <= INTERIOR.x1; x++) {
        if (boxHits(w.solid, x + 0.5, y, z + 0.5, 0.3, 1.8)) continue;
        best = Math.min(best, score(x, y, z));
      }
      expect(score(Math.floor(at!.x), at!.y, Math.floor(at!.z))).toBeCloseTo(best, 9);
    }
  });

  it('a phase in no room uses a small box around the feet, and the rescue stays in that box', () => {
    const box: CellBox = fallbackBox(10.4, 5, 10.4);
    expect(inBox(box, 10, 5, 10)).toBe(true);
    expect(inBox(box, 20, 5, 10)).toBe(false);
    const solid = (x: number, y: number, z: number) => !inBox(box, x, y, z) || (x === 10 && y === 5 && z === 10);
    const at = rescueSpot(solid, { x: 10.5, y: 5, z: 10.5 }, [{ box }], 0.3, 1.8);
    expect(at).not.toBeNull();
    expect(inBox(box, Math.floor(at!.x), Math.floor(at!.y), Math.floor(at!.z))).toBe(true);
  });
});
