// The ascent's sky (issue #380; ILLUMINATION.md §3a, docs/art/DECISIONS.md §14.11): while the blocks of the ascent run,
// the sky shows each meditation's background in turn, between the starry sky. A background is the Sanctuary's own: its
// three stops, `med.<id>.high` at the top, `mid`, `deep` at the bottom (the vertical gradient its 2D scenes paint,
// src/render/meditation-scenes.ts), laid on a dome round the eye: high at the zenith, mid at the horizon, deep below.
//
// Cheap on a phone: one low sphere (16 × 12 segments, 221 vertices) with vertex colours and the unlit basic material,
// no texture, no canvas, no new shader. It is drawn first, behind everything (opaque list, renderOrder -10, no depth
// test or write), so the blocks, the stars, the Earth and the Sun draw over it as they did over the clear colour. Its
// colours are written only when the blend changes; while it would show nothing it is hidden and costs nothing.

import * as THREE from 'three';
import { pal } from '../../content/palette';
import { palOf } from '../../content/presences/meditations';
import { mixColour } from '../atmosphere';
import type { SkySlot } from '../../game/ascent-blocks';
import type { Vec3 } from '../types';

/** The dome's radius (blocks): inside the camera's 200-block far plane, and drawn behind everything whatever it is. */
export const DOME_RADIUS = 120;
/** How far the stars dim under a meditation's background, so the background reads (the night's own stars stay in it). */
export const STAR_DIM = 0.6;

export interface Stops { high: number; mid: number; deep: number }

/** A meditation's background stops (0xRRGGBB), from its `med.*` tokens. */
export function stopsOf(slot: Exclude<SkySlot, 'stars'>): Stops {
  return { high: pal(palOf(slot, 'high')), mid: pal(palOf(slot, 'mid')), deep: pal(palOf(slot, 'deep')) };
}

/**
 * The stops of the sky's backgrounds at a blend: two backgrounds mix stop by stop; beside the starry sky, the one
 * background is kept whole (how much of it shows is the share, not the stops). Null while both sides are the stars.
 */
export function blendStops(from: SkySlot, to: SkySlot, k: number): Stops | null {
  if (from === 'stars' && to === 'stars') return null;
  if (from === 'stars') return stopsOf(to as Exclude<SkySlot, 'stars'>);
  if (to === 'stars') return stopsOf(from);
  const a = stopsOf(from), b = stopsOf(to);
  return { high: mixColour(a.high, b.high, k), mid: mixColour(a.mid, b.mid, k), deep: mixColour(a.deep, b.deep, k) };
}

/** The background's colour at elevation `e` (-1 straight down, 0 the horizon, 1 straight up), eased between the stops. */
export function gradientAt(s: Stops, e: number): number {
  const ease = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
  return e >= 0 ? mixColour(s.mid, s.high, ease(e / 0.9)) : mixColour(s.mid, s.deep, ease(-e / 0.6));
}

export class MeditationSky {
  private readonly mesh: THREE.Mesh;
  private readonly colours: THREE.BufferAttribute;
  private readonly elevation: Float32Array;
  private key = '';
  private readonly c = new THREE.Color();

  constructor(private readonly root: THREE.Object3D) {
    const geo = new THREE.SphereGeometry(DOME_RADIUS, 16, 12);
    const pos = geo.getAttribute('position');
    this.elevation = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) this.elevation[i] = pos.getY(i) / DOME_RADIUS;
    this.colours = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    geo.setAttribute('color', this.colours);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthTest: false, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    root.add(this.mesh);
  }

  /**
   * Places the dome on the eye and colours it: the backgrounds at the blend, laid over the starry sky's colour (`base`,
   * the clear colour of the height) by `share`. Returns the background's horizon colour (its `mid`), for the fog to
   * melt into, or null while the sky is only the stars.
   */
  update(eye: Vec3, base: number, from: SkySlot, to: SkySlot, k: number, share: number): number | null {
    const stops = blendStops(from, to, k);
    this.mesh.visible = stops !== null && share > 0.001;
    this.mesh.position.set(eye.x, eye.y, eye.z);
    if (!stops) return null;
    const s = Math.min(1, Math.max(0, share));
    const key = `${stops.high}|${stops.mid}|${stops.deep}|${s.toFixed(3)}|${s < 1 ? base : 0}`;
    if (key !== this.key) {
      this.key = key;
      const arr = this.colours.array as Float32Array;
      for (let i = 0; i < this.elevation.length; i++) {
        this.c.setHex(mixColour(base, gradientAt(stops, this.elevation[i]), s));
        arr[i * 3] = this.c.r; arr[i * 3 + 1] = this.c.g; arr[i * 3 + 2] = this.c.b;
      }
      this.colours.needsUpdate = true;
    }
    return stops.mid;
  }

  hide() { this.mesh.visible = false; }

  /** Compiles the dome's material now, while the starry sky shows, so its first background never stalls a frame. */
  warm(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    this.mesh.visible = true;
    renderer.compile(this.mesh, camera);
    this.mesh.visible = false;
  }

  dispose() {
    this.root.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
