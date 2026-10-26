import { defineItem } from '../../items/types';

export default defineItem({
  id: 'boxbreathing',
  name: 'Box Breathing',
  description: 'In for four, hold for four, out for four: one more heart, and you heal completely.',
  effect: '+1 heart container and a full heal when picked up. Losing it removes the container.',
  inspiredBy: 'Box breathing (paced breathing)',
  pools: { treasure: 1 },
  tags: ['body', 'emotion'],
  color: 0x5ad1e6,
  quality: 2,
  icon: {
    rows: [
      '............',
      '.aaaaaaaaaa.',
      '.a........a.',
      '.a.bbbbbb.a.',
      '.a.b....b.a.',
      '.a.b.cc.b.a.',
      '.a.b.cc.b.a.',
      '.a.b....b.a.',
      '.a.bbbbbb.a.',
      '.a........a.',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: 0x5ad1e6, b: 0xc9f3fa, c: 0xe0303c },
  },
  // a heart container is a stat, so losing the practice takes the container away again
  stats: [{ stat: 'maxHearts', layer: 'add', value: 1 }],
  onGain(api) { api.heal(99, 'boxbreathing'); },
});
