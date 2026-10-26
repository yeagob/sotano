import { defineItem } from '../../items/types';

export default defineItem({
  id: 'satori',
  name: 'Satori',
  description: 'A sudden awakening: everything you do is a little more of everything.',
  inspiredBy: 'Satori, sudden awakening in Zen Buddhism',
  pools: { treasure: 1, vault: 2 },
  tags: ['body', 'mind', 'emotion', 'will'],
  color: 0xf2c84b,
  quality: 4,
  icon: {
    rows: [
      '............',
      '....aaaaa...',
      '..aa.....a..',
      '.a........a.',
      '.a.........a',
      'a..........a',
      'a..........a',
      'a.........a.',
      '.a.......a..',
      '..aa...aa...',
      '....aaa.....',
      '............',
    ],
    palette: { a: 0xf2c84b },
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
