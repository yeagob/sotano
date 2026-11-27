import { AIR, MAT } from '../content/materials';
import { hash3 } from '../core/rng';
import { RELIEF_LOW, SEA, topMaterial, vnoise } from './void';

export const BIOME_R = 1150;
export const BIOME_BLEND = 100;
export const BIOME_WARP = 0.35;
const WARP_SCALE = 0.0022;
const SECTOR_EDGE = 0.16;

export const BIOME = { void: 0, sea: 1, desert: 2, mountains: 3, ice: 4 } as const;
export type BiomeKind = typeof BIOME[keyof typeof BIOME];
const SECTOR_KIND: readonly BiomeKind[] = [BIOME.sea, BIOME.desert, BIOME.mountains, BIOME.ice];
const SECTOR_CENTRE = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

export const PEAK_HIGH = 100;
export const MOUNTAIN_SLOPE = 0.6;
const ROUGH_RAMP = 40;
export const PLATEAU = 14;
const MASSIF = 7;
export const DUNE_HIGH = 12;
export const SAND_DEPTH = 3;
export const ICE_CRUST = 2;

export const DECK = SEA + 2;
export const DOCK = SEA + 1;
export const VILLAGE_DEPTH = -8;
export const TEMPLE_HALF = 9;

export interface Peak { x: number; z: number; h: number; plateau: number; rough: boolean }

export interface Structure {
  key: 'village' | 'temple';
  x0: number; x1: number; z0: number; z1: number; d0: number; d1: number;
  at(x: number, d: number, z: number, ground: number): number;
}

interface Rect { u0: number; u1: number; w0: number; w1: number; level: number }
interface House { u: number; w: number; roof: number }

const HOUSES: readonly [number, number, string][] = [[-14, -8, 'flagstone'], [-2, -9, 'stone'], [10, -8, 'flagstone'], [-8, 8, 'stone'], [5, 8, 'flagstone']];
const STAIR: Record<number, number> = { 9: 0, 8: 1, 7: 2, 6: 3, 5: 4, 4: 5 };
export const SPIRE_CHANCE = 0.004;

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export class Biomes {
  readonly peaks: Peak[] = [];
  readonly temple: { x: number; z: number; floor: number };
  readonly village: { x: number; z: number };
  readonly structures: Structure[];
  private readonly phase: number[];
  private readonly houses: House[];
  private readonly decks: Rect[];

  constructor(private readonly seed: number, readonly cx: number, readonly cz: number) {
    const r = (k: number) => hash3(seed ^ 0xb10e5, k, 11, 7);
    this.phase = [0, 1, 2, 3, 4].map(k => r(40 + k) * Math.PI * 2);
    const ta = Math.PI + (r(0) * 2 - 1) * 0.25, tr = 1430 + r(1) * 80;
    const tx = Math.round(cx + Math.cos(ta) * tr), tz = Math.round(cz + Math.sin(ta) * tr);
    this.peaks.push({ x: tx, z: tz, h: PEAK_HIGH, plateau: PLATEAU, rough: false });
    for (let k = 0; k < MASSIF; k++) {
      const a = r(10 + k) * Math.PI * 2, d = 60 + r(20 + k) * 120;
      this.peaks.push({ x: Math.round(tx + Math.cos(a) * d), z: Math.round(tz + Math.sin(a) * d), h: Math.round(46 + r(30 + k) * 38), plateau: 0, rough: true });
    }
    this.temple = { x: tx, z: tz, floor: PEAK_HIGH + 1 };
    const va = (r(2) * 2 - 1) * 0.25, vr = 1290 + r(3) * 40;
    this.village = { x: Math.round(cx + Math.cos(va) * vr), z: Math.round(cz + Math.sin(va) * vr) };
    this.houses = HOUSES.map(([u, w, roof]) => ({ u, w, roof: MAT[roof] }));
    this.decks = [{ u0: -20, u1: 14, w0: -1, w1: 1, level: DECK }];
    for (const h of this.houses) {
      this.decks.push({ u0: h.u - 4, u1: h.u + 4, w0: h.w - 4, w1: h.w + 4, level: DECK });
      this.decks.push(h.w < 0 ? { u0: h.u - 1, u1: h.u + 1, w0: h.w + 5, w1: -2, level: DECK } : { u0: h.u - 1, u1: h.u + 1, w0: 2, w1: h.w - 5, level: DECK });
    }
    this.decks.push({ u0: 15, u1: 31, w0: -1, w1: 1, level: DOCK }, { u0: 29, u1: 31, w0: -4, w1: 4, level: DOCK });
    const { x: vx, z: vz } = this.village;
    this.structures = [
      { key: 'village', x0: vx - 21, x1: vx + 33, z0: vz - 13, z1: vz + 13, d0: RELIEF_LOW, d1: DECK + 8, at: (x, d, z, g) => this.villageAt(x - vx, d, z - vz, g) },
      { key: 'temple', x0: tx - TEMPLE_HALF, x1: tx + TEMPLE_HALF, z0: tz - TEMPLE_HALF, z1: tz + TEMPLE_HALF, d0: PEAK_HIGH - 20, d1: PEAK_HIGH + 16, at: (x, d, z, g) => this.templeAt(x - tx, d - this.temple.floor, z - tz, d, g) },
    ];
  }

  radial(x: number, z: number): number {
    return smooth(BIOME_R, BIOME_R + BIOME_BLEND, Math.hypot(x - this.cx, z - this.cz));
  }

  private angle(x: number, z: number): number {
    return Math.atan2(z - this.cz, x - this.cx) + BIOME_WARP * (2 * vnoise(this.seed ^ 0x3a7, x * WARP_SCALE, z * WARP_SCALE) - 1);
  }

  weights(x: number, z: number): number[] {
    const a = this.angle(x, z);
    return SECTOR_CENTRE.map(c => smooth(Math.PI / 4 + SECTOR_EDGE, Math.PI / 4 - SECTOR_EDGE, Math.abs(angleDiff(a, c))));
  }

  sector(x: number, z: number): BiomeKind {
    const a = this.angle(x, z);
    let best = 0, bd = Infinity;
    SECTOR_CENTRE.forEach((c, i) => { const d = Math.abs(angleDiff(a, c)); if (d < bd) { bd = d; best = i; } });
    return SECTOR_KIND[best];
  }

  kind(x: number, z: number): BiomeKind {
    return this.radial(x, z) < 0.5 ? BIOME.void : this.sector(x, z);
  }

  height(x: number, z: number, raw: number): number {
    const wr = this.radial(x, z);
    if (wr <= 0) return raw;
    const w = this.weights(x, z);
    let b = 0;
    for (let s = 0; s < 4; s++) if (w[s] > 0) b += w[s] * this.sectorHeight(SECTOR_KIND[s], x, z, raw);
    const h = Math.max(raw + wr * (b - raw), this.massif(x, z));
    return Math.min(h, this.carve(x, z));
  }

  private sectorHeight(k: BiomeKind, x: number, z: number, raw: number): number {
    const p = this.phase;
    if (k === BIOME.sea) return raw * 0.4 - 6;
    if (k === BIOME.ice) return raw * 0.45 + 0.5;
    if (k === BIOME.mountains) return raw * 0.6 + 4;
    const dune = 5.5 + 3.2 * Math.sin(0.055 * x + 0.021 * z + p[0]) + 2.2 * Math.sin(0.043 * z - 0.037 * x + p[1]) + 0.3 * raw;
    return Math.max(1, Math.min(DUNE_HIGH, dune));
  }

  massif(x: number, z: number): number {
    const cap = MOUNTAIN_SLOPE * (Math.hypot(x - this.cx, z - this.cz) - BIOME_R) + RELIEF_LOW - 2;
    let m = -Infinity;
    for (const pk of this.peaks) {
      const d = Math.hypot(x - pk.x, z - pk.z);
      if (d * MOUNTAIN_SLOPE > pk.h + 40) continue;
      const rough = 1.4 * Math.sin(0.11 * x + 0.05 * z + this.phase[2]) + 1.4 * Math.sin(0.09 * x - 0.07 * z + this.phase[3]);
      const v = pk.h - MOUNTAIN_SLOPE * Math.max(0, d - pk.plateau) + rough * (pk.rough ? 1 : smooth(pk.plateau, pk.plateau + ROUGH_RAMP, d));
      if (v > m) m = v;
    }
    return Math.min(m, cap);
  }

  private carve(x: number, z: number): number {
    const u = x - this.village.x - 6, w = z - this.village.z;
    return VILLAGE_DEPTH + 0.5 * Math.hypot(Math.max(0, Math.abs(u) - 30), Math.max(0, Math.abs(w) - 16));
  }

  top(k: BiomeKind, x: number, z: number, h: number, flat: boolean): number {
    if (k === BIOME.void) return topMaterial(h, flat);
    if (k === BIOME.desert) return MAT.sand;
    if (k === BIOME.sea) return h <= 2 ? MAT.sand : topMaterial(h, flat);
    if (h < SEA) return MAT.loam;
    const patch = hash3(this.seed ^ 0x1ce, x >> 2, 7, z >> 2);
    if (k === BIOME.ice) return h <= 0 || vnoise(this.seed ^ 0x1cf, x * 0.06, z * 0.06) < 0.42 ? MAT.ice : MAT.stone;
    const snow = 84 + 8 * vnoise(this.seed ^ 0x5a0, x * 0.05, z * 0.05);
    if (h >= snow) return MAT.ice;
    const rock = 24 + 12 * vnoise(this.seed ^ 0x5a1, x * 0.04, z * 0.04);
    if (h >= rock) return h >= 50 && patch < 0.18 ? MAT.ice : MAT.stone;
    if (h >= rock - 8 && patch < 0.45) return MAT.stone;
    return topMaterial(h, flat);
  }

  near(x: number, z: number, reach: number): boolean {
    for (const s of this.structures) if (x >= s.x0 - reach && x <= s.x1 + reach && z >= s.z0 - reach && z <= s.z1 + reach) return true;
    return false;
  }

  private villageAt(u: number, d: number, w: number, g: number): number {
    for (const r of this.decks) {
      if (u < r.u0 || u > r.u1 || w < r.w0 || w > r.w1) continue;
      if (d === r.level) return MAT.crate;
      if (d < r.level && d > g && this.post(r, u, w)) return MAT.log;
    }
    if (d === DOCK + 1 && (u === 29 || u === 31) && Math.abs(w) === 4) return MAT.log;
    const boat = this.boatAt(u, d, w);
    if (boat >= 0) return boat;
    for (const h of this.houses) {
      const du = u - h.u, dw = w - h.w, c = Math.max(Math.abs(du), Math.abs(dw)), y = d - DECK;
      if (c > 4 || y < 1) continue;
      if (y >= 4 && y <= 8) return c <= 8 - y ? h.roof : -1;
      if (y === 1 && Math.abs(du) === 4 && Math.abs(dw) === 4 && (du > 0) === (h.w > 0)) return MAT.leaves;
      if (c !== 3) return y === 1 && du === -2 && dw === (h.w < 0 ? -2 : 2) ? MAT.crate : -1;
      const front = dw === (h.w < 0 ? 3 : -3);
      if (Math.abs(du) === 3 && Math.abs(dw) === 3) return MAT.log;
      if (front && du === 0 && y <= 2) return AIR;
      if (y === 2 && ((Math.abs(du) === 3 && dw === 0) || (!front && du === 0))) return AIR;
      return MAT.crate;
    }
    return -1;
  }

  private post(r: Rect, u: number, w: number): boolean {
    const edgeU = u === r.u0 || u === r.u1, edgeW = w === r.w0 || w === r.w1;
    if (!edgeU && !edgeW) return false;
    const onU = (u - r.u0) % 4 === 0 || u === r.u1, onW = (w - r.w0) % 4 === 0 || w === r.w1;
    return onU && onW;
  }

  private boatAt(u: number, d: number, w: number): number {
    const k = w - 4;
    const hull = (k === 0 && u >= 20 && u <= 26) || (Math.abs(k) === 1 && u >= 21 && u <= 25);
    if (!hull) return -1;
    if (d === SEA) return MAT.crate;
    if (d !== SEA + 1) return -1;
    if (Math.abs(k) === 1 || u === 20 || u === 26) return MAT.log;
    return u === 23 ? MAT.crate : -1;
  }

  private templeAt(u: number, yy: number, w: number, d: number, g: number): number {
    const c = Math.max(Math.abs(u), Math.abs(w));
    if (c > TEMPLE_HALF) return -1;
    if (yy < 0) return d > g ? MAT.ashlar : -1;
    const strip = Math.abs(u) <= 1 ? Math.abs(w) : Math.abs(w) <= 1 ? Math.abs(u) : -1;
    const stair = strip >= 4 ? STAIR[strip] : undefined;
    const t = stair ?? (c <= 3 ? 6 : c <= 5 ? 5 : c <= 8 ? 2 : -1);
    if (yy <= t) return stair !== undefined || (yy === t && c <= 3) ? MAT.flagstone : MAT.ashlar;
    if (yy >= 7 && yy <= 10) {
      if (Math.abs(u) === 2 && Math.abs(w) === 2) return MAT.goldframe;
      if (yy === 7 && c === 0) return MAT.starstone;
      return -1;
    }
    if (yy === 11 && c <= 3) return MAT.ashlar;
    if (yy === 12 && c <= 2) return MAT.ashlar;
    if (yy === 13 && c <= 1) return MAT.flagstone;
    if (yy === 14 && c === 0) return MAT.goldframe;
    return -1;
  }
}
