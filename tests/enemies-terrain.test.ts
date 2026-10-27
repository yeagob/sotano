import { describe, expect, it } from 'vitest';
import { FlowField, type RoomArea } from '../src/enemies/flowfield';
import { moveBody, type Body } from '../src/physics/voxel-collide';

const room: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 9, d: 5, hx: 0, hz: 0 };
const floor = (_x: number, y: number) => y < 0;
const lava = (x: number, y: number) => y === 0 && x >= 5 && x <= 6;
const body = (x: number, y: number): Body => ({ x, y, z: 2.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.6, onGround: false });

describe('projection walls', () => {
  it('a walker blocked by what it avoids stops at its edge, sideways', () => {
    const b = body(4.5, 0);
    b.onGround = true;
    b.vx = 3;
    moveBody(floor, b, 1 / 10, lava);
    expect(b.x + b.hw).toBeLessThanOrEqual(5);
    expect(b.vx).toBe(0);
  });

  it('it falls into the lava under it rather than standing on it as a floor', () => {
    const b = body(5.5, 2);
    b.vy = -4;
    moveBody(floor, b, 1 / 2, lava);
    expect(b.y).toBeLessThan(0.5);
    expect(b.y).toBeGreaterThanOrEqual(0);
  });
});

describe('flow field keeps back from what a projection avoids', () => {
  it('a cell beside lava is unsafe, a cell two away is fine', () => {
    const f = new FlowField(room);
    f.update(floor, 1, 2, 'v1', (x, y) => (lava(x, y) ? 'avoid' : null));
    expect(f.unsafe(4.5, 2.5)).toBe(true);
    expect(f.unsafe(2.5, 2.5)).toBe(false);
  });

  it('it never routes through lava, and steps out of the margin toward a safe cell', () => {
    const f = new FlowField(room);
    f.update(floor, 1, 2, 'v1', (x, y) => (lava(x, y) ? 'avoid' : null));
    const out = f.escape(4.5, 2.5);
    expect(out).not.toBeNull();
    expect(out![0]).toBeLessThan(0);
  });
});
