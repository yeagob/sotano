// The wind's motes (issue #373, DECISIONS §14.11): thin white streaks that drift with the wind above the crown,
// near the player. A fixed pool in one InstancedMesh, its own (the shared particle pool is never filled by them).
// `WindMotes` is the simulation, with no three.js, so a test can read every mote; `WindView` draws it.

import * as THREE from 'three';
import { fx } from '../core/fx';
import { pal } from '../content/palette';
import type { AirVec } from '../physics/air-forces';

/** The most motes alive at once (one draw call). */
export const MOTE_MAX = 48;
/** The most motes born in one frame. */
export const MOTE_SPAWN = 3;
/** How far round the eye motes are born: across (x and z), and up or down. */
export const MOTE_REACH = 9, MOTE_RISE = 5;
/** No mote is drawn closer to the eye than `MOTE_CLEAR`; between it and `MOTE_NEAR` it shrinks away, so nothing white
 *  ever covers the view. Motes are born no closer than `MOTE_NEAR`. */
export const MOTE_CLEAR = 1, MOTE_NEAR = 2;
/** A mote shrinks to nothing over its last half block above the wind's floor. */
export const MOTE_EDGE = 0.5;
/** The streak's speed along the wind, blocks/s, its length and its thickness, blocks. */
export const MOTE_SPEED = 8, MOTE_LENGTH = 0.55, MOTE_THICK = 0.035;
/** A mote lives this long, seconds (a light mote lives at least 0.3 s, DECISIONS §7.3). */
export const MOTE_LIFE: readonly [number, number] = [0.8, 1.6];
/** The ledger's white for particles and decoration (DECISIONS §7.6, §14.11). */
export const MOTE_TOKEN = 'cold.white';
/** How fast the drawn direction follows a turn of the wind, per second: the streaks swing round in about 0.3 s. */
const SWING = 8;

export interface Mote { x: number; y: number; z: number; life: number; max: number }

export interface Eye { x: number; y: number; z: number }

/** The motes' simulation: born round the eye above `from`, carried along the wind's drawn direction. */
export class WindMotes {
  readonly list: Mote[] = [];
  /** The direction the streaks are drawn along: it eases toward the wind's. */
  readonly look: AirVec = { x: 1, z: 0 };
  private started = false;

  constructor(readonly from: number) {}

  update(dt: number, eye: Eye, wind: AirVec) {
    if (!this.started) { this.look.x = wind.x; this.look.z = wind.z; this.started = true; }
    const e = 1 - Math.exp(-SWING * dt);
    let lx = this.look.x + (wind.x - this.look.x) * e, lz = this.look.z + (wind.z - this.look.z) * e;
    const l = Math.hypot(lx, lz) || 1;
    lx /= l; lz /= l;
    this.look.x = lx; this.look.z = lz;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i];
      m.life -= dt;
      m.x += lx * MOTE_SPEED * dt; m.z += lz * MOTE_SPEED * dt;
      if (m.life <= 0 || m.y < this.from) this.list.splice(i, 1);
    }
    // born only where the wind blows: the box round the eye must reach above the wind's floor
    if (eye.y + MOTE_RISE < this.from) return;
    for (let k = 0; k < MOTE_SPAWN && this.list.length < MOTE_MAX; k++) {
      const x = eye.x + fx.spread(MOTE_REACH), y = eye.y + fx.spread(MOTE_RISE), z = eye.z + fx.spread(MOTE_REACH);
      if (y < this.from + MOTE_EDGE || Math.hypot(x - eye.x, y - eye.y, z - eye.z) < MOTE_NEAR) continue;
      const life = fx.range(MOTE_LIFE[0], MOTE_LIFE[1]);
      this.list.push({ x, y, z, life, max: life });
    }
  }

  /** The drawn size of a mote, 0 to 1: it grows in and shrinks out over its life, shrinks away near the eye, and
   *  is gone at the wind's floor. Never a blink: every factor is smooth. */
  scale(m: Mote, eye: Eye): number {
    const age = m.max - m.life;
    const life = Math.min(1, age / 0.2, m.life / 0.3);
    const d = Math.hypot(m.x - eye.x, m.y - eye.y, m.z - eye.z);
    const near = Math.min(1, Math.max(0, (d - MOTE_CLEAR) / (MOTE_NEAR - MOTE_CLEAR)));
    const edge = Math.min(1, Math.max(0, (m.y - this.from) / MOTE_EDGE));
    return Math.max(0, life) * near * edge;
  }

  clear() { this.list.length = 0; this.started = false; }
}

/** Draws the motes: one InstancedMesh of thin boxes, unlit, `cold.white`, a little translucent, no depth write. */
export class WindView {
  readonly motes: WindMotes;
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private x = new THREE.Vector3(1, 0, 0);
  private d = new THREE.Vector3();

  constructor(scene: THREE.Scene, from: number) {
    this.motes = new WindMotes(from);
    const mat = new THREE.MeshBasicMaterial({ color: pal(MOTE_TOKEN), transparent: true, opacity: 0.7, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, MOTE_MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  update(dt: number, eye: Eye, wind: AirVec) {
    const w = this.motes;
    w.update(dt, eye, wind);
    this.q.setFromUnitVectors(this.x, this.d.set(w.look.x, 0, w.look.z));
    let n = 0;
    for (const mote of w.list) {
      const k = w.scale(mote, eye);
      if (k <= 0) continue;
      this.m.compose(this.p.set(mote.x, mote.y, mote.z), this.q, this.s.set(MOTE_LENGTH * k, MOTE_THICK, MOTE_THICK));
      this.mesh.setMatrixAt(n++, this.m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() { this.motes.clear(); this.mesh.count = 0; }
}
