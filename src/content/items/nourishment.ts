import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { amt, pct, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'nourishment',
  name: 'Nourishment',
  description: 'Care for the whole self: the body, the mind and the spirit are all fed by the same food.',
  effect: 'Every potion or meal you drink: move speed +2%, damage +0.15, jump +2.5%, fire rate +0.05 per second, up to 8 times (starts at 1).',
  inspiredBy: 'Nourishment as care of the whole self',
  pools: { treasure: 0.5 },
  tags: ['body', 'potion', 'meal', 'nourish'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '....c.c.....',
      '...cbbc.....',
      '.....b......',
      '.....b......',
      '..aaaaaaaa..',
      '..abbbbbba..',
      '..abbbbbba..',
      '...abbbba...',
      '....aaaa....',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('copper.base'), c: pal('living.glow') },
  },
  stack: stackOf(8, [
    { stat: 'moveSpeed', layer: 'add', value: 0.02 },
    { stat: 'damage', layer: 'add', value: 0.15 },
    { stat: 'jump', layer: 'add', value: 0.025 },
    { stat: 'fireRate', layer: 'add', value: 0.05 },
  ]),
  hooks: [stackOnDrink('any', n => ({
    speed: pct(n, 0.02), damage: amt(n, 0.15), jump: pct(n, 0.025), rate: amt(n, 0.05),
  }))],
  messages: { stack: 'Nourishment ×{n}: move speed +{speed}%, damage +{damage}, jump +{jump}%, fire rate +{rate} per second' },
  onGain: api => { api.addStack(1); },
});
