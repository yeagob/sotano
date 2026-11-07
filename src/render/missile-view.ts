// The missile of Dr. Launcher (docs/design/not-built/practices/ROCKET-LAUNCHER.md, art: DECISIONS
// §7.7). A missile is a bomb taken from the counter, so it is the same seed model as the pickup and
// the placed breakthrough (seed-model.ts), turned to fly tip first along the aim, with a plume of the
// player's light behind it (a comet tail of five fog-exempt puffs, longest once the run-up is done). Polarity is read from the light, never from a new shape:
//   positive: the body is the white seed (DECISIONS §7.8), its seams light.core, and the plume is
//   light.core in a light.gold halo (mending);
//   negative: the seams are banked to ember and the plume is light.ember fading to light.dusk at
//   0.75 of the positive strength (the breakthrough), as the negative intention (DECISIONS §14.1).
// A thin ring of the Miracles hue rides the plume's tail: the practice's path, as on an intention's
// trail (≤ 40 %, §7.1). Unlit and baked, palette tokens only, nothing alternates faster than 3 Hz.

import * as THREE from 'three';
import type { Polarity } from '../combat/polarity';
import { pal, type PalToken } from '../content/palette';
import { DEBRIS_SIZE } from '../physics/debris';
import { glowTexture } from './icons';
import { buildSeed, disposeSeed, SEED_H, SEED_VOXEL, type SeedModel } from './seed-model';

export interface MissileState { id: number; x: number; y: number; z: number; dx: number; dy: number; dz: number; age: number; polarity: Polarity }

/** Palette tokens for the trail particles the game emits behind each missile (a few per frame). */
export const MISSILE_TRAIL: Record<Polarity, PalToken[]> = {
  positive: ['light.gold', 'light.core', 'path.milagros.base'],
  negative: ['light.ember', 'light.dusk', 'ink.ash', 'path.milagros.base'],
};

/**
 * Palette tokens for the love explosion's particle bursts (the destructive one keeps the bomb's).
 * Biggest burst first: gold is repair, the core is the light's heart, the Miracles glow is the love.
 */
export const LOVE_BLAST: PalToken[] = ['light.gold', 'light.core', 'path.milagros.glow'];

/** The seed's height in world units: the same size as the placed breakthrough (DebrisView). */
const SCALE = DEBRIS_SIZE / (SEED_H * SEED_VOXEL);
const HALF = (SEED_H * SEED_VOXEL) / 2;
/** Seconds the plume takes to reach full length (the run-up of the flight). */
const RUN_UP = 0.35;
/** Slow roll around the flight axis, in turns per second: the seams pass at under 2 Hz. */
const ROLL = 0.4;

interface Look { seams: PalToken | null; halo: PalToken; haloOpacity: number; core: PalToken; flame: PalToken; strength: number }

const LOOK: Record<Polarity, Look> = {
  positive: { seams: null, halo: 'light.gold', haloOpacity: 0.45, core: 'light.core', flame: 'light.gold', strength: 1 },
  negative: { seams: 'light.ember', halo: 'light.ember', haloOpacity: 0.3, core: 'light.ember', flame: 'light.dusk', strength: 0.75 },
};

/** The plume, a comet tail behind the tail: offset along −Y (in half-seeds, before SCALE), size, opacity. */
const PLUME = [
  { at: 0.45, size: 0.26, alpha: 0.9, part: 'core' },
  { at: 0.95, size: 0.24, alpha: 0.6, part: 'flame' },
  { at: 1.5, size: 0.19, alpha: 0.45, part: 'flame' },
  { at: 2.1, size: 0.14, alpha: 0.35, part: 'flame' },
  { at: 2.7, size: 0.1, alpha: 0.4, part: 'path' },
] as const;

interface Missile { seed: SeedModel; polarity: Polarity; puffs: THREE.Sprite[] }

const UP = new THREE.Vector3(0, 1, 0);

export class MissileView {
  private list = new Map<number, Missile>();
  private live = new Set<number>();
  private dir = new THREE.Vector3();

  constructor(private scene: THREE.Scene) {}

  update(list: readonly MissileState[]): void {
    this.live.clear();
    for (const s of list) {
      let m = this.list.get(s.id);
      if (m && m.polarity !== s.polarity) { this.drop(s.id, m); m = undefined; }
      if (!m) { m = this.build(s.polarity); this.list.set(s.id, m); }
      this.live.add(s.id);
      this.place(m, s);
    }
    for (const [id, m] of this.list) if (!this.live.has(id)) this.drop(id, m);
  }

  dispose(): void {
    for (const [id, m] of this.list) this.drop(id, m);
  }

  private build(polarity: Polarity): Missile {
    const look = LOOK[polarity];
    // a positive missile is the white seed (§7.8), a negative one the black breakthrough
    const seed = buildSeed(polarity === 'positive' ? 'love' : 'breakthrough');
    // centre the seed on the root so it turns about its middle, tip leading
    seed.body.position.y = -HALF;
    if (look.seams) seed.cracks.color.setHex(pal(look.seams));
    seed.halo.material.color.setHex(pal(look.halo));
    seed.halo.position.set(0, HALF, 0);
    // the player's light reads through the fog (DECISIONS §12.4): halos are fog-exempt
    seed.halo.material.fog = false;
    seed.halo.material.needsUpdate = true;
    const puffs = PLUME.map(p => {
      const token: PalToken = p.part === 'core' ? look.core : p.part === 'flame' ? look.flame : 'path.milagros.base';
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color: pal(token), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      }));
      sprite.position.set(0, -HALF - p.at * HALF, 0);
      seed.root.add(sprite);
      return sprite;
    });
    seed.root.scale.setScalar(SCALE);
    this.scene.add(seed.root);
    return { seed, polarity, puffs };
  }

  private place(m: Missile, s: MissileState) {
    const look = LOOK[s.polarity];
    const { root, body, cracks, halo } = m.seed;
    root.position.set(s.x, s.y, s.z);
    this.dir.set(s.dx, s.dy, s.dz);
    if (this.dir.lengthSq() > 1e-9) root.quaternion.setFromUnitVectors(UP, this.dir.normalize());
    body.rotation.y = s.id * 1.3 + s.age * ROLL * Math.PI * 2;
    // a slow breath on two clocks (2 Hz and 1.3 Hz, ±10 %): alive, never a flash
    const b = 0.06 * Math.sin(s.age * Math.PI * 2 * 2) + 0.04 * Math.sin(s.age * Math.PI * 2 * 1.3 + s.id);
    if (!look.seams) cracks.color.setScalar(0.9 + b);
    halo.material.opacity = look.haloOpacity * (1 + b);
    const k = 0.4 + 0.6 * Math.min(1, s.age / RUN_UP);
    m.puffs.forEach((p, i) => {
      const d = PLUME[i];
      p.position.y = -HALF - d.at * HALF * k;
      const size = d.size * (0.7 + 0.3 * k) * (1 + b);
      p.scale.set(size, size, 1);
      p.material.opacity = d.alpha * look.strength * (1 + b);
    });
  }

  private drop(id: number, m: Missile) {
    for (const p of m.puffs) p.material.dispose();
    disposeSeed(m.seed);
    this.list.delete(id);
  }
}
