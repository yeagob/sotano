// The Sanctuary's scenes (docs/design/built/presences/MEDITATION-APP.md §4): one painter per meditation, on a
// 2D canvas. A scene is drawn from `p`, the sitting's place in its five parts (part + how far into it), so
// each part has its own effect and they pass into each other without a cut; the breath moves the shape the
// player follows. Colours come only from the `med.*` palette tokens. Everything random is drawn from a
// seeded Rng when the scene is made, so a scene always looks the same at the same moment.

import { Rng } from '../core/rng';
import { PALETTE } from '../content/palette';
import { palOf, type BreathKind, type PaletteRole, type SceneId } from '../content/presences/meditations';

type C = CanvasRenderingContext2D;
type Tone = SceneId | 'app';

export interface SceneFrame {
  /** Part index plus progress through it (0 to 5), eased by the view so a skipped part never pops. */
  p: number;
  lung: number;
  breath: BreathKind;
  breathT: number;
  /** Changes when a new beat of the breath begins. */
  beat: number;
  /** Seconds of scene time; it stands still while the sitting is paused. */
  t: number;
  dt: number;
  /** The most motes this frame may hold (0 with calm visuals). */
  cap: number;
  /** False with calm visuals: only the still background and the breath shape are drawn. */
  effects: boolean;
  sway: boolean;
  /** 0 to 1 at the end of a sitting: the motes drift to the centre. */
  gather: number;
}

/** The effect each part of each scene paints, in the order of the parts. */
export const EFFECTS: Record<SceneId, readonly string[]> = {
  ground: ['dustSettles', 'rootsGrow', 'columnRises', 'leavesGather', 'wholeGlow'],
  dusk: ['duskFalls', 'oneLantern', 'lanternPairs', 'skyOfLanterns', 'lanternsToStars'],
  night: ['starsComeOut', 'mountainsRise', 'auroraUnfolds', 'waterMirrors', 'paleDawn'],
  box: ['squareDraws', 'beadAndTrail', 'nestedSquares', 'tileField', 'squareToCircle'],
  warm: ['orbSteadies', 'ringsStayClose', 'twoOrbsMeet', 'manyOrbsJoined', 'oneGlow'],
  river: ['firstDrop', 'streamsAndRings', 'leavesDrift', 'wideShimmer', 'moonOnStillWater'],
};

const TAU = Math.PI * 2;
const rgb = new Map<string, string>();

function col(id: Tone, role: PaletteRole, a = 1): string {
  const key = `${id}.${role}`;
  let v = rgb.get(key);
  if (!v) {
    const n = parseInt(PALETTE[palOf(id, role)].slice(1), 16);
    v = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    rgb.set(key, v);
  }
  return `rgba(${v},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0 before `a`, 1 after `b`, smooth in between. */
function ramp(x: number, a: number, b: number): number {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
}

function background(c: C, w: number, h: number, id: Tone) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, col(id, 'high'));
  g.addColorStop(0.55, col(id, 'mid'));
  g.addColorStop(1, col(id, 'deep'));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function glow(c: C, x: number, y: number, r: number, id: Tone, role: PaletteRole, a: number) {
  if (a <= 0.004 || r <= 0.5) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col(id, role, a));
  g.addColorStop(0.35, col(id, role, a * 0.42));
  g.addColorStop(1, col(id, role, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function disc(c: C, x: number, y: number, r: number, style: string) {
  c.fillStyle = style;
  c.beginPath();
  c.arc(x, y, Math.max(0.3, r), 0, TAU);
  c.fill();
}

function ring(c: C, x: number, y: number, r: number, style: string, width: number) {
  if (r <= 0.5) return;
  c.strokeStyle = style;
  c.lineWidth = width;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.stroke();
}

function roundRect(c: C, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.arcTo(x + w, y, x + w, y + h, k);
  c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k);
  c.arcTo(x, y, x + w, y, k);
  c.closePath();
}

/** A mote, in screen fractions (0 to 1 on both axes), so a resize never strands it. */
interface Mote { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; seed: number; state: number }

abstract class Scene {
  readonly motes: Mote[] = [];
  protected rng: Rng;
  private owed = 0;

  constructor(readonly id: SceneId, seed: number) { this.rng = new Rng(seed); }

  protected abstract draw(c: C, w: number, h: number, f: SceneFrame): void;

  paint(c: C, w: number, h: number, f: SceneFrame) {
    background(c, w, h, this.id);
    if (!f.effects) {
      this.motes.length = 0;
      calmBreath(c, w, h, this.id, f.lung);
      return;
    }
    c.save();
    if (f.sway) {
      const k = 1.035 + 0.012 * Math.sin(f.t * 0.05);
      c.translate(w / 2 + Math.sin(f.t * 0.07) * w * 0.008, h / 2 + Math.cos(f.t * 0.05) * h * 0.006);
      c.scale(k, k);
      c.translate(-w / 2, -h / 2);
    }
    this.draw(c, w, h, f);
    c.restore();
  }

  /** Spawns up to the cap at `rate` per second, moves every mote and drops the spent ones. */
  protected stepMotes(f: SceneFrame, rate: number, make: () => Mote, move: (m: Mote, dt: number) => void) {
    if (this.motes.length > f.cap) this.motes.length = f.cap;
    this.owed = Math.min(4, this.owed + rate * f.dt);
    while (this.owed >= 1) {
      this.owed -= 1;
      if (this.motes.length < f.cap) this.motes.push(make());
    }
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.age += f.dt;
      if (f.gather > 0) {
        m.x += (0.5 - m.x) * f.gather * f.dt * 1.1;
        m.y += (0.5 - m.y) * f.gather * f.dt * 1.1;
      } else move(m, f.dt);
      if (m.age >= m.life || m.x < -0.12 || m.x > 1.12 || m.y < -0.12 || m.y > 1.12) {
        this.motes[i] = this.motes[this.motes.length - 1];
        this.motes.pop();
      }
    }
  }

  protected mote(x: number, y: number, vx: number, vy: number, life: number, size: number): Mote {
    return { x, y, vx, vy, age: 0, life, size, seed: this.rng.next() * 100, state: 0 };
  }
}

/** On a short screen (a phone on its side) the words take more of the height, so the scene's centre of
 *  attention is drawn smaller and higher. */
const short = (h: number) => h < 460;

const fade = (m: Mote, edge = 1.5) => clamp01(Math.min(m.age / edge, (m.life - m.age) / edge));

/** Calm visuals: the breath is a still circle whose light rises and falls. Nothing moves across the screen. */
function calmBreath(c: C, w: number, h: number, id: Tone, lung: number) {
  const m = Math.min(w, h), x = w / 2, y = h * 0.4, r = m * 0.17;
  glow(c, x, y, r * 2.4, id, 'glow', 0.08 + 0.3 * lung);
  disc(c, x, y, r, col(id, 'glow', 0.06 + 0.5 * lung));
  ring(c, x, y, r, col(id, 'glow', 0.6), Math.max(1.5, m * 0.005));
}

class Ground extends Scene {
  private roots: { x: number; pts: [number, number][]; twig: [number, number, number] }[] = [];
  private leaves: { x: number; y: number; s: number; ph: number; rot: number }[] = [];

  constructor() {
    super('ground', 11);
    const r = this.rng;
    for (let i = 0; i < 9; i++) {
      const pts: [number, number][] = [[0, 0]];
      let dx = 0;
      const lean = r.range(-0.012, 0.012);
      for (let k = 1; k <= 12; k++) { dx += lean + r.range(-0.012, 0.012); pts.push([dx, k / 12 * r.range(0.9, 1.1)]); }
      this.roots.push({ x: 0.5 + (i - 4) * 0.075 + r.range(-0.02, 0.02), pts, twig: [r.int(3, 8), r.range(-0.05, 0.05), r.range(0.04, 0.09)] });
    }
    for (let i = 0; i < 30; i++) {
      const a = r.range(0, TAU), d = Math.sqrt(r.next());
      this.leaves.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.55, s: r.range(0.6, 1.3), ph: r.range(0, TAU), rot: r.range(0, TAU) });
    }
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), cx = w / 2, hy = h * (short(h) ? 0.54 : 0.62), p = f.p;
    const still = 1 - 0.6 * ramp(p, 4, 5);
    c.fillStyle = col('ground', 'accent2', 0.2);
    c.beginPath();
    c.moveTo(-w * 0.1, h);
    for (let i = -2; i <= 26; i++) {
      const x = i / 24;
      c.lineTo(x * w, hy - (Math.sin(x * 3.1 + 0.6) * 0.035 + Math.sin(x * 7.3) * 0.012 + 0.035) * h);
    }
    c.lineTo(w * 1.1, h);
    c.fill();
    const col2 = ramp(p, 2, 2.8), top = hy - col2 * h * 0.3 * (0.92 + 0.08 * f.lung);
    if (col2 > 0) {
      const cw = m * (0.07 + 0.035 * f.lung);
      for (const k of [0.12, 0.45, 0.8]) glow(c, cx, lerp(hy, top, k), cw * 2.4, 'ground', 'glow', col2 * 0.2);
      c.strokeStyle = col('ground', 'glow', col2 * 0.22);
      c.lineWidth = Math.max(1, m * 0.004);
      c.beginPath(); c.moveTo(cx, hy); c.lineTo(cx, top); c.stroke();
    }
    const la = ramp(p, 3, 3.7);
    if (la > 0) {
      c.fillStyle = col('ground', 'mote', la * 0.7);
      for (const l of this.leaves) {
        const x = cx + l.x * m * 0.3 + Math.sin(f.t * 0.4 * still + l.ph) * m * 0.008;
        const y = top - m * 0.02 + l.y * m * 0.24 + Math.cos(f.t * 0.3 * still + l.ph) * m * 0.004;
        c.beginPath();
        c.ellipse(x, y, m * 0.011 * l.s, m * 0.0052 * l.s, l.rot + Math.sin(f.t * 0.35 * still + l.ph) * 0.4, 0, TAU);
        c.fill();
      }
    }
    c.fillStyle = col('ground', 'deep', 0.94);
    c.beginPath();
    c.moveTo(-w * 0.1, h * 1.1);
    for (let i = -2; i <= 26; i++) c.lineTo(i / 24 * w, hy + Math.sin(i / 24 * 2.2 + 2) * 0.012 * h);
    c.lineTo(w * 1.1, h * 1.1);
    c.fill();
    const grow = ramp(p, 1, 2) * 0.93 + 0.07 * f.lung * ramp(p, 1, 1.2);
    if (grow > 0) {
      const depth = h - hy;
      c.lineCap = 'round';
      for (const r of this.roots) {
        const x0 = r.x * w, n = grow * 12, whole = Math.floor(n), part = n - whole;
        c.strokeStyle = col('ground', 'glow', 0.36);
        c.lineWidth = Math.max(1, m * 0.004);
        c.beginPath();
        c.moveTo(x0, hy);
        let tx = x0, ty = hy;
        for (let k = 1; k <= Math.min(12, whole + 1); k++) {
          const [ax, ay] = r.pts[k - 1], [bx, by] = r.pts[k];
          const q = k <= whole ? 1 : part;
          tx = x0 + lerp(ax, bx, q) * w; ty = hy + lerp(ay, by, q) * depth * 0.92;
          c.lineTo(tx, ty);
        }
        c.stroke();
        const [tk, tdx, tdy] = r.twig;
        if (n > tk + 0.5) {
          const q = clamp01(n - tk - 0.5), [ax, ay] = r.pts[tk];
          c.strokeStyle = col('ground', 'accent', 0.4);
          c.lineWidth = Math.max(1, m * 0.003);
          c.beginPath();
          c.moveTo(x0 + ax * w, hy + ay * depth * 0.92);
          c.lineTo(x0 + (ax + tdx * q) * w, hy + (ay + tdy * q) * depth * 0.92);
          c.stroke();
        }
        glow(c, tx, ty, m * (0.014 + 0.012 * f.lung), 'ground', 'accent', 0.5);
      }
    }
    glow(c, cx, hy - h * 0.16, m * 0.75, 'ground', 'glow', ramp(p, 4, 5) * 0.16);
    glow(c, cx, hy, m * (0.08 + 0.07 * f.lung), 'ground', 'glow', 0.5);
    disc(c, cx, hy, m * (0.012 + 0.012 * f.lung), col('ground', 'glow', 0.95));
    const r = this.rng, land = hy / h;
    this.stepMotes(f, (p < 1 ? 11 : 4) * still, () => this.mote(r.next(), -0.03, 0, r.range(0.03, 0.06), 60, r.range(0.0016, 0.0034)), (o, dt) => {
      if (o.state === 1) return;
      o.y += o.vy * dt;
      o.x += Math.sin(o.age * 0.6 + o.seed) * 0.004 * dt;
      if (o.y >= land - 0.004) { o.y = land - 0.004; o.state = 1; o.life = o.age + 3.5; }
    });
    for (const o of this.motes) disc(c, o.x * w, o.y * h, o.size * m, col('ground', 'mote', fade(o) * 0.6));
  }
}

class Dusk extends Scene {
  private lanterns: { x: number; y0: number; speed: number; size: number; ph: number }[] = [];
  private stars: { x: number; y: number; ph: number }[] = [];
  private rise = 0;

  constructor() {
    super('dusk', 23);
    const r = this.rng;
    this.lanterns.push({ x: 0.5, y0: 0, speed: 0, size: 1.5, ph: 0 });
    for (let k = 0; k < 4; k++) {
      const x = 0.16 + k * 0.215 + r.range(-0.03, 0.03), y0 = r.next() * 1.25, speed = r.range(0.016, 0.024), size = r.range(0.85, 1.1);
      this.lanterns.push({ x, y0, speed, size, ph: r.range(0, TAU) }, { x: x + 0.06, y0: y0 + 0.07, speed, size: size * 0.9, ph: r.range(0, TAU) });
    }
    for (let i = 0; i < 17; i++) this.lanterns.push({ x: r.range(0.04, 0.96), y0: r.next() * 1.25, speed: r.range(0.012, 0.03), size: r.range(0.45, 1), ph: r.range(0, TAU) });
    for (let i = 0; i < 36; i++) this.stars.push({ x: r.next(), y: r.next() * 0.7, ph: r.range(0, TAU) });
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), p = f.p, toStars = ramp(p, 4, 4.8);
    c.fillStyle = col('dusk', 'accent2', (1 - ramp(p, 0, 0.9)) * 0.2);
    c.fillRect(0, 0, w, h);
    glow(c, w / 2, h * 1.08, Math.max(w, h) * 0.7, 'dusk', 'accent', 0.22);
    for (const s of this.stars) disc(c, s.x * w, s.y * h, m * 0.0022, col('dusk', 'glow', toStars * (0.35 + 0.3 * Math.sin(f.t * 0.5 + s.ph))));
    this.rise += f.dt * (1 - 0.92 * toStars);
    for (const [i, l] of this.lanterns.entries()) {
      const a = i === 0 ? ramp(p, 1, 1.3) : i <= 8 ? ramp(p, 2 + (i - 1) * 0.05, 2.3 + (i - 1) * 0.05) : ramp(p, 3 + (i - 9) * 0.04, 3.3 + (i - 9) * 0.04);
      if (a <= 0) continue;
      const x = (l.x + Math.sin(this.rise * 0.3 + l.ph) * 0.012) * w;
      const y = i === 0 ? h * lerp(0.42, 0.34, toStars) : (1.12 - (this.rise * l.speed + l.y0) % 1.25) * h;
      // a lantern thins out before it reaches the clock at the top of the screen
      const a2 = i === 0 ? a : a * ramp(y / h, 0.14, 0.3);
      const breath = i === 0 ? 0.85 + 0.35 * f.lung : 0.96 + 0.08 * f.lung;
      const R = m * 0.03 * l.size * breath * lerp(1, 0.16, toStars);
      glow(c, x, y, R * lerp(3.4, 5, toStars), 'dusk', 'glow', a2 * lerp(0.36, 0.5, toStars));
      if (toStars < 1) {
        c.fillStyle = col('dusk', 'accent', a2 * 0.9 * (1 - toStars));
        roundRect(c, x - R * 0.6, y - R * 0.8, R * 1.2, R * 1.6, R * 0.35);
        c.fill();
      }
      c.fillStyle = col('dusk', 'glow', a2);
      c.beginPath();
      c.ellipse(x, y + R * 0.1 * (1 - toStars), R * lerp(0.34, 0.6, toStars), R * lerp(0.5, 0.6, toStars), 0, 0, TAU);
      c.fill();
    }
    const r = this.rng;
    this.stepMotes(f, (p < 1 ? 8 : 5) * (1 - 0.6 * toStars), () => this.mote(r.next(), 1.03, 0, -r.range(0.03, 0.07), 16, r.range(0.0012, 0.0026)), (o, dt) => {
      o.y += o.vy * dt;
      o.x += Math.sin(o.age * 0.8 + o.seed) * 0.01 * dt;
    });
    for (const o of this.motes) disc(c, o.x * w, o.y * h, o.size * m, col('dusk', 'mote', fade(o) * 0.55));
  }
}

class Night extends Scene {
  private stars: { x: number; y: number; s: number; ph: number; hz: number }[] = [];
  private ridges: number[][] = [];
  private ribbons: { y: number; k: number; ph: number; dir: number }[] = [];
  private rings: { x: number; y: number; age: number }[] = [];
  private nextRing = 0;

  constructor() {
    super('night', 37);
    const r = this.rng;
    for (let i = 0; i < 72; i++) this.stars.push({ x: r.next(), y: r.next() * 0.72, s: r.range(0.6, 1.6), ph: r.range(0, TAU), hz: r.range(0.05, 0.25) });
    for (let layer = 0; layer < 3; layer++) {
      const a = [r.range(0, TAU), r.range(0, TAU), r.range(0, TAU)], ridge: number[] = [];
      for (let i = 0; i <= 40; i++) {
        const x = i / 40;
        ridge.push(Math.sin(x * (3 + layer) + a[0]) * 0.05 + Math.sin(x * (9 + layer * 3) + a[1]) * 0.022 + Math.sin(x * 23 + a[2]) * 0.008);
      }
      this.ridges.push(ridge);
    }
    for (let i = 0; i < 3; i++) this.ribbons.push({ y: 0.1 + i * 0.07, k: r.range(1.6, 2.6), ph: r.range(0, TAU), dir: i % 2 ? -1 : 1 });
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), p = f.p;
    const out = ramp(p, 0, 0.95) * this.stars.length;
    for (const [i, s] of this.stars.entries()) {
      const a = clamp01(out - i);
      if (a > 0) disc(c, s.x * w, s.y * h, m * 0.0019 * s.s, col('night', 'mote', a * (0.5 + 0.35 * Math.sin(f.t * TAU * s.hz + s.ph))));
    }
    const A = ramp(p, 2, 2.7) * (1 - 0.35 * ramp(p, 4, 5));
    if (A > 0) {
      c.globalCompositeOperation = 'lighter';
      const strips = Math.max(48, Math.ceil(w / 4));
      for (const [ri, rb] of this.ribbons.entries()) {
        const role: PaletteRole = ri === 2 ? 'accent2' : 'accent';
        const g = c.createLinearGradient(0, 0, 0, 1);
        g.addColorStop(0, col('night', role, 0));
        g.addColorStop(0.16, col('night', role, 0.3));
        g.addColorStop(1, col('night', role, 0));
        c.fillStyle = g;
        for (let j = 0; j < strips; j++) {
          const x = j / strips;
          const y = h * (rb.y + Math.sin(x * TAU * rb.k + f.t * 0.07 * rb.dir + rb.ph) * 0.05 + Math.sin(x * 11 + f.t * 0.11) * 0.013);
          const tall = h * (0.2 + 0.07 * Math.sin(x * 7 + f.t * 0.05 + ri * 2));
          c.globalAlpha = A * (0.55 + 0.45 * Math.sin(x * 5 + f.t * 0.09 + rb.ph)) * (0.8 + 0.2 * f.lung);
          // whole pixels, edge to edge: strips that overlap or leave a gap show as bars
          const x0 = Math.round(x * w), x1 = Math.round((j + 1) / strips * w);
          c.save();
          c.translate(x0, y);
          c.scale(x1 - x0, tall);
          c.fillRect(0, 0, 1, 1);
          c.restore();
        }
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    glow(c, w / 2, h * 0.74, Math.max(w, h) * 0.7, 'night', 'glow', ramp(p, 4, 5) * 0.42);
    const fills = [col('night', 'accent2', 0.2), col('night', 'high', 0.92), col('night', 'deep', 1)];
    for (const [i, ridge] of this.ridges.entries()) {
      const up = ramp(p, 1 + i * 0.25, 1.5 + i * 0.25);
      if (up <= 0) continue;
      const base = h * (0.56 + i * 0.09) + (1 - up) * h * 0.5;
      c.fillStyle = fills[i];
      c.beginPath();
      c.moveTo(-w * 0.1, h * 1.1);
      c.lineTo(-w * 0.1, base);
      for (let k = 0; k <= 40; k++) c.lineTo(k / 40 * w, base - ridge[k] * h);
      c.lineTo(w * 1.1, base);
      c.lineTo(w * 1.1, h * 1.1);
      c.fill();
    }
    const W = ramp(p, 3, 3.6);
    if (W > 0) {
      const wy = h * 0.82;
      c.fillStyle = col('night', 'mid', W * 0.9);
      c.fillRect(-w * 0.1, wy, w * 1.2, h);
      for (let i = 0; i < 12; i++) {
        const y = wy + (i + 0.5) / 12 * (h - wy), len = w * (0.1 + 0.12 * Math.abs(Math.sin(i * 2.4 + f.t * 0.13)));
        const x = w * (0.5 + 0.34 * Math.sin(i * 1.7 + f.t * 0.05));
        c.strokeStyle = col('night', i % 3 === 2 ? 'accent2' : 'accent', W * A * 0.3);
        c.lineWidth = Math.max(1, m * 0.003);
        c.beginPath(); c.moveTo(x - len, y); c.lineTo(x + len, y); c.stroke();
      }
      this.nextRing -= f.dt;
      if (this.nextRing <= 0 && this.rings.length < 5) {
        this.nextRing = this.rng.range(3, 6);
        this.rings.push({ x: this.rng.range(0.12, 0.88), y: this.rng.range(0.86, 0.96), age: 0 });
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const g = this.rings[i];
        g.age += f.dt;
        if (g.age > 6) { this.rings.splice(i, 1); continue; }
        c.strokeStyle = col('night', 'glow', W * (1 - g.age / 6) * 0.4);
        c.lineWidth = Math.max(1, m * 0.0025);
        c.beginPath();
        c.ellipse(g.x * w, g.y * h, g.age * m * 0.05, g.age * m * 0.014, 0, 0, TAU);
        c.stroke();
      }
    }
    glow(c, w * 0.5, h * 0.36, m * (0.09 + 0.08 * f.lung), 'night', 'glow', 0.42);
    disc(c, w * 0.5, h * 0.36, m * (0.022 + 0.012 * f.lung), col('night', 'glow', 0.95));
    const r = this.rng;
    this.stepMotes(f, 2.2, () => this.mote(r.next(), r.range(0.45, 1), r.range(-0.006, 0.006), -r.range(0.004, 0.012), 14, r.range(0.0012, 0.0024)), (o, dt) => {
      o.x += (o.vx + Math.sin(o.age * 0.5 + o.seed) * 0.004) * dt;
      o.y += o.vy * dt;
    });
    for (const o of this.motes) disc(c, o.x * w, o.y * h, o.size * m, col('night', 'mote', fade(o, 3) * (0.3 + 0.3 * Math.sin(o.age * 1.3 + o.seed))));
  }
}

class Box extends Scene {
  constructor() { super('box', 41); }

  /** The bead's place on the square's edge: up the left side, along the top, down the right, back along the
   *  bottom. `round` (0 to 1) bends the square into the circle it becomes at the end. */
  private pointOn(u: number, s: number, round: number): [number, number] {
    const v = ((u % 1) + 1) % 1, k = Math.floor(v * 4), q = v * 4 - k, half = s / 2;
    const sq: [number, number] = k === 0 ? [-half, half - s * q] : k === 1 ? [-half + s * q, -half] : k === 2 ? [half, -half + s * q] : [half - s * q, half];
    const a = Math.PI * 0.75 + v * TAU;
    return [lerp(sq[0], Math.cos(a) * half, round), lerp(sq[1], Math.sin(a) * half, round)];
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), cx = w / 2, cy = h * (short(h) ? 0.4 : 0.42), p = f.p;
    const s = m * (short(h) ? 0.36 : 0.44) * (0.95 + 0.05 * f.lung), round = ramp(p, 4, 4.9), rad = lerp(s * 0.07, s / 2, round);
    const u = f.breath === 'natural' ? f.breathT : ((f.beat % 4) + f.breathT) / 4;
    const field = ramp(p, 3, 3.5) * (1 - ramp(p, 4, 4.5));
    if (field > 0) {
      const cell = s / 4, nx = Math.ceil(w / cell / 2) + 1, ny = Math.ceil(h / cell / 2) + 1;
      for (let gy = -ny; gy <= ny; gy++) for (let gx = -nx; gx <= nx; gx++) {
        const d = Math.max(Math.abs(gx + 0.5), Math.abs(gy + 0.5));
        if (d < 2.2) continue;
        const b = Math.exp(-((d - 2.5 - u * 7) ** 2) / 1.6);
        c.fillStyle = col('box', 'accent2', field * (0.05 + 0.26 * b));
        roundRect(c, cx + gx * cell + cell * 0.08, cy + gy * cell + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.16);
        c.fill();
      }
    }
    glow(c, cx, cy, s * 0.75, 'box', 'accent', 0.07 + 0.12 * f.lung);
    const nest = ramp(p, 2, 2.5) * (1 - 0.65 * ramp(p, 3, 3.5)) * (1 - round);
    if (nest > 0) {
      for (let k = 1; k <= 3; k++) {
        const sk = s * 0.74 ** k;
        c.strokeStyle = col('box', 'accent', nest * (0.42 - 0.09 * k));
        c.lineWidth = Math.max(1, m * 0.004);
        roundRect(c, cx - sk / 2, cy - sk / 2, sk, sk, sk * 0.07);
        c.stroke();
        const [bx, by] = this.pointOn(u - k * 0.06, sk, 0);
        glow(c, cx + bx, cy + by, m * 0.026, 'box', 'glow', nest * 0.45);
        disc(c, cx + bx, cy + by, m * 0.006, col('box', 'glow', nest * 0.9));
      }
    }
    const drawn = ramp(p, 0, 0.85), per = 4 * s - 8 * rad + TAU * rad;
    c.strokeStyle = col('box', 'accent', 0.6);
    c.lineWidth = Math.max(1.5, m * 0.006);
    c.lineCap = 'round';
    if (drawn < 1) c.setLineDash([per * drawn, per]);
    roundRect(c, cx - s / 2, cy - s / 2, s, s, rad);
    c.stroke();
    c.setLineDash([]);
    const trail = ramp(p, 1, 1.3);
    if (trail > 0) {
      for (let k = 16; k >= 1; k--) {
        const [tx, ty] = this.pointOn(u - k * 0.0055, s, round);
        disc(c, cx + tx, cy + ty, m * 0.009 * (1 - k / 20), col('box', 'mote', trail * 0.5 * (1 - k / 17)));
      }
    }
    const [bx, by] = this.pointOn(u, s, round);
    glow(c, cx + bx, cy + by, m * 0.055, 'box', 'glow', 0.6 * drawn);
    disc(c, cx + bx, cy + by, m * 0.011, col('box', 'glow', drawn));
    const r = this.rng;
    this.stepMotes(f, 3, () => this.mote(r.next(), r.next(), r.range(-0.008, 0.008), r.range(-0.008, 0.008), 12, r.range(0.001, 0.0022)), (o, dt) => {
      o.x += o.vx * dt;
      o.y += o.vy * dt;
    });
    for (const o of this.motes) disc(c, o.x * w, o.y * h, o.size * m, col('box', 'mote', fade(o, 3) * 0.4));
  }
}

class Warm extends Scene {
  private small: { x: number; y: number; s: number; ph: number }[] = [];
  private links: [number, number][] = [];
  private rings: { x: number; y: number; age: number; max: number }[] = [];
  private lastBeat = -1;

  constructor() {
    super('warm', 53);
    const r = this.rng;
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 6; gx++) {
      this.small.push({ x: (gx + 0.5) / 6 + r.range(-0.05, 0.05), y: 0.14 + gy * 0.3 + r.range(-0.07, 0.07), s: r.range(0.7, 1.2), ph: r.range(0, TAU) });
    }
    for (let i = 0; i < this.small.length; i++) {
      const near = this.small.map((o, j) => [j, Math.hypot(o.x - this.small[i].x, o.y - this.small[i].y)] as const)
        .filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 2);
      for (const [j] of near) this.links.push([i, j]);
    }
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), cx = w / 2, cy = h * 0.42, p = f.p;
    const pair = ramp(p, 2, 2.5) - ramp(p, 4, 4.6);
    const ax = cx - pair * m * 0.17, bx = cx + pair * m * 0.17;
    const reach = m * lerp(lerp(0.3, 0.42, ramp(p, 2, 2.4)), 0.62, ramp(p, 3, 3.4));
    const breathOut = f.breath === 'out' || f.breath === 'natural';
    if (f.beat !== this.lastBeat) {
      this.lastBeat = f.beat;
      if (breathOut && p >= 1 && this.rings.length < 10) {
        this.rings.push({ x: ax / w, y: cy / h, age: 0, max: reach });
        if (pair > 0.5) this.rings.push({ x: bx / w, y: cy / h, age: 0, max: reach });
      }
    }
    glow(c, cx, cy, m * 0.85, 'warm', 'accent', ramp(p, 4, 5) * 0.16);
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const g = this.rings[i];
      g.age += f.dt;
      const r = g.age * m * 0.055;
      if (r >= g.max) { this.rings.splice(i, 1); continue; }
      const a = (1 - r / g.max) * Math.min(1, g.age);
      ring(c, g.x * w, g.y * h, r, col('warm', 'accent', a * 0.28), Math.max(1.5, m * 0.004));
      ring(c, g.x * w, g.y * h, r * 0.82, col('warm', 'accent2', a * 0.14), Math.max(1, m * 0.003));
    }
    const many = ramp(p, 3, 3.7), home = ramp(p, 4, 5);
    if (many > 0) {
      const at = (o: { x: number; y: number }): [number, number] => [lerp(o.x * w, cx, home), lerp(o.y * h, cy, home)];
      c.strokeStyle = col('warm', 'accent2', many * 0.16 * (1 - home));
      c.lineWidth = Math.max(1, m * 0.0022);
      c.beginPath();
      for (const [i, j] of this.links) {
        const [x1, y1] = at(this.small[i]), [x2, y2] = at(this.small[j]);
        c.moveTo(x1, y1); c.lineTo(x2, y2);
      }
      c.stroke();
      for (const o of this.small) {
        const [x, y] = at(o), beat = 0.85 + 0.3 * (0.5 + 0.5 * Math.sin(f.t * 0.5 + o.ph)) * f.lung;
        glow(c, x, y, m * 0.045 * o.s * beat, 'warm', 'glow', many * 0.5 * (1 - home * 0.7));
        disc(c, x, y, m * 0.006 * o.s, col('warm', 'glow', many * 0.9 * (1 - home)));
      }
    }
    const orb = (x: number, a: number) => {
      const R = m * (0.19 + 0.075 * f.lung);
      glow(c, x, cy, R * 1.5, 'warm', 'accent', a * 0.3);
      glow(c, x, cy, R, 'warm', 'glow', a * 0.62);
      glow(c, x, cy, R * 0.5, 'warm', 'accent2', a * 0.4);
    };
    if (pair > 0.02) orb(bx, pair);
    orb(ax, ramp(p, 0, 0.5) * 0.85 + 0.15);
    const r = this.rng;
    this.stepMotes(f, 2.5, () => this.mote(r.range(-0.1, 0.9), -0.05, r.range(0.012, 0.03), r.range(0.015, 0.035), 40, r.range(0.004, 0.008)), (o, dt) => {
      o.x += (o.vx + Math.sin(o.age * 0.5 + o.seed) * 0.01) * dt;
      o.y += o.vy * dt;
    });
    for (const o of this.motes) {
      c.fillStyle = col('warm', 'mote', fade(o, 3) * 0.32);
      c.beginPath();
      c.ellipse(o.x * w, o.y * h, o.size * m * 1.5, o.size * m * 0.7, o.seed + o.age * 0.35, 0, TAU);
      c.fill();
    }
  }
}

class River extends Scene {
  private streams: { y: number; k: number; sp: number; ph: number; amp: number }[] = [];
  private rings: { x: number; y: number; age: number }[] = [];
  private nextDrop = 1.5;
  private flowT = 0;

  constructor() {
    super('river', 67);
    const r = this.rng;
    for (let i = 0; i < 18; i++) {
      const row = i < 9 ? (i + 0.5) / 9 : (i - 8.5) / 9 - 0.055;
      this.streams.push({ y: row + r.range(-0.015, 0.015), k: r.range(4, 9), sp: r.range(0.5, 1.1), ph: r.range(0, TAU), amp: r.range(0.012, 0.03) });
    }
  }

  protected draw(c: C, w: number, h: number, f: SceneFrame) {
    const m = Math.min(w, h), cx = w / 2, cy = h * 0.42, p = f.p;
    const flow = ramp(p, 1, 1.6) * (1 - ramp(p, 4, 4.8)), wide = ramp(p, 3, 3.5) * (1 - ramp(p, 4, 4.5)), moon = ramp(p, 4, 5);
    this.flowT += f.dt * (0.2 + 0.8 * flow);
    c.lineCap = 'round';
    for (const [i, s] of this.streams.entries()) {
      const a = i < 9 ? 1 : wide;
      if (a <= 0) continue;
      c.beginPath();
      for (let k = 0; k <= 36; k++) {
        const x = k / 36;
        const y = (s.y + Math.sin(x * s.k + this.flowT * s.sp + s.ph) * s.amp * (0.25 + 0.75 * flow)) * h;
        if (k === 0) c.moveTo(-w * 0.05, y); else c.lineTo(x * w * 1.1 - w * 0.05, y);
      }
      c.strokeStyle = col('river', 'accent', a * (0.07 + 0.17 * flow));
      c.lineWidth = Math.max(1, m * 0.003);
      c.stroke();
      if (wide > 0) {
        c.setLineDash([m * 0.03, m * 0.24]);
        c.lineDashOffset = -this.flowT * m * 0.12 * s.sp - i * 37;
        c.strokeStyle = col('river', 'glow', wide * 0.4);
        c.stroke();
        c.setLineDash([]);
      }
    }
    this.nextDrop -= f.dt;
    if (this.nextDrop <= 0 && this.rings.length < 8) {
      const r = this.rng, part = Math.floor(p);
      this.nextDrop = part === 0 ? 5 : part === 1 ? r.range(1.8, 3.2) : r.range(5, 8);
      this.rings.push(part === 0 ? { x: 0.5 + r.range(-0.04, 0.04), y: 0.42 + r.range(-0.03, 0.03), age: 0 } : { x: r.range(0.08, 0.92), y: r.range(0.1, 0.9), age: 0 });
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const g = this.rings[i];
      g.age += f.dt;
      if (g.age > 6) { this.rings.splice(i, 1); continue; }
      const a = (1 - g.age / 6) * Math.min(1, g.age * 2) * (1 - 0.7 * moon);
      ring(c, g.x * w, g.y * h, g.age * m * 0.06, col('river', 'glow', a * 0.3), Math.max(1, m * 0.003));
      ring(c, g.x * w, g.y * h, g.age * m * 0.036, col('river', 'accent', a * 0.2), Math.max(1, m * 0.002));
    }
    glow(c, cx, cy, m * (0.12 + 0.07 * f.lung), 'river', 'glow', 0.2 + 0.3 * moon);
    disc(c, cx, cy, m * 0.034 * (1 + 0.18 * f.lung), col('river', 'glow', 0.14 + 0.78 * moon));
    if (moon > 0) {
      for (let i = 1; i <= 7; i++) {
        const y = cy + m * (0.05 + i * 0.03), half = m * 0.05 * (1 - i / 9) * (0.8 + 0.2 * Math.sin(f.t * 0.4 + i));
        c.strokeStyle = col('river', 'glow', moon * 0.3 * (1 - i / 8));
        c.lineWidth = Math.max(1, m * 0.004);
        c.beginPath(); c.moveTo(cx - half, y); c.lineTo(cx + half, y); c.stroke();
      }
    }
    const r = this.rng, leaves = p >= 2 && p < 3 ? 1.5 : p >= 3 && p < 3.4 ? 0.5 : 0;
    this.stepMotes(f, leaves, () => this.mote(-0.06, r.range(0.08, 0.92), r.range(0.03, 0.06), 0, 45, r.range(0.007, 0.012)), (o, dt) => {
      o.x += o.vx * dt * (0.35 + 0.65 * flow);
      o.y += Math.sin(o.age * 0.5 + o.seed) * 0.006 * dt;
    });
    for (const o of this.motes) {
      const a = fade(o, 2), x = o.x * w, y = o.y * h, rot = Math.sin(o.age * 0.7 + o.seed) * 0.5;
      c.fillStyle = col('river', 'accent', a * 0.8);
      c.beginPath();
      c.ellipse(x, y, o.size * m * 1.5, o.size * m * 0.62, rot, 0, TAU);
      c.fill();
      c.strokeStyle = col('river', 'mote', a * 0.6);
      c.lineWidth = Math.max(1, m * 0.0018);
      c.beginPath();
      c.moveTo(x - Math.cos(rot) * o.size * m * 1.2, y - Math.sin(rot) * o.size * m * 1.2);
      c.lineTo(x + Math.cos(rot) * o.size * m * 1.2, y + Math.sin(rot) * o.size * m * 1.2);
      c.stroke();
    }
  }
}

export interface ScenePainter { readonly motes: readonly unknown[]; paint(c: C, w: number, h: number, f: SceneFrame): void }

export function makeScene(id: SceneId): ScenePainter {
  switch (id) {
    case 'ground': return new Ground();
    case 'dusk': return new Dusk();
    case 'night': return new Night();
    case 'box': return new Box();
    case 'warm': return new Warm();
    case 'river': return new River();
  }
}

/** A drifting field of motes that needs no state: each one's place is a function of its number and the time. */
function driftingMotes(c: C, w: number, h: number, t: number, n: number, a: number) {
  const m = Math.min(w, h);
  for (let i = 0; i < n; i++) {
    const sp = 0.008 + (i * 37 % 11) * 0.0016, x = (i * 0.6180339 + Math.sin(t * 0.1 + i) * 0.02) % 1;
    const y = 1.05 - ((t * sp + i * 0.137) % 1.1);
    disc(c, x * w, y * h, m * (0.0014 + (i % 3) * 0.0006), col('app', 'mote', a * (0.25 + 0.25 * Math.sin(t * 0.4 + i * 1.7))));
  }
}

/** The app's own screens (Home, the leave sheet): its night, three slow lights and the open ring of the sanctuary. */
export function paintHome(c: C, w: number, h: number, t: number, effects: boolean) {
  background(c, w, h, 'app');
  const m = Math.min(w, h), k = effects ? t : 0;
  glow(c, w * (0.28 + 0.06 * Math.sin(k * 0.05)), h * (0.3 + 0.05 * Math.cos(k * 0.04)), m * 0.75, 'app', 'accent2', 0.2);
  glow(c, w * (0.74 + 0.05 * Math.cos(k * 0.045)), h * (0.66 + 0.06 * Math.sin(k * 0.035)), m * 0.7, 'app', 'accent', 0.13);
  glow(c, w * 0.5, h * 1.1, m * 0.9, 'app', 'accent', 0.12);
  const breath = effects ? 0.5 + 0.5 * Math.sin(k * 0.45) : 0.5;
  c.strokeStyle = col('app', 'glow', 0.1 + 0.06 * breath);
  c.lineWidth = Math.max(1.5, m * 0.004);
  c.beginPath();
  c.arc(w / 2, h / 2, m * (0.4 + 0.012 * breath), -Math.PI * 0.38, Math.PI * 1.38);
  c.stroke();
  if (effects) driftingMotes(c, w, h, t, w < 600 ? 22 : 40, 1);
}

/** The shared ending, over whatever scene the sitting had: the app's night returns, the motes have gathered
 *  into one seed of light, the seed opens in three slow rings and a dawn rises. `e` is seconds since the end. */
export function paintEnding(c: C, w: number, h: number, e: number, t: number, effects: boolean) {
  const m = Math.min(w, h), cx = w / 2, cy = h * (short(h) ? 0.3 : 0.4);
  c.globalAlpha = ramp(e, 0, 3.5);
  background(c, w, h, 'app');
  c.globalAlpha = 1;
  glow(c, cx, h * 1.12, Math.max(w, h) * 0.8, 'app', 'accent', 0.3 * ramp(e, 3, 10));
  const seed = ramp(e, 1.2, 4.5);
  if (effects) {
    for (let k = 0; k < 3; k++) {
      const age = e - 3.6 - k * 1.5;
      if (age <= 0 || age >= 8) continue;
      const q = age / 8, r = (1 - (1 - q) ** 2) * m * 0.62;
      ring(c, cx, cy, r, col('app', k === 1 ? 'accent2' : 'accent', (1 - q) * 0.55), Math.max(1.5, m * 0.005));
    }
    driftingMotes(c, w, h, t, w < 600 ? 22 : 40, ramp(e, 4, 8));
  }
  glow(c, cx, cy, m * (0.06 + 0.26 * seed), 'app', 'glow', 0.55 * seed);
  disc(c, cx, cy, m * (0.008 + 0.014 * seed), col('app', 'glow', seed));
}
