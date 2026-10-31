import { describe, expect, it } from 'vitest';
import { cellOverlap, PLACE_NUDGE_MAX } from '../src/game/placement';

// A body 0.6 wide and 1.8 tall, standing on the floor at the origin (its centre on x, z).
const body = (x: number, z: number) => ({ x, y: 0, z, hw: 0.3, h: 1.8 });

describe('placing a block where the body stands', () => {
  it('finds no overlap when the body is clear of the cell', () => {
    expect(cellOverlap(body(0.5, 0.5), 1, 0, 0)).toBeNull();
  });

  it('finds no overlap when the body only touches the cell face', () => {
    // body reaches x=0.8; the cell starts at x=0.8
    expect(cellOverlap(body(0.5, 0.5), 0.8, 0, 0.5)).toBeNull();
  });

  it('reports a shallow overlap and the way out along the shallowest axis', () => {
    // body x spans 0.0..0.6 center 0.3; cell at x=0.5 (cell x 0.5..1.5): overlap 0.1 on x
    const o = cellOverlap(body(0.3, 0.5), 0.5, 0, 0.5)!;
    expect(o.axis).toBe(0);
    expect(o.depth).toBeCloseTo(0.1);
    expect(o.dir).toBe(-1); // the body is on the cell's low side, so it is pushed toward -x
  });

  it('pushes along z when z is the shallow axis', () => {
    // body z spans 0.0..0.6, the cell starts at z=0.5: 0.1 deep, pushed toward -z
    const o = cellOverlap(body(0.5, 0.3), 0, 0, 0.5)!;
    expect(o.axis).toBe(2);
    expect(o.depth).toBeCloseTo(0.1);
    expect(o.dir).toBe(-1);
  });

  it('a quarter of a block or less is nudgeable, deeper is not', () => {
    // body x spans 0.1..0.7 (0.2 into the cell at x=0.5): nudgeable
    expect(cellOverlap(body(0.4, 0.5), 0.5, 0, 0.5)!.depth).toBeLessThanOrEqual(PLACE_NUDGE_MAX);
    // body x spans 0.5..1.1 and z 0.4..1.0: both overlaps are 0.5 deep, so the body is refused
    expect(cellOverlap(body(0.8, 0.7), 0.5, 0, 0.5)!.depth).toBeGreaterThan(PLACE_NUDGE_MAX);
  });

  it('ignores a cell above the body\'s head', () => {
    expect(cellOverlap(body(0.5, 0.5), 0, 2, 0)).toBeNull();
  });
});
