// The Sun over the threshold, the one warmth that is not a threat (provisional, docs/art/sky/totality.md):
// a pale disc and its corona, unfogged, seen from the solar approach. It stands above the eye, so it is in
// the sky wherever the player stands in the upper stratum.

import * as THREE from 'three';
import { palCss } from '../../content/palette';
import type { SkyViewApi, Vec3 } from '../types';

/** The disc's and the corona's radius in blocks, and how far above the eye the Sun stands. */
export const SUN_RADIUS = 30;
export const CORONA_RADIUS = 90;
export const SUN_HEIGHT = 260;
/** Shown from this height up (the solar approach). */
export const SUN_SHOWN_FROM = 640;

export class SunView implements SkyViewApi {
  private readonly group = new THREE.Group();
  private readonly discGeo: THREE.SphereGeometry;
  private readonly coronaGeo: THREE.SphereGeometry;
  private readonly disc: THREE.MeshBasicMaterial;
  private readonly corona: THREE.MeshBasicMaterial;

  constructor(private readonly root: THREE.Object3D) {
    this.discGeo = new THREE.SphereGeometry(SUN_RADIUS, 32, 24);
    this.coronaGeo = new THREE.SphereGeometry(CORONA_RADIUS, 32, 24);
    this.disc = new THREE.MeshBasicMaterial({ color: palCss('sky.strata.corona'), fog: false });
    // additive: the corona is light added to the dusk, so it brightens the air instead of greying it
    this.corona = new THREE.MeshBasicMaterial({
      color: palCss('sky.strata.corona'), side: THREE.BackSide, transparent: true, opacity: 0.3, fog: false,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const disc = new THREE.Mesh(this.discGeo, this.disc);
    const halo = new THREE.Mesh(this.coronaGeo, this.corona);
    halo.renderOrder = 1;
    this.group.add(disc, halo);
    root.add(this.group);
  }

  update(eye: Vec3, _dt: number) {
    this.group.visible = eye.y >= SUN_SHOWN_FROM;
    this.group.position.set(eye.x, eye.y + SUN_HEIGHT, eye.z);
  }

  dispose() {
    this.root.remove(this.group);
    this.discGeo.dispose();
    this.coronaGeo.dispose();
    this.disc.dispose();
    this.corona.dispose();
  }
}
