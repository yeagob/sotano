// The sandbox's scenarios (docs/architecture/SANDBOX.md): each one validates and carves headless,
// and the same scenario always carves the same room.

import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { RunRandom } from '../src/core/rng';
import { BLANK, SCENARIOS } from '../src/sandbox/catalogue';
import { carveSandbox, validateScenario, type Scenario } from '../src/sandbox/scenario';
import { mapAt } from '../src/sandbox/report';
import { createDungeonWorld, planDungeon } from '../src/world/floor';

function carve(s: Scenario) {
  const rr = new RunRandom(s.seed ?? 1);
  const w = createDungeonWorld(rr, planDungeon(rr));
  return { w, box: carveSandbox(w, rr, s) };
}

describe('sandbox', () => {
  it('has scenarios, and every one is valid', () => {
    expect(SCENARIOS.length).toBeGreaterThan(0);
    for (const s of [BLANK, ...SCENARIOS]) expect(validateScenario(s), s.id).toEqual([]);
  });

  it('reports unknown ids', () => {
    const errs = validateScenario({ id: 'bad', template: 'nope', items: ['nope'], place: [{ at: [0, 0, 0], block: 'nope' }] });
    expect(errs).toHaveLength(3);
  });

  it('carves rows exactly where the scenario says, sealed by its shell', () => {
    const { w, box } = carve({ id: 't', rows: ['c.r', '...', 'f..'], shell: 'obsidian', place: [{ at: [1, 0, 1], block: 'ore' }] });
    expect(mapAt(w, box.room, 0)).toEqual(['c.r', '.i.', 'F..']);
    const [x0, y0, z0] = box.origin;
    expect(w.get(x0 - 1, y0, z0)).toBe(MAT.obsidian);
    expect(w.get(x0, y0 - 1, z0)).toBe(MAT.obsidian);
    expect(w.get(x0, y0 + box.room.height, z0)).toBe(MAT.obsidian);
    expect(w.get(x0 + 1, y0 + 1, z0 + 1)).toBe(AIR);
  });

  it('the same scenario carves the same world', () => {
    for (const s of SCENARIOS.slice(0, 3)) {
      const a = carve(s).w, b = carve(s).w;
      expect(Buffer.compare(a.data, b.data), s.id).toBe(0);
      expect(Buffer.compare(a.elem, b.elem), s.id).toBe(0);
    }
  });
});
