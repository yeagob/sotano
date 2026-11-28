// The great worm as the player sees it (issue #354, docs/design/built/levels/worm-desert/WORM.md): one box per segment,
// unlit and baked (a lighter top, darker flanks and belly, ART-GUIDE §2), a ring plate at each joint, and on the head
// a dark mouth with a ring of pale teeth. A drawn body: it never writes a block, so the mesher never sees it. Parts
// under the sand are hidden by the sand itself (the depth test). Colours are palette tokens only.

import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';
import { WORM, type SandWorm } from '../entities/sand-worm';

/** Top, flanks, belly, plates, mouth, teeth (the world's side: the pale stone of the desert, ART-GUIDE §2). */
const TOP: PalToken = 'limestone.hi', FLANK: PalToken = 'limestone.base', BELLY: PalToken = 'limestone.dark';
const PLATE: PalToken = 'mat.ashlar.dark', MOUTH: PalToken = 'ink.void', TOOTH: PalToken = 'bone.paper';
/** A calm worm's plates take the player's gold: the colour of the light that calmed it (DECISIONS: gold is repair). */
const TAME_PLATE: PalToken = 'light.gold';

const basic = (t: PalToken) => new THREE.MeshBasicMaterial({ color: pal(t) });

export class WormView {
  private readonly group = new THREE.Group();
  private readonly segs: THREE.Group[] = [];
  private readonly plates: THREE.MeshBasicMaterial;
  private tame = false;

  constructor(root: THREE.Object3D) {
    const R = WORM.radius, L = WORM.plate;
    // BoxGeometry groups: +x, -x, +y, -y, +z, -z (x runs along the spine, +x toward the head)
    const body = new THREE.BoxGeometry(L, 2 * R, 2 * R);
    const side = basic(FLANK), top = basic(TOP), belly = basic(BELLY), mouth = basic(MOUTH);
    const bodyMats = [side, side, top, belly, side, side];
    const headMats = [mouth, side, top, belly, side, side];
    this.plates = basic(PLATE);
    const ring = new THREE.BoxGeometry(1, 2 * R + 0.4, 2 * R + 0.4);
    const tooth = new THREE.BoxGeometry(1, 1.5, 1.5), toothMat = basic(TOOTH);
    for (let k = 0; k < WORM.segments; k++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(body, k === 0 ? headMats : bodyMats));
      const plate = new THREE.Mesh(ring, this.plates);
      plate.position.x = -L / 2 + 0.5;
      g.add(plate);
      if (k === 0) {
        // the ring of teeth round the mouth, on the head's front face
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2, t = new THREE.Mesh(tooth, toothMat);
          t.position.set(L / 2 + 0.4, Math.sin(a) * (R - 1.6), Math.cos(a) * (R - 1.6));
          g.add(t);
        }
      }
      g.visible = false;
      this.segs.push(g);
      this.group.add(g);
    }
    root.add(this.group);
  }

  update(worm: SandWorm | null) {
    const segs = worm?.segments ?? [];
    for (let k = 0; k < this.segs.length; k++) {
      const g = this.segs[k], s = segs[k];
      g.visible = !!s;
      if (!s) continue;
      g.position.set(s.x, s.top - WORM.radius, s.z);
      g.rotation.set(0, Math.atan2(-s.hz, s.hx), 0);
    }
    const tame = !!worm?.tamed;
    if (tame !== this.tame) { this.tame = tame; this.plates.color.setHex(pal(tame ? TAME_PLATE : PLATE)); }
  }

  dispose() {
    this.group.removeFromParent();
  }
}
