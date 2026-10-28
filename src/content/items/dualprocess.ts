import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'dualprocess',
  name: 'Dual Process',
  description: 'Two ways of seeing at once: a quick glance and a careful look.',
  effect: 'Each shot fires two intentions; the second one deals 60% damage and mining.',
  inspiredBy: 'Dual-process theory (Daniel Kahneman, Thinking, Fast and Slow, 2011)',
  pools: { treasure: 1 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.........cc.',
      '..aabbbcdddc',
      '....abbcdddc',
      '.........cc.',
      '............',
      '.......cc...',
      'aabbbccddc..',
      '..abbccddc..',
      '.......cc...',
      '............',
      '............',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('fire', e => { e.intent.volley += 1; }, { id: 'second-look', priority: 20 }),
  ],
});
