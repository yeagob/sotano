// First-person hands, in their own scene and camera drawn on top of the world
// (clearing only depth), so they never clip through walls.

import * as THREE from 'three';
import { pal, palCss } from '../content/palette';
import type { ItemDef } from '../items/types';
import type { PartDef } from '../content/parts';
import type { Carried } from '../entities/player';
import { materialTexture } from './atlas';
import { glowTexture, iconTexture } from './icons';

// The hands (docs/art/DECISIONS.md §9): skin (a player setting later; t3 today), the knitted
// jumper from the house above with a cuff band, a thumb so it reads as a hand. Whole texels.
const TX = 1 / 16;
let knit: THREE.CanvasTexture | null = null;
/** Rib-knit: alternating 1-texel columns of the jumper's base and hi, and one loose-thread pixel. */
function knitTexture() {
  if (knit) return knit;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 7;
  const g = c.getContext('2d')!;
  for (let x = 0; x < 4; x++) { g.fillStyle = palCss(x % 2 ? 'cloth.hi' : 'cloth.base'); g.fillRect(x, 0, 1, 7); }
  g.fillStyle = palCss('cloth.cuff'); g.fillRect(2, 5, 1, 1);
  knit = new THREE.CanvasTexture(c);
  knit.magFilter = knit.minFilter = THREE.NearestFilter;
  knit.colorSpace = THREE.SRGBColorSpace;
  return knit;
}

function arm(side: 1 | -1): THREE.Group {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(4 * TX, 4 * TX, 7 * TX), new THREE.MeshLambertMaterial({ map: knitTexture() }));
  sleeve.position.z = 0.16;
  const cuff = new THREE.Mesh(new THREE.BoxGeometry(4.2 * TX, 4.2 * TX, 3 * TX), new THREE.MeshLambertMaterial({ color: pal('cloth.cuff') }));
  cuff.position.z = 0.16 - 5 * TX;
  const skin = new THREE.MeshLambertMaterial({ color: pal('skin.t3') });
  const hand = new THREE.Mesh(new THREE.BoxGeometry(3 * TX, 3 * TX, 5 * TX), skin);
  hand.position.z = -0.16;
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(TX, TX, 2 * TX), skin);
  thumb.position.set(-side * 2 * TX, TX, -0.16 - TX);
  g.add(sleeve, cuff, hand, thumb);
  return g;
}

export class Hands {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private right = arm(1);
  private left = arm(-1);
  /** The top block (or part) of your hand rides in the left hand; the next one (if you carry 2+) in the right. */
  private block: THREE.Mesh;
  private second: THREE.Mesh;
  private card: THREE.Mesh;
  private cardSecond: THREE.Mesh;
  private blockMats = new Map<number, THREE.Material>();
  private cardMats = new Map<string, THREE.Material>();
  private swing = 0;
  private place = 0;
  private heldNow: Carried | 0 = 0;
  private secondNow: Carried | 0 = 0;
  /** Isaac-style "hold up": both hands raise a new item for a moment after picking it up. */
  private holdT = 0;
  private holdItem: THREE.Sprite;
  private holdGlow: THREE.Sprite;
  /** Light gathering in the right palm while a weapon charges (Remember Breathing, One Clear Cut). */
  private chargeGlow: THREE.Sprite;
  private chargeK = 0;
  static readonly HOLD_TIME = 1.6;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 10);
    this.scene.add(new THREE.HemisphereLight(pal('light.core'), pal('ink.ash'), 2.2));
    const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.2);
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
    this.second = new THREE.Mesh(this.block.geometry);
    this.second.position.set(-0.02, 0.2, -0.36);
    this.second.rotation.set(0.3, -0.6, -0.1);
    this.second.visible = false;
    this.right.add(this.second);
    this.card = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28));
    this.card.position.copy(this.block.position);
    this.card.visible = false;
    this.left.add(this.card);
    this.cardSecond = new THREE.Mesh(this.card.geometry);
    this.cardSecond.position.copy(this.second.position);
    this.cardSecond.visible = false;
    this.right.add(this.cardSecond);
    this.scene.add(this.right, this.left);
    this.holdGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.holdItem = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    this.holdGlow.visible = this.holdItem.visible = false;
    this.scene.add(this.holdGlow, this.holdItem);
    this.chargeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: pal('light.hot'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.chargeGlow.visible = false;
    this.scene.add(this.chargeGlow);
  }

  /** 0 → 1 while charging; 0 hides it. Grows steadily (never flickers); full charge glows white-gold. */
  charge(k: number) { this.chargeK = k; }

  /** Raise `def` above both hands for HOLD_TIME seconds. */
  holdUp(def: ItemDef | PartDef) {
    this.holdT = Hands.HOLD_TIME;
    (this.holdItem.material as THREE.SpriteMaterial).map = iconTexture(def);
    (this.holdItem.material as THREE.SpriteMaterial).needsUpdate = true;
    (this.holdGlow.material as THREE.SpriteMaterial).color.setHex(def.color);
  }

  get holding() { return this.holdT > 0; }

  fire() { this.swing = 1; }
  placed() { this.place = 1; }

  /** `held` = top of the hand (left), `second` = the one below it (right), 0 = none. */
  update(dt: number, walkPhase: number, held: Carried | 0, second: Carried | 0 = 0) {
    this.chargeGlow.visible = this.chargeK > 0;
    if (this.chargeK > 0) {
      const k = 0.08 + this.chargeK * 0.22;
      this.chargeGlow.scale.set(k, k, 1);
      this.chargeGlow.position.set(0.3, -0.24, -0.7);
      (this.chargeGlow.material as THREE.SpriteMaterial).color.setHex(pal(this.chargeK >= 1 ? 'light.core' : 'light.hot'));
      (this.chargeGlow.material as THREE.SpriteMaterial).opacity = 0.5 + 0.5 * this.chargeK;
    }
    this.swing = Math.max(0, this.swing - dt * 7);
    this.holdT = Math.max(0, this.holdT - dt);
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
    // hold-up: both arms swing up to hold the item over your head, then settle back
    const h = this.holdT > 0 ? Math.min(1, (Hands.HOLD_TIME - this.holdT) * 6, this.holdT * 4) : 0;
    if (h > 0) {
      // forearms come up from the bottom corners, hands meeting under the item
      this.right.position.set(0.3 - h * 0.06, -0.5 + h * 0.12, -0.78);
      this.right.rotation.set(0.12 + h * 0.55, -0.18 - h * 0.35, 0.05);
      this.left.position.set(-0.3 + h * 0.06, -0.5 + h * 0.12, -0.78);
      this.left.rotation.set(0.15 + h * 0.55, 0.2 + h * 0.35, -0.05);
    } else {
      this.right.rotation.y = -0.18;
      this.left.rotation.set(0.15, 0.2, -0.05);
    }
    this.holdItem.visible = this.holdGlow.visible = h > 0;
    if (h > 0) {
      const bob = Math.sin(this.holdT * 6) * 0.01;
      const k = 0.2 + 0.1 * h;
      this.holdItem.position.set(0, -0.28 + h * 0.36 + bob, -0.95);
      this.holdItem.scale.set(k, k, 1);
      this.holdGlow.position.copy(this.holdItem.position).z -= 0.02;
      const gk = k * (1.7 + Math.sin(this.holdT * 10) * 0.12);
      this.holdGlow.scale.set(gk, gk, 1);
      (this.holdGlow.material as THREE.SpriteMaterial).opacity = 0.4 * h;
    }
    if (held !== this.heldNow) {
      this.heldNow = held;
      this.setCarried(this.block, this.card, held);
    }
    if (second !== this.secondNow) {
      this.secondNow = second;
      this.setCarried(this.second, this.cardSecond, second);
    }
    const raising = this.holdT > 0;
    this.showCarried(this.block, this.card, held, !raising);
    this.showCarried(this.second, this.cardSecond, second, !raising);
  }

  private setCarried(cube: THREE.Mesh, card: THREE.Mesh, c: Carried | 0) {
    if (typeof c === 'number' && c) cube.material = this.blockMaterial(c);
    if (typeof c === 'object') card.material = this.cardMaterial(c);
  }

  private showCarried(cube: THREE.Mesh, card: THREE.Mesh, c: Carried | 0, shown: boolean) {
    cube.visible = shown && typeof c === 'number' && c !== 0;
    card.visible = shown && typeof c === 'object';
  }

  private blockMaterial(m: number) {
    let mat = this.blockMats.get(m);
    if (!mat) { mat = new THREE.MeshLambertMaterial({ map: materialTexture(m) }); this.blockMats.set(m, mat); }
    return mat;
  }

  private cardMaterial(def: PartDef) {
    let mat = this.cardMats.get(def.id);
    if (!mat) { mat = new THREE.MeshBasicMaterial({ map: iconTexture(def), transparent: true, depthWrite: false }); this.cardMats.set(def.id, mat); }
    return mat;
  }
}
