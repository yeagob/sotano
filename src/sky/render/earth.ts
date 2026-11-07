// The Earth below, a sphere seen from Totality's void (docs/architecture/SKY.md §11, docs/art/sky/totality.md).
// A backdrop: it hangs a fixed distance under the eye, is never fogged, and shows only from the middle of
// the mid stratum up to the foot of the solar approach. The limb is a faint rim of air round it.

import * as THREE from 'three';
import { palCss } from '../../content/palette';
import type { SkyViewApi, Vec3 } from '../types';
import { backdrop, placeFar } from './far';

/** The Earth's radius in blocks, and how far under the eye its centre hangs. */
export const EARTH_RADIUS = 140;
export const EARTH_DROP = 300;
/** Shown from this height to that one (the mid void and its edges). */
export const EARTH_SHOWN: readonly [number, number] = [380, 720];

export class EarthView implements SkyViewApi {
  private readonly group = new THREE.Group();
  private readonly sphere: THREE.SphereGeometry;
  private readonly rimGeo: THREE.SphereGeometry;
  private readonly sea: THREE.MeshBasicMaterial;
  private readonly rim: THREE.MeshBasicMaterial;

  constructor(private readonly root: THREE.Object3D) {
    this.sphere = new THREE.SphereGeometry(EARTH_RADIUS, 48, 32);
    this.rimGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.04, 48, 32);
    this.sea = new THREE.MeshBasicMaterial({ color: palCss('sky.earth.sea'), fog: false, opacity: 1 });
    this.rim = new THREE.MeshBasicMaterial({
      color: palCss('sky.earth.rim'), side: THREE.BackSide, transparent: true, opacity: 0.35, fog: false, depthWrite: false,
    });
    const body = new THREE.Mesh(this.sphere, this.sea);
    const limb = new THREE.Mesh(this.rimGeo, this.rim);
    this.group.add(body, limb);
    backdrop(this.group);
    // the rim's far side is drawn first, so the body (opaque sea, drawn after it) covers the rim's centre: only the limb shows
    limb.renderOrder = -2;
    root.add(this.group);
  }

  update(eye: Vec3, _dt: number) {
    this.group.visible = eye.y >= EARTH_SHOWN[0] && eye.y <= EARTH_SHOWN[1];
    placeFar(this.group, eye, { x: eye.x, y: eye.y - EARTH_DROP, z: eye.z }, EARTH_RADIUS * 1.04);
  }

  dispose() {
    this.root.remove(this.group);
    this.sphere.dispose();
    this.rimGeo.dispose();
    this.sea.dispose();
    this.rim.dispose();
  }
}
