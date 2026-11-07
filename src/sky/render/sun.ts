// The Sun, the one warmth that is not a threat (provisional, docs/art/sky/totality.md): a pale disc and its corona,
// unfogged, seen from the solar approach. It stands at the Sun's volume (the sphere the last jump enters, plan.sun),
// not above the eye: from far off it is drawn on the same line at FAR_DRAW (far.ts); up close it is drawn at its
// true size, so the last jump visibly enters it.

import * as THREE from 'three';
import { palCss } from '../../content/palette';
import type { SkyViewApi, Vec3 } from '../types';
import { backdrop, placeFar } from './far';

/**
 * The corona: three concentric shells, outermost first, each at its opacity at full strength. They add up toward the
 * disc, so the corona falls off outward and has no hard edge. The disc is drawn over them (renderOrder -1 against -2).
 */
export const CORONA_SHELLS: readonly { readonly radius: number; readonly opacity: number }[] = [
  { radius: 90, opacity: 0.1 },
  { radius: 60, opacity: 0.14 },
  { radius: 40, opacity: 0.16 },
];
/**
 * The corona's outer radius in blocks. The disc's radius is the Sun's volume's (plan.sun.r). The 200-block far plane bounds
 * the group's centre only (far.ts): near the Sun, the corona's far edge may pass it, and its visible front is still drawn.
 */
export const CORONA_RADIUS = CORONA_SHELLS[0].radius;
/** The corona is at full strength this far from the Sun's centre (blocks); from the disc's edge to here it fades in. */
export const CORONA_FULL_AT = 180;
/** Shown from this height up (the solar approach). */
export const SUN_SHOWN_FROM = 640;

/** The Sun's volume: its centre and radius, as the totality plan gives it. */
export interface SunVolume { readonly x: number; readonly y: number; readonly z: number; readonly r: number }

/** The corona's strength at `d` blocks from the Sun's centre: 0 at the disc's edge, 1 from CORONA_FULL_AT, smooth between. */
export function coronaFade(d: number, discRadius: number): number {
  const t = Math.min(1, Math.max(0, (d - discRadius) / (CORONA_FULL_AT - discRadius)));
  return t * t * (3 - 2 * t);
}

export class SunView implements SkyViewApi {
  private readonly group = new THREE.Group();
  private readonly discGeo: THREE.SphereGeometry;
  private readonly shellGeos: THREE.SphereGeometry[] = [];
  private readonly disc: THREE.MeshBasicMaterial;
  private readonly shells: THREE.MeshBasicMaterial[] = [];

  constructor(private readonly root: THREE.Object3D, private readonly volume: SunVolume) {
    this.discGeo = new THREE.SphereGeometry(volume.r, 32, 24);
    this.disc = new THREE.MeshBasicMaterial({ color: palCss('sky.strata.corona'), fog: false, opacity: 1 });
    const halos: THREE.Mesh[] = [];
    for (const s of CORONA_SHELLS) {
      const geo = new THREE.SphereGeometry(s.radius, 32, 24);
      // additive: the corona is light added to the dusk, so it brightens the air instead of greying it
      const mat = new THREE.MeshBasicMaterial({
        color: palCss('sky.strata.corona'), side: THREE.BackSide, transparent: true, opacity: s.opacity, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      this.shellGeos.push(geo);
      this.shells.push(mat);
      halos.push(new THREE.Mesh(geo, mat));
    }
    this.group.add(new THREE.Mesh(this.discGeo, this.disc), ...halos);
    backdrop(this.group);
    // the corona first, the disc over it: the additive light never brightens the disc itself
    for (const h of halos) h.renderOrder = -2;
    root.add(this.group);
  }

  update(eye: Vec3, _dt: number) {
    this.group.visible = eye.y >= SUN_SHOWN_FROM;
    const v = this.volume;
    const fade = coronaFade(Math.hypot(eye.x - v.x, eye.y - v.y, eye.z - v.z), v.r);
    this.shells.forEach((m, i) => { m.opacity = CORONA_SHELLS[i].opacity * fade; });
    placeFar(this.group, eye, this.volume, CORONA_RADIUS);
  }

  dispose() {
    this.root.remove(this.group);
    this.discGeo.dispose();
    for (const g of this.shellGeos) g.dispose();
    this.disc.dispose();
    for (const m of this.shells) m.dispose();
  }
}
