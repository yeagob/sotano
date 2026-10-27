import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'satori',
  name: 'Satori',
  description: 'A sudden awakening: everything you do is a little more of everything.',
  effect: 'Damage +1.5, fire rate +1, speed +30%, range ×1.3, jump ×1.3, mining ×1.3, luck +2.',
  inspiredBy: 'Satori, sudden awakening in Zen Buddhism',
  pools: { treasure: 1, vault: 2 },
  tags: ['body', 'mind', 'emotion', 'will'],
  color: pal('path.body.glow'),
  quality: 4,
  icon: {
    rows: [
      '....aaaa....',
      '..aaaaaab...',
      '.aabbb......',
      '.ab.........',
      'aab.......b.',
      'aab.......aa',
      'aab.......aa',
      'aab......baa',
      '.aab....baa.',
      '.aaabbbbaaa.',
      '..aaaaaaaa..',
      '....aaaa....',
    ],
    palette: { a: pal('light.gold'), b: pal('light.core') },
  },
  stats: [
    { stat: 'damage', layer: 'add', value: 1.5 },
    { stat: 'fireRate', layer: 'add', value: 1 },
    { stat: 'moveSpeed', layer: 'add', value: 0.3 },
    { stat: 'range', layer: 'mul', value: 1.3 },
    { stat: 'jump', layer: 'mul', value: 1.3 },
    { stat: 'luck', layer: 'add', value: 2 },
    { stat: 'mining', layer: 'mul', value: 1.3 },
  ],
});
