import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'selfcompassion',
  name: 'Self-Compassion',
  description: 'You speak to yourself the way you would to a friend, and a little more room opens in you.',
  effect: '+1 heart container, and it heals one heart when you take it.',
  inspiredBy: 'Self-compassion (Kristin Neff, Self-Compassion, 2011)',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '...ccccccccc',
      '..ccccccccaa',
      '.ccccccccaaa',
      'bbbbbbbbaaaa',
      'bdd.ddbbaaaa',
      'bdddddbbaaaa',
      'bdddddbbaaaa',
      'bbdddbbbaaa.',
      'bbbdbbbbaa..',
      'bbbbbbbba...',
      'bbbbbbbb....',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow'), d: pal('bone.paper') },
  },
  stats: [{ stat: 'maxHearts', layer: 'add', value: 1 }],
  onGain(api) {
    api.heal(2);
  },
});
