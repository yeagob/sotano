// First-person hands, in their own scene and camera drawn on top of the world
// (clearing only depth), so they never clip through walls.

import * as THREE from 'three';
import { materialTexture } from './atlas';

const SKIN = 0xd9a07a, SLEEVE = 0x3d5a80;

function arm(): THREE.Group {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.42), new THREE.MeshLambertMaterial({ color: SLEEVE }));
  sleeve.position.z = 0.16;
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.19, 0.3), new THREE.MeshLambertMaterial({ color: SKIN }));
  hand.position.z = -0.18;
  g.add(sleeve, hand);
  return g;
}

export class Hands {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private right = arm();
  private left = arm();
  private block: THREE.Mesh;
  private blockMats = new Map<number, THREE.Material>();
  private swing = 0;
  private place = 0;
  private heldNow = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 10);
    this.scene.add(new THREE.HemisphereLight(0xfff2e0, 0x404050, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(0.5, 1, 0.6);
    this.scene.add(sun);
    this.right.position.set(0.42, -0.42, -0.62);
    this.right.rotation.set(0.12, -0.18, 0.05);
    this.left.position.set(-0.42, -0.46, -0.6);
    this.left.rotation.set(0.15, 0.2, -0.05);
    this.block = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28));
    this.block.position.set(0.02, 0.2, -0.36);
    this.block.rotation.set(0.3, 0.6, 0.1);
    this.block.visible = false;
    this.left.add(this.block);
    this.scene.add(this.right, this.left);
  }

  fire() { this.swing = 1; }
  placed() { this.place = 1; }

  update(dt: number, walkPhase: number, held: number) {
    this.swing = Math.max(0, this.swing - dt * 7);
    this.place = Math.max(0, this.place - dt * 5);
    const bobX = Math.sin(walkPhase * 1.6) * 0.02, bobY = Math.abs(Math.cos(walkPhase * 1.6)) * 0.025;
    const s = Math.sin(this.swing * Math.PI);
    this.right.position.set(0.42 + bobX, -0.42 - bobY + s * 0.06, -0.62 - s * 0.14);
    this.right.rotation.x = 0.12 + s * 0.5;
    // the left hand drops out of view when it holds nothing
    const showLeft = held !== 0;
    const targetY = showLeft ? -0.46 : -1.3;
    this.left.position.y += (targetY - this.place * 0.08 - bobY - this.left.position.y) * Math.min(1, dt * 12);
    this.left.position.x = -0.42 - bobX;
    this.left.position.z = -0.6 - this.place * 0.2;
    if (held !== this.heldNow) {
      this.heldNow = held;
      this.block.visible = held !== 0;
      if (held) {
        let m = this.blockMats.get(held);
        if (!m) { m = new THREE.MeshLambertMaterial({ map: materialTexture(held) }); this.blockMats.set(held, m); }
        this.block.material = m;
      }
    }
  }
}
