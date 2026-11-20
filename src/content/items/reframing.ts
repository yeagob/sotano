import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** A projection this close to a bounce point is what the setback was pointing at. */
export const SEEK_RANGE = 8;
/** Damage multiplier applied at every bounce; the bounces stack. */
export const REFRAME = 1.25;

export default defineItem({
  id: 'reframing',
  name: 'Reframing',
  description: 'Looked at again, a setback points at what matters.',
  effect: 'Intentions bounce once more. After each bounce an intention turns toward the nearest projection within 8 blocks and deals +25% damage.',
  inspiredBy: 'Cognitive reframing (cognitive therapy)',
  pools: { treasure: 1 },
  tags: ['emotion', 'intent', 'bounce'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '....bbbb....',
      '..bb....bb..',
      '.b..cc....b.',
      '.b...cc...b.',
      '.b....cc..b.',
      '.b.....cc.b.',
      '.b.....ccb..',
      '.b........b.',
      '.b........b.',
      '..bb....bb..',
      '....bbbb....',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow') },
  },
  hooks: [
    hook('fire', e => { e.intent.bounces += 1; }, { id: 'rebound', priority: 20 }),
    hook('intentBounce', (e, api) => {
      const p = api.nearestProjection(e.x, e.y, e.z, SEEK_RANGE, []);
      if (p) {
        const dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
        const d = Math.hypot(dx, dy, dz);
        const speed = Math.hypot(e.vx, e.vy, e.vz);
        if (d > 1e-9) {
          e.vx = dx / d * speed; e.vy = dy / d * speed; e.vz = dz / d * speed;
        }
      }
      e.intent.damage *= REFRAME;
    }, { id: 'seek', priority: 50 }),
  ],
});
