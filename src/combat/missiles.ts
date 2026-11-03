// Missiles of Dr. Launcher (docs/design/built/practices/milagros/DR-LAUNCHER.md): a carried bomb
// launched along the aim. It ignores gravity, speeds up for a few blocks, then holds a steady line
// and ends on the first thing it meets. Pure rules: the game says what is solid and what is met,
// and decides what the end does (a bomb blast or a love explosion).

import { raycastVoxels } from '../physics/raycast';
import type { Polarity } from './polarity';

/** Blocks per second at the muzzle. */
export const MISSILE_SPEED0 = 8;
/** Steady speed, in blocks per second, reached after about four blocks. */
export const MISSILE_SPEED = 24;
/** Blocks per second squared during the run-up. */
export const MISSILE_ACCEL = 64;
/** Blocks a missile flies before it explodes in the air. */
export const MISSILE_RANGE = 40;
/** Blocks a missile flies before it can explode; a launch with a block closer than this is refused. */
export const MISSILE_ARM = 2;
/** Longest move between two contact checks, so a missile never tunnels through a block or a body. */
const STEP = 0.25;

export interface Missile {
  id: number;
  x: number; y: number; z: number;
  /** Unit direction of flight. */
  dx: number; dy: number; dz: number;
  speed: number;
  /** Steady speed and range: the launch event may change them. */
  top: number;
  range: number;
  travelled: number;
  age: number;
  polarity: Polarity;
}

export interface MissileWorld {
  solid(x: number, y: number, z: number): boolean;
  /** Whether something other than a block (an actor, a loose bomb) stands at this point. */
  meets(x: number, y: number, z: number): boolean;
}

/** Where and why a missile ended: on a block (placed just in front of it), on an actor or a bomb, or at its range. */
export interface MissileEnd { missile: Missile; x: number; y: number; z: number; why: 'block' | 'meet' | 'range' }

/** True when a block stands within the arming distance along the aim: the launch is refused. */
export function muzzleBlocked(solid: MissileWorld['solid'], x: number, y: number, z: number, dx: number, dy: number, dz: number) {
  return raycastVoxels(solid, x, y, z, dx, dy, dz, MISSILE_ARM) !== null;
}

export class Missiles {
  readonly list: Missile[] = [];
  private seq = 0;

  launch(x: number, y: number, z: number, dx: number, dy: number, dz: number, polarity: Polarity, top = MISSILE_SPEED, range = MISSILE_RANGE): Missile {
    const l = Math.hypot(dx, dy, dz) || 1;
    // an event may have changed them: never a missile that cannot move or never ends
    top = Number.isFinite(top) ? Math.min(80, Math.max(1, top)) : MISSILE_SPEED;
    range = Number.isFinite(range) ? Math.min(200, Math.max(MISSILE_ARM, range)) : MISSILE_RANGE;
    const m: Missile = {
      id: ++this.seq, x, y, z, dx: dx / l, dy: dy / l, dz: dz / l,
      speed: Math.min(MISSILE_SPEED0, top), top, range, travelled: 0, age: 0, polarity,
    };
    this.list.push(m);
    return m;
  }

  /** Moves every missile; returns the ones that ended this frame (already removed). */
  update(dt: number, w: MissileWorld): MissileEnd[] {
    const ends: MissileEnd[] = [];
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i];
      m.age += dt;
      m.speed = Math.min(m.top, m.speed + MISSILE_ACCEL * dt);
      const end = this.fly(m, m.speed * dt, w);
      if (end) { ends.push(end); this.list.splice(i, 1); }
    }
    return ends;
  }

  private fly(m: Missile, dist: number, w: MissileWorld): MissileEnd | null {
    while (dist > 0) {
      const s = Math.min(STEP, dist, m.range - m.travelled);
      const nx = m.x + m.dx * s, ny = m.y + m.dy * s, nz = m.z + m.dz * s;
      if (w.solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) {
        // the blast sits where the missile still was, against the block's face, like a bomb resting on it
        return { missile: m, x: m.x, y: m.y, z: m.z, why: 'block' };
      }
      m.x = nx; m.y = ny; m.z = nz;
      m.travelled += s;
      dist -= s;
      if (m.travelled >= MISSILE_ARM && w.meets(m.x, m.y, m.z)) return { missile: m, x: m.x, y: m.y, z: m.z, why: 'meet' };
      if (m.travelled >= m.range - 1e-9) return { missile: m, x: m.x, y: m.y, z: m.z, why: 'range' };
    }
    return null;
  }

  clear() { this.list.length = 0; }
}
