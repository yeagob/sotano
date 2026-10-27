import * as THREE from 'three';
import { pal } from '../content/palette';
import { buildChest, disposeChest, type ChestModel } from '../render/chest-model';
import type { ChestSpec } from '../world/floor';

const SHUDDER = 0.16;
const SWING = 0.42;
const OPEN_ANGLE = -1.9;

export interface ChestView {
  spec: ChestSpec;
  model: ChestModel;
  t: number;
  lockVy: number;
  holes: { mat: THREE.Material & { color: THREE.Color }; base: THREE.Color }[];
}

export class Chests {
  readonly list: ChestView[] = [];
  private group = new THREE.Group();
  private time = 0;
  private hot = new THREE.Color(pal('light.hot'));

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  add(spec: ChestSpec, facing: number): ChestView {
    const model = buildChest({ keys: spec.keys, practice: spec.item !== null });
    model.root.position.set(spec.x + 0.5, spec.y, spec.z + 0.5);
    model.root.rotation.y = facing;
    model.inner.visible = false;
    this.group.add(model.root);
    const holes = model.keyholes.map(m => {
      const mat = m.material as THREE.Material & { color: THREE.Color };
      return { mat, base: mat.color.clone() };
    });
    const v: ChestView = { spec, model, t: -1, lockVy: 0, holes };
    this.list.push(v);
    return v;
  }

  open(v: ChestView) {
    v.t = 0;
    for (const h of v.holes) h.mat.color.copy(this.hot);
    return SHUDDER + SWING * 0.45;
  }

  update(dt: number, keys: number) {
    this.time += dt;
    const glint = 0.5 + 0.5 * Math.sin(this.time * 4);
    for (const v of this.list) {
      const m = v.model;
      if (v.t < 0) {
        const can = v.spec.keys > 0 && keys >= v.spec.keys;
        for (const h of v.holes) h.mat.color.copy(h.base).lerp(this.hot, can ? 0.45 + 0.55 * glint : 0);
        continue;
      }
      if (v.t > SHUDDER + SWING + 4) continue;
      v.t += dt;
      const t = v.t;
      if (t < SHUDDER) {
        const k = t / SHUDDER;
        m.root.scale.set(1 + 0.06 * k, 1 - 0.08 * k, 1 + 0.06 * k);
        m.lid.rotation.x = Math.sin(t * 90) * 0.04;
        continue;
      }
      const s = Math.min(1, (t - SHUDDER) / SWING);
      const back = 1 + 2.4 * (s - 1) ** 3 + 1.4 * (s - 1) ** 2;
      m.lid.rotation.x = OPEN_ANGLE * back;
      const pop = Math.max(0, 1 - s * 2);
      m.root.scale.set(1 - 0.04 * pop, 1 + 0.1 * pop, 1 - 0.04 * pop);
      if (m.lock?.visible) {
        v.lockVy -= 18 * dt;
        m.lock.position.y += v.lockVy * dt;
        m.lock.position.z += 0.6 * dt;
        m.lock.rotation.x += 6 * dt;
        const k = Math.max(0, 1 - (t - SHUDDER) / 0.5);
        m.lock.scale.setScalar(k);
        if (k <= 0) m.lock.visible = false;
      }
      m.inner.visible = true;
      const glow = Math.min(1, (t - SHUDDER) / 0.25) * (t < SHUDDER + SWING + 1.2 ? 1 : Math.max(0.35, 1 - (t - SHUDDER - SWING - 1.2) / 2.5));
      m.inner.scale.setScalar(0.6 + 0.4 * glow);
      m.inner.traverse(o => {
        const mat = (o as THREE.Mesh | THREE.Sprite).material as THREE.Material | undefined;
        if (mat && 'opacity' in mat) { mat.transparent = true; mat.opacity = glow; }
      });
    }
  }
  dispose() {
    this.scene.remove(this.group);
    for (const v of this.list) disposeChest(v.model);
  }
}
