// Chests and hard walls (docs/design/CHESTS.md).
import { describe, expect, it } from 'vitest';
import { MAT, mat } from '../src/content/materials';
import { blockDamage } from '../src/core/damage';
import { CHEST_LOCK } from '../src/content/tables/chests';
import { Rng } from '../src/core/rng';
import { buildRun } from './helpers';
import { meshChunk } from '../src/world/mesher';
import { Pickups } from '../src/entities/pickups';
import * as THREE from 'three';

const ROOTS = [1, 7, 42, 999, 0xBEEF];

describe('chests', () => {
  it('are unbreakable blocks, closed and open', () => {
    for (const m of [MAT.chest, MAT.chestopen]) {
      expect(mat(m).tier).toBe(Infinity);
      expect(blockDamage(1e6, mat(m))).toBe(0);
    }
  });

  it('stand on the floor of a room, one block, with their keys decided by the seed', () => {
    for (const root of ROOTS) {
      const run = buildRun(root);
      for (const f of run.floors) for (const c of f.chests) {
        expect(run.w.get(c.x, c.y, c.z), `floor ${f.floor}`).toBe(MAT.chest);
        expect(run.w.solid(c.x, c.y - 1, c.z)).toBe(true);
        expect(c.keys).toBeGreaterThanOrEqual(0);
        expect(c.keys).toBeLessThanOrEqual(3);
      }
    }
  });

  it('appear on every floor over a few seeds, some free and some locked, some asking for more than one key', () => {
    const perFloor = new Map<number, number>();
    const costs = new Set<number>();
    for (const root of ROOTS) for (const f of buildRun(root).floors) {
      perFloor.set(f.floor, (perFloor.get(f.floor) ?? 0) + f.chests.length);
      for (const c of f.chests) costs.add(c.keys);
    }
    for (const [floor, n] of perFloor) if (floor > 0) expect(n, `floor ${floor}`).toBeGreaterThan(0);
    expect(costs.has(0)).toBe(true);
    expect(costs.has(1)).toBe(true);
    expect([...costs].some(k => k >= 2)).toBe(true);
  });

  it('shut at least half of the treasure and vault practices away, never the boss practice', () => {
    let items = 0, shut = 0;
    for (const root of [1, 2, 3, 4, 5, 6, 7, 8]) for (const f of buildRun(root).floors) for (const p of f.pedestals) {
      if (p.boss) { expect(p.chest).toBe(false); continue; }
      items++;
      if (p.chest) {
        shut++;
        expect(f.chests.some(c => c.x === p.x && c.z === p.z && c.item === p.item && c.item !== null)).toBe(true);
      }
    }
    expect(shut / items).toBeGreaterThanOrEqual(0.5);
  });

  it('leave enough keys on the floor for most of what they cost', () => {
    for (const root of ROOTS) for (const f of buildRun(root).floors) {
      const cost = f.chests.reduce((s, c) => s + c.keys, 0);
      const doorKey = f.doors.some(d => d.locked) ? 1 : 0;
      if (cost > 0) expect(f.keys.length, `floor ${f.floor}`).toBeGreaterThan(doorKey);
    }
  });

  it('ask for more keys only deeper down', () => {
    const early = CHEST_LOCK.weights({ floor: 0 }).map(e => e.value);
    expect(Math.max(...early)).toBeLessThanOrEqual(1);
    const rng = new Rng(3);
    expect(CHEST_LOCK.roll(rng, { floor: 0 })).toBeLessThanOrEqual(1);
  });
});

describe('chest models', () => {
  it('are drawn by their entity: the mesher skips the cell and keeps the faces around it', () => {
    const P = 4;
    const stone = new Uint8Array(P ** 3);
    stone[1 + P * (1 + P * 1)] = MAT.stone;
    for (const m of [MAT.chest, MAT.chestopen]) {
      const lone = new Uint8Array(P ** 3);
      lone[1 + P * (1 + P * 1)] = m;
      expect(meshChunk(lone, 2).indices.length).toBe(0);
      const pair = stone.slice();
      pair[2 + P * (1 + P * 1)] = m;
      expect(meshChunk(pair, 2).indices.length).toBe(6 * 6);
    }
  });

  it('spit what they kept up on an arc that lands in front of them', () => {
    const solid = (_x: number, y: number) => y < 0;
    const pickups = new Pickups(new THREE.Scene());
    for (const type of ['key', 'item'] as const) {
      const p = pickups.add(type, 0.5, 1.02, 0.5, 0, null, 0.6);
      pickups.launch(p, 0, 6.5, 2.2);
      let top = p.y;
      for (let i = 0; i < 120; i++) { pickups.update(1 / 60, solid); top = Math.max(top, p.y); }
      expect(top).toBeGreaterThan(1.8);
      expect(p.flying).toBe(false);
      expect(p.y).toBe(0);
      expect(p.z).toBeGreaterThan(1.5);
    }
  });
});

describe('walls around locked doors', () => {
  it('a vault room is wrapped in obsidian, and its doorway frame is what is left open', () => {
    let vaults = 0;
    for (const root of ROOTS) for (const f of buildRun(root).floors) for (const d of f.doors.filter(x => x.locked)) {
      for (const id of d.rooms) {
        const rm = f.rooms.find(r => r.id === id)!;
        if (rm.type !== 'vault') continue;
        vaults++;
        // the wall just beyond the room's far side, the ceiling and the floor are hard rock
        const run = buildRun(root);
        const w = run.w;
        const samples = [
          [rm.x0 + 6, rm.y0 + rm.height + 1, rm.z0 + 3],
          [rm.x0 + 6, rm.y0 - 2, rm.z0 + 3],
        ];
        for (const [x, y, z] of samples) expect(mat(w.get(x, y, z)).tier, `vault ${id} at ${x},${y},${z}`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(vaults).toBeGreaterThan(0);
  });
});
