// Art rules that can be checked without rendering (docs/art/DECISIONS.md §12.6).
// Colour-blindness simulation uses Machado et al. 2009 at full severity, the same matrices as
// the mediator's tools (cvd.mjs), applied to linear RGB and measured in CIE Lab (ΔE76).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PALETTE, PATHS, type PalToken } from '../src/content/palette';

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

/** Colour difference after simulating `v` for both colours. */
function deltaE(a: string, b: string, v: Vision): number {
  const la = lab(simulate(a, v)), lb = lab(simulate(b, v));
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

function luminance(hex: string): number {
  const [r, g, b] = toLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

const pathBase = (p: string): PalToken => `path.${p}.base` as PalToken;
const RESERVED: PalToken[] = ['life.heart', 'light.gold', 'light.core', 'cold.body'];

describe('palette', () => {
  it('every token is a #RRGGBB hex', () => {
    for (const [token, hex] of Object.entries(PALETTE)) {
      expect(hex, token).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('paths keep ΔE ≥ 20 pairwise under normal, deutan, protan and tritan vision', () => {
    for (const v of VISIONS) {
      for (let i = 0; i < PATHS.length; i++) {
        for (let j = i + 1; j < PATHS.length; j++) {
          const a = PALETTE[pathBase(PATHS[i])], b = PALETTE[pathBase(PATHS[j])];
          expect(deltaE(a, b, v), `${PATHS[i]} vs ${PATHS[j]} (${v})`).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });

  it('path colours stay ≥ 15 away from the reserved colours under every simulation', () => {
    for (const v of VISIONS) {
      for (const p of PATHS) {
        for (const r of RESERVED) {
          expect(deltaE(PALETTE[pathBase(p)], PALETTE[r], v), `${p} vs ${r} (${v})`).toBeGreaterThanOrEqual(15);
        }
      }
    }
  });

  it('path colours and bone text read ≥ 4.5:1 on the panel', () => {
    for (const p of PATHS) {
      expect(contrast(PALETTE[pathBase(p)], PALETTE['ink.panel']), p).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(PALETTE['bone.paper'], PALETTE['ink.panel'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PALETTE['bone.dim'], PALETTE['ink.panel'])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('colour sources (ratchet)', () => {
  // Hex literals still outside palette.ts. The count per file may only go down. When a file is
  // moved onto tokens, lower its number in tests/art.ratchet.json; a new literal fails this test.
  const ROOT = join(__dirname, '..');
  const HEX = /0x[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{6}\b/g;
  const SKIP = new Set(['src/content/palette.ts']);

  function files(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) files(p, out);
      else if (/\.(ts|html)$/.test(name)) out.push(p);
    }
    return out;
  }

  const counts = (): Record<string, number> => {
    const out: Record<string, number> = {};
    const targets = [...files(join(ROOT, 'src')), join(ROOT, 'index.html')];
    for (const p of targets) {
      const rel = relative(ROOT, p).split('\\').join('/');
      if (SKIP.has(rel)) continue;
      const n = (readFileSync(p, 'utf8').match(HEX) ?? []).length;
      if (n > 0) out[rel] = n;
    }
    return out;
  };

  it('no file gains hex literals', () => {
    const baseline: Record<string, number> = JSON.parse(readFileSync(join(ROOT, 'tests/art.ratchet.json'), 'utf8'));
    const now = counts();
    const grew = Object.entries(now).filter(([f, n]) => n > (baseline[f] ?? 0));
    expect(grew, 'files with new hex literals; use palette tokens').toEqual([]);
  });
});
