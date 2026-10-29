// Chest lids (issue #4): an open lid never passes through the chest's own body or padlock.
// The lid is swept through every angle it can reach, and every sampled point of the body
// is checked in the lid's frame.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

// buildChest makes a canvas for its planks; the node test environment has none.
(globalThis as { document?: unknown }).document ??= {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => new Proxy({}, { get: (_t, p) => (p === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
  }),
};
const { buildChest } = await import('../src/render/chest-model');

const T = 1 / 16;
const EPS = 1e-3;

function inside(p: THREE.Vector3, b: THREE.Box3) {
  return p.x > b.min.x + EPS && p.x < b.max.x - EPS && p.y > b.min.y + EPS && p.y < b.max.y - EPS && p.z > b.min.z + EPS && p.z < b.max.z - EPS;
}

describe('chest lids', () => {
  for (const cfg of [{ keys: 0, practice: false }, { keys: 1, practice: false }, { keys: 3, practice: false }, { keys: 0, practice: true }, { keys: 2, practice: true }]) {
    it(`never pass through the body or the lock (keys ${cfg.keys}, practice ${cfg.practice})`, () => {
      const m = buildChest(cfg);
      const step = 0.5 * T;
      const bodyBoxes: THREE.Box3[] = [];
      m.root.updateMatrixWorld(true);
      m.root.children[0].traverse(o => { if ((o as THREE.Mesh).isMesh) bodyBoxes.push(new THREE.Box3().setFromObject(o)); });

      // lid parts as boxes in the lid's own frame (at rest the lid is not rotated)
      m.lid.rotation.x = 0; m.lid.updateMatrixWorld(true);
      const toLid0 = new THREE.Matrix4().copy(m.lid.matrixWorld).invert();
      const lidBoxes: THREE.Box3[] = [];
      m.lid.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.updateMatrixWorld(true);
        mesh.geometry.computeBoundingBox();
        lidBoxes.push(mesh.geometry.boundingBox!.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(toLid0, mesh.matrixWorld)));
      });

      const p = new THREE.Vector3();
      const hits: string[] = [];
      for (let a = -0.05; a >= -2.1; a -= 0.05) {
        m.lid.rotation.x = a;
        m.lid.updateMatrixWorld(true);
        const toLid = new THREE.Matrix4().copy(m.lid.matrixWorld).invert();
        for (const b of bodyBoxes) {
          for (let x = b.min.x + step / 2; x < b.max.x; x += step)
            for (let y = b.min.y + step / 2; y < b.max.y; y += step)
              for (let z = b.min.z + step / 2; z < b.max.z; z += step) {
                p.set(x, y, z).applyMatrix4(toLid);
                if (lidBoxes.some(lb => inside(p, lb))) hits.push(`angle ${a.toFixed(2)}`);
              }
        }
      }
      expect(hits.slice(0, 3)).toEqual([]);
    });
  }
});
