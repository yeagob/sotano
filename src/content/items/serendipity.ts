import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

// What you did not look for finds you: some of your bomb blasts leave a key, a bomb or a heart behind.
export default defineItem({
  id: 'serendipity',
  name: 'Serendipity',
  description: 'What you did not look for finds you, if you stay open to it. Some of what you set off comes back as something you can use.',
  effect: 'Luck +1. Each of your bomb blasts has a 25% chance (+5% per luck, up to 60%) to leave a key, a bomb or a heart.',
  inspiredBy: 'Serendipity, the word coined by Horace Walpole (1754)',
  pools: { treasure: 1 },
  tags: ['emotion', 'bomb', 'luck'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '.....b......',
      '....bcb.....',
      '....bcb.....',
      '.bbbbbbbbb..',
      '.bcbbdbbcb..',
      '.bbcbdbcbb..',
      '..bbbdbbb...',
      '.....b......',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { b: pal('path.emotion.base'), c: pal('path.emotion.glow'), d: pal('bone.paper') },
  },
  stats: [{ stat: 'luck', layer: 'add', value: 1 }],
  hooks: [
    hook('bombBlast', (e, api) => {
      // one roll per blast, however many copies are held
      if (e.acted.has('serendipity')) return;
      e.acted.add('serendipity');
      const { x, y, z } = e;
      // the chance is read from luck now, the roll happens at the end of the frame
      const chance = Math.min(0.6, 0.25 + 0.05 * Math.max(0, api.stats().luck));
      api.defer(() => {
        if (!api.rng().chance(chance)) return;
        api.spawnPickup(api.rng().pick(['key', 'bomb', 'heart'] as const), x, y, z);
      });
    }, { id: 'find', priority: 200 }),
  ],
});
