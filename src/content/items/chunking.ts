import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export const CHUNK = 'chunk';

export default defineItem({
  id: 'chunking',
  name: 'Chunking',
  description: 'A big thing becomes small pieces you can carry.',
  effect: 'An intention that hits a projection or a block splits into two: each has half the damage and mining, 60% of the speed, and flies on in its own direction.',
  inspiredBy: 'Chunking (George A. Miller, The Magical Number Seven, 1956)',
  pools: { treasure: 1 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      'ccccccccc...',
      'cbbbbbba....',
      'cbbbbba.....',
      'cbbbba......',
      'cbbba......c',
      'cbba......ca',
      'cba......cba',
      'ca......cbba',
      'c......cbbba',
      '......cbbbba',
      '.....cbbbbba',
      '....caaaaaaa',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind === 'cube' || e.intent.tags.has(CHUNK)) return;
      const { intent, x, y, z } = e;
      for (const turn of [-0.6, 0.6]) {
        const c = Math.cos(turn), s = Math.sin(turn);
        const dx = e.vx * c - e.vz * s, dy = e.vy, dz = e.vx * s + e.vz * c;
        const l = Math.hypot(dx, dy, dz) || 1;
        const child = { ...intent, damage: intent.damage / 2, mining: intent.mining / 2, speed: intent.speed * 0.6, volley: 1, tags: new Set([...intent.tags, CHUNK]) };
        api.defer(() => api.launch(child, x + dx / l * 0.35, y + dy / l * 0.35, z + dz / l * 0.35, dx, dy, dz));
      }
    }, { id: 'split', priority: 200 }),
  ],
});
