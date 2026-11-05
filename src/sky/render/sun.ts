// The Sun, the one warmth that is not a threat (provisional, docs/art/sky/totality.md): a pale disc and its corona,
// unfogged, seen from the solar approach. It stands at the Sun's volume (the sphere the last jump enters, plan.sun),
// not above the eye: from far off it is drawn on the same line at FAR_DRAW (far.ts); up close it is drawn at its
// true size, so the last jump visibly enters it.

import * as THREE from 'three';
import { palCss } from '../../content/palette';
import type { SkyViewApi, Vec3 } from '../types';
import { backdrop, placeFar } from './far';

/** The corona's radius in blocks. The disc's radius is the Sun's volume's (plan.sun.r). */
export const CORONA_RADIUS = 90;
/** Shown from this height up (the solar approach). */
export const SUN_SHOWN_FROM = 640;

/** The Sun's volume: its centre and radius, as the totality plan gives it. */
export interface SunVolume { readonly x: number; readonly y: number; readonly z: number; readonly r: number }

export class SunView implements SkyViewApi {
  private readonly group = new THREE.Group();
  private readonly discGeo: THREE.SphereGeometry;
  private readonly coronaGeo: THREE.SphereGeometry;
  private readonly disc: THREE.MeshBasicMaterial;
  private readonly corona: THREE.MeshBasicMaterial;

  constructor(private readonly root: THREE.Object3D, private readonly volume: SunVolume) {
    this.discGeo = new THREE.SphereGeometry(volume.r, 32, 24);
    this.coronaGeo = new THREE.SphereGeometry(CORONA_RADIUS, 32, 24);
    this.disc = new THREE.MeshBasicMaterial({ color: palCss('sky.strata.corona'), fog: false });
    // additive: the corona is light added to the dusk, so it brightens the air instead of greying it
    this.corona = new THREE.MeshBasicMaterial({
      color: palCss('sky.strata.corona'), side: THREE.BackSide, transparent: true, opacity: 0.3, fog: false,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const disc = new THREE.Mesh(this.discGeo, this.disc);
    const halo = new THREE.Mesh(this.coronaGeo, this.corona);
    this.group.add(disc, halo);
    backdrop(this.group);
    root.add(this.group);
  }

  update(eye: Vec3, _dt: number) {
    this.group.visible = eye.y >= SUN_SHOWN_FROM;
    placeFar(this.group, eye, this.volume, CORONA_RADIUS);
  }

  dispose() {
    this.root.remove(this.group);
    this.discGeo.dispose();
    this.coronaGeo.dispose();
    this.disc.dispose();
    this.corona.dispose();
  }
}
