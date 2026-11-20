import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';
import type { IntentSpec } from '../../game/events';

/** Lineage marks: a split intention carries the mark of its generation. A lineage splits at most twice. */
export const SPLIT_ONCE = 'dialectic-1';
export const SPLIT_TWICE = 'dialectic-2';

/** The halves keep this share of the damage and of the mining (the total is preserved). */
export const HALF = 0.5;
/** How far each half turns from the reflected heading. */
export const SPLIT_ANGLE = 40 * Math.PI / 180;
/** Below this angle to the face normal, the reflected heading is too close to the normal to split around it. */
const NORMAL_CONE = Math.cos(10 * Math.PI / 180);

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);

/** Rotates `v` around the unit axis `k` by `a` radians (Rodrigues). */
export function rotate(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), kd = dot(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}

/** The two headings of a split: `v` turned by +40° and by -40° around the face normal `n`. When `v` is
 *  within 10° of the normal, the turn around the normal would do nothing sideways, so it turns around
 *  world up (world X when the face is a ceiling or floor). */
export function splitHeadings(v: V3, n: V3): [V3, V3] {
  const l = len(v);
  if (l < 1e-9) return [v, v];
  const unit: V3 = [v[0] / l, v[1] / l, v[2] / l];
  let axis: V3 = n;
  if (Math.abs(dot(unit, n)) > NORMAL_CONE) axis = Math.abs(n[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
  return [rotate(v, axis, SPLIT_ANGLE), rotate(v, axis, -SPLIT_ANGLE)];
}

/** The generation of a split intention: 0 for a shot that has never split. */
export function generation(tags: Set<string>): number {
  return tags.has(SPLIT_TWICE) ? 2 : tags.has(SPLIT_ONCE) ? 1 : 0;
}

/** Marks an intention as the generation after its own, in place. */
export function markSplit(tags: Set<string>, gen: number) {
  tags.delete(SPLIT_ONCE);
  tags.delete(SPLIT_TWICE);
  tags.add(gen === 1 ? SPLIT_ONCE : SPLIT_TWICE);
}

export default defineItem({
  id: 'dialectic',
  name: 'Dialectic',
  description: 'Every clash of ideas gives birth to two new ones.',
  effect: 'Intentions bounce once more. Each bounce splits the intention into two going opposite ways, each at half damage (at most twice per shot).',
  inspiredBy: 'The dialectical method (Hegel; Socratic dialogue)',
  pools: { treasure: 1 },
  tags: ['mind', 'intent', 'bounce'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '....ccc.....',
      '.b.......b..',
      '..b.....b...',
      '...b...b....',
      '....b.b.....',
      '.....c......',
      '.....c......',
      '.....c......',
      '....cccc....',
      '...aaaaaa...',
      '...aaaaaa...',
      '............',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  hooks: [
    hook('fire', e => { e.intent.bounces += 1; }, { id: 'rebound', priority: 20 }),
    // after Reframing's aim (priority 50), so both halves fan out from the aimed heading
    hook('intentBounce', e => {
      const gen = generation(e.intent.tags);
      if (gen >= 2) return;
      const [a, b] = splitHeadings([e.vx, e.vy, e.vz], [e.nx, e.ny, e.nz]);
      const twin: IntentSpec = { ...e.intent, damage: e.intent.damage * HALF, mining: e.intent.mining * HALF, tags: new Set(e.intent.tags) };
      e.intent.damage *= HALF;
      e.intent.mining *= HALF;
      markSplit(e.intent.tags, gen + 1);
      markSplit(twin.tags, gen + 1);
      e.vx = a[0]; e.vy = a[1]; e.vz = a[2];
      e.launch.push({ spec: twin, vx: b[0], vy: b[1], vz: b[2], bounce: e.bounce });
    }, { id: 'split', priority: 200 }),
  ],
});
