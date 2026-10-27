import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'boxbreathing',
  name: 'Box Breathing',
  description: 'In for four, hold for four, out for four: one more heart, and you heal completely.',
  effect: '+1 heart container and a full heal when picked up. Losing it removes the container.',
  inspiredBy: 'Box breathing (paced breathing)',
  pools: { treasure: 1, boss: 1 },
  tags: ['body', 'emotion'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.aaaaaaaaaa.',
      '.abbbbbbbba.',
      '.ab......ba.',
      '.ab......ba.',
      '.ab..cc..ba.',
      '.ab..cc..ba.',
      '.ab......ba.',
      '.ab......ba.',
      '.abbbbbbbba.',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.glow'), c: pal('bone.paper') },
  },
  // a heart container is a stat, so losing the practice takes the container away again
  stats: [{ stat: 'maxHearts', layer: 'add', value: 1 }],
  onGain(api) { api.heal(99, 'boxbreathing'); },
});
