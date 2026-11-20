import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Particles, heartCells, heartGeometry } from '../src/render/particles';

function raster(geo: THREE.BufferGeometry, cols: number, rows: number): string[] {
  const pos = geo.getAttribute('position');
  const tris: [number, number][][] = [];
  for (let t = 0; t < pos.count; t += 3) tris.push([0, 1, 2].map(k => [pos.getX(t + k), pos.getY(t + k)] as [number, number]));
  const inside = (px: number, py: number, [a, b, c]: [number, number][]) => {
    const s = (p: [number, number], q: [number, number]) => (q[0] - p[0]) * (py - p[1]) - (q[1] - p[1]) * (px - p[0]);
    const d1 = s(a, b), d2 = s(b, c), d3 = s(c, a);
    const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    return area > 1e-9 && !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const out: string[] = [];
  const cell = 1 / cols;
  for (let j = 0; j < rows; j++) {
    let line = '';
    for (let i = 0; i < cols; i++) {
      const px = (i - (cols - 1) / 2) * cell, py = ((rows - 1) / 2 - j) * cell;
      line += tris.some(t => inside(px, py, t)) ? '#' : '.';
    }
    out.push(line);
  }
  return out;
}

describe('heart particles (issue #264)', () => {
  it('the heart geometry rasterises to a heart: two lobes, a notch, one tip', () => {
    const img = raster(heartGeometry(), 9, 8);
    expect(img).toEqual([
      '.##...##.',
      '####.####',
      '#########',
      '#########',
      '.#######.',
      '..#####..',
      '...###...',
      '....#....',
    ]);
  });

  it('the heart is shaded darker toward its lower right and never brighter than its colour', () => {
    const cells = heartCells();
    expect(cells.every(c => c.shade > 0 && c.shade <= 1)).toBe(true);
    const tip = cells.find(c => c.j === 7)!;
    const lobe = cells.find(c => c.j === 2 && c.i === 1)!;
    expect(tip.shade).toBeLessThan(lobe.shade);
  });

  it('hearts are drawn on their own instanced mesh, rise, face the eye and clear on a passage', () => {
    const scene = new THREE.Scene();
    const p = new Particles(scene);
    const meshes = scene.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh);
    expect(meshes).toHaveLength(2);
    const [cubes, hearts] = meshes;
    p.burst(0, 0, 0, 0xffffff, 4);
    p.hearts(0, 1, 0, 0xffffff, 6, 0.5, 0.2);
    p.update(1 / 60, { x: 10, z: 0 });
    expect(cubes.count).toBe(4);
    expect(hearts.count).toBe(6);
    const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    hearts.getMatrixAt(0, m);
    m.decompose(pos, q, s);
    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const toEye = new THREE.Vector3(10 - pos.x, 0, 0 - pos.z).normalize();
    expect(facing.dot(toEye)).toBeGreaterThan(0.99);
    const y0 = pos.y;
    p.update(0.3, { x: 10, z: 0 });
    hearts.getMatrixAt(0, m);
    m.decompose(pos, q, s);
    expect(pos.y).toBeGreaterThan(y0);
    p.clear();
    expect(hearts.count).toBe(0);
    expect(p.heartCount).toBe(0);
    p.update(2);
    expect(hearts.count).toBe(0);
  });

  it('every heart is gone within its life, above the light minimum', () => {
    const p = new Particles(new THREE.Scene());
    p.hearts(0, 0, 0, 0xffffff, 10);
    p.update(0.3);
    expect(p.heartCount).toBe(10);
    p.update(1.2);
    expect(p.heartCount).toBe(0);
  });
});
