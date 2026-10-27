import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'socratic',
  name: 'Socratic Questioning',
  description: 'Question the belief behind the lock: two keys now, and locked doors sometimes just open.',
  effect: '+2 keys when picked up. Locked doors open without a key 35% of the time.',
  inspiredBy: 'Socratic questioning (cognitive behavioural therapy)',
  pools: { treasure: 1 },
  tags: ['mind'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '....aaaa....',
      '...aa..aa...',
      '...aa..aa...',
      '.......aa...',
      '......aa....',
      '.....aa.....',
      '.....aa.....',
      '.....aa.....',
      '............',
      '.....aa.....',
      '.....aa.....',
      '............',
    ],
    palette: { a: pal('sky.day') },
  },
  messages: { lock: 'The lock gives way to a good question' },
  onGain(api) { api.collect('key', 2); },
  hooks: [
    hook('doorOpen', (e, api) => {
      if (e.needsKey && api.rng().chance(0.35)) { e.needsKey = false; api.toast('lock'); }
    }, { id: 'unlock', priority: 20 }),
  ],
});
