// Attack colour (issue #47, DECISIONS §3.4 and §7.6; owner ruling 2026-10-31): an enemy attack that
// deals damage warns in yellow until its blow lands, then the blow is red. Particles and decoration
// never take either: they are pale blue-white. Colour-blindness simulation is the same Machado 2009
// matrices as tests/art.test.ts.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { harms, Hazards, markTint, PARTICLE_TINTS, type Strike } from '../src/enemies/attacks';
import { PALETTE, pal, type PalToken } from '../src/content/palette';
import { OMEN_COLORS } from '../src/game/omens';

type Rgb = [number, number, number];
type Vision = 'normal' | 'deutan' | 'protan' | 'tritan';

const MATRIX: Record<Vision, number[][]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const VISIONS = Object.keys(MATRIX) as Vision[];

const linear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const hexOf = (t: PalToken) => PALETTE[t];
const toLinear = (hex: string): Rgb => [0, 2, 4].map(i => linear(parseInt(hex.slice(1 + i, 3 + i), 16))) as Rgb;

function simulate(hex: string, v: Vision): Rgb {
  const [r, g, b] = toLinear(hex);
  return MATRIX[v].map(row => Math.min(1, Math.max(0, row[0] * r + row[1] * g + row[2] * b))) as Rgb;
}

function lab([r, g, b]: Rgb): Rgb {
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

function deltaE(a: string, b: string, v: Vision): number {
  const la = lab(simulate(a, v)), lb = lab(simulate(b, v));
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** CIE L* and the hue angle (degrees) of a hex colour, in CIE Lab. */
function lightAndHue(hex: string): { L: number; h: number; c: number } {
  const [L, a, b] = lab(toLinear(hex));
  return { L, h: (Math.atan2(b, a) * 180) / Math.PI + (b < 0 ? 360 : 0), c: Math.hypot(a, b) };
}

const shot = (over: Partial<Strike>, shape: Strike['shape']): Strike => ({ lead: 0, live: 0.2, damage: 0, shape, ...over });
const ring = { kind: 'ring' as const, x: 0, y: 0, z: 0, r: 1, grow: 0, width: 0.4, height: 1 };
const line = { kind: 'line' as const, x0: 0, z0: 0, x1: 4, z1: 0, y: 0, width: 0.3 };
const pull = { kind: 'pull' as const, x: 0, y: 0, z: 0, r: 4, force: 6 };
const sting = { kind: 'field' as const, x: 0, y: 0, z: 0, r: 1.2, effect: 'sting' as const };
const slow = { kind: 'field' as const, x: 0, y: 0, z: 0, r: 1.2, effect: 'slow' as const };

describe('which attacks hurt (harms)', () => {
  it('a blow with damage hurts, whatever its shape', () => {
    expect(harms(shot({ damage: 8 }, ring))).toBe(true);
    expect(harms(shot({ damage: 4 }, line))).toBe(true);
    expect(harms(shot({ damage: 4 }, { kind: 'sweep', axis: 'x', from: 0, to: 4, speed: 1, across: [0, 2], y: 0, height: 1, width: 0.6 }))).toBe(true);
  });

  it('a telegraph with no damage hurts only when it warns of a blow that does', () => {
    expect(harms(shot({ damage: 0 }, line))).toBe(false);
    expect(harms(shot({ damage: 0, warns: true }, line))).toBe(true);
    expect(harms(shot({ damage: 0, warns: true }, ring))).toBe(true);
  });

  it('a pull only drags: it never hurts, even with damage set', () => {
    expect(harms(shot({ damage: 0 }, pull))).toBe(false);
    expect(harms(shot({ damage: 4 }, pull))).toBe(false);
  });

  it('a field hurts only when it stings; slowing or muting fields do not', () => {
    expect(harms(shot({ damage: 4 }, sting))).toBe(true);
    expect(harms(shot({ damage: 0 }, sting))).toBe(false);
    expect(harms(shot({ damage: 4 }, slow))).toBe(false);
  });
});

describe('mark colour (markTint)', () => {
  it('damaging attacks warn in yellow and are red once they land', () => {
    expect(markTint(true, false)).toBe('attack.warn.base');
    expect(markTint(true, true)).toBe('attack.red.base');
  });

  it('attacks that do not hurt stay in the pale cold ramp', () => {
    expect(markTint(false, false)).toBe('cold.body');
    expect(markTint(false, true)).toBe('cold.white');
  });
});

describe('what the hazard mesh draws', () => {
  /** The colour written to each instance of the hazards' mesh, after one frame. */
  function drawn(strikes: Strike[]): THREE.Color[] {
    const scene = new THREE.Scene();
    const host = { actors: () => [], hurt() {}, affect() {}, push() {}, live() {}, particles() {} };
    const hazards = new Hazards(scene, host);
    for (const s of strikes) hazards.add(1, 'projection', 'test', s);
    hazards.update(0.1);
    const mesh = scene.children.find((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh)!;
    const out: THREE.Color[] = [];
    for (let i = 0; i < mesh.count; i++) {
      const c = new THREE.Color();
      mesh.getColorAt(i, c);
      out.push(c);
    }
    return out;
  }
  const same = (c: THREE.Color, token: PalToken) => {
    const want = new THREE.Color(pal(token));
    return Math.abs(c.r - want.r) < 1e-6 && Math.abs(c.g - want.g) < 1e-6 && Math.abs(c.b - want.b) < 1e-6;
  };

  it('a warning of a damaging ring is drawn in the attack warning yellow', () => {
    const marks = drawn([shot({ lead: 0.5, live: 0.2, damage: 4 }, ring)]);
    expect(marks.length).toBeGreaterThan(0);
    for (const c of marks) expect(same(c, 'attack.warn.base')).toBe(true);
  });

  it('a growing ring shows its reach in the dimmer yellow while it warns', () => {
    const marks = drawn([shot({ lead: 0.5, live: 0.2, damage: 4 }, { ...ring, grow: 2 })]);
    const bright = marks.filter(c => same(c, 'attack.warn.base')).length;
    const dim = marks.filter(c => same(c, 'attack.warn.dim')).length;
    expect(bright).toBeGreaterThan(0);
    expect(dim).toBeGreaterThan(0);
    expect(bright + dim).toBe(marks.length);
  });

  it('a warning that does not hurt is drawn in the pale ramp, never yellow', () => {
    const marks = drawn([shot({ lead: 0.5, live: 0.2, damage: 0 }, ring)]);
    expect(marks.length).toBeGreaterThan(0);
    for (const c of marks) expect(same(c, 'cold.body')).toBe(true);
  });

  it('a pull is drawn in the pale ramp, never red', () => {
    const marks = drawn([shot({ lead: 0, live: 0.5, damage: 0 }, pull)]);
    expect(marks.length).toBeGreaterThan(0);
    for (const c of marks) expect(same(c, 'cold.white')).toBe(true);
  });

  it('a live damaging ring is the bright attack red', () => {
    const marks = drawn([shot({ lead: 0, live: 0.5, damage: 4 }, ring)]);
    expect(marks.length).toBeGreaterThan(0);
    for (const c of marks) expect(same(c, 'attack.red.base')).toBe(true);
  });
});

describe('the warning is yellow, not the player\'s light', () => {
  const WARN: PalToken[] = ['attack.warn.base', 'attack.warn.dim'];
  const RED: PalToken[] = ['attack.red.base'];
  const LIGHT = (Object.keys(PALETTE) as PalToken[]).filter(t => t.startsWith('light.'));

  it('both warning tokens are yellow: CIE Lab hue 80–110°, chroma > 40', () => {
    for (const t of WARN) {
      const { h, c } = lightAndHue(hexOf(t));
      expect(c, t).toBeGreaterThan(40);
      expect(h, `${t} hue ${h.toFixed(0)}°`).toBeGreaterThanOrEqual(80);
      expect(h, `${t} hue ${h.toFixed(0)}°`).toBeLessThanOrEqual(110);
    }
  });

  it('the bright warning reads on a dark floor (L* ≥ 75)', () => {
    expect(lightAndHue(hexOf('attack.warn.base')).L).toBeGreaterThanOrEqual(75);
  });

  it('stay ΔE ≥ 20 from every light.* token under normal vision, so a warning never reads as the player\'s light', () => {
    for (const t of WARN) for (const l of LIGHT) expect(deltaE(hexOf(t), hexOf(l), 'normal'), `${t} vs ${l}`).toBeGreaterThanOrEqual(20);
  });

  it('stay ΔE ≥ 20 from the live attack red under normal vision', () => {
    for (const t of WARN) for (const r of RED) expect(deltaE(hexOf(t), hexOf(r), 'normal'), `${t} vs ${r}`).toBeGreaterThanOrEqual(20);
  });

  it('stay separable from the cold and the particle ramp under every colour-blindness simulation', () => {
    for (const v of VISIONS) {
      for (const warn of WARN) {
        for (const pale of ['cold.white', 'cold.body'] as PalToken[]) {
          expect(deltaE(hexOf(warn), hexOf(pale), v), `${warn} vs ${pale} (${v})`).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });
});

describe('the red is an attack red, not life', () => {
  const RED: PalToken[] = ['attack.red.dim', 'attack.red.base'];

  it('both attack reds are reddish: the red family of life.heart (CIE Lab hue 15–55°, chroma > 40)', () => {
    for (const t of RED) {
      const { h, c } = lightAndHue(hexOf(t));
      expect(c, t).toBeGreaterThan(40);
      expect(h, `${t} hue ${h.toFixed(0)}°`).toBeGreaterThanOrEqual(15);
      expect(h, `${t} hue ${h.toFixed(0)}°`).toBeLessThanOrEqual(55);
    }
  });

  it('keep ΔE ≥ 20 from life.heart under normal vision (DECISIONS §3.12 rule 2)', () => {
    for (const t of RED) expect(deltaE(hexOf(t), hexOf('life.heart'), 'normal'), t).toBeGreaterThanOrEqual(20);
  });

  it('stay separable from the cold and the particle ramp under every colour-blindness simulation', () => {
    for (const v of VISIONS) {
      for (const red of RED) {
        for (const pale of ['cold.white', 'cold.body'] as PalToken[]) {
          expect(deltaE(hexOf(red), hexOf(pale), v), `${red} vs ${pale} (${v})`).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });

  it('the live red is bright (L* ≥ 50), so a live blow reads against dark floors', () => {
    expect(lightAndHue(hexOf('attack.red.base')).L).toBeGreaterThanOrEqual(50);
  });
});

describe('particles and decoration are pale blue-white', () => {
  it('the particle ramp is very light (L* ≥ 75) and cold, never red', () => {
    for (const t of PARTICLE_TINTS) {
      const { L, h } = lightAndHue(hexOf(t));
      expect(L, t).toBeGreaterThanOrEqual(75);
      expect(h, `${t} hue ${h.toFixed(0)}°`).toBeGreaterThan(200);
      expect(h).toBeLessThan(300);
    }
  });

  it('the omen motes (the spawn warning) use the same pale ramp', () => {
    for (const t of OMEN_COLORS) expect(lightAndHue(hexOf(t)).L, t).toBeGreaterThanOrEqual(75);
  });

  it('no particle or decoration tint is an attack red or an attack warning', () => {
    const particle: readonly string[] = [...PARTICLE_TINTS, ...OMEN_COLORS];
    for (const t of particle) expect(t.startsWith('attack.'), t).toBe(false);
  });
});
