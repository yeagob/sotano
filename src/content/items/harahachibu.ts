import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { pct, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'harahachibu',
  name: 'Hara Hachi Bu',
  description: 'Stop when you are about eight parts full out of ten, and keep the rest for tomorrow.',
  effect: 'Every meal you eat: jump +6%, up to 6 times (starts at 1).',
  inspiredBy: 'Hara hachi bu, the Okinawan habit of eating until 80% full',
  pools: { treasure: 0.5 },
  tags: ['body', 'meal', 'nourish'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '............',
      '..aaaaaaaa..',
      '.addddddddda',
      '..abddddba..',
      '...abbbba...',
      '....aaaa....',
      '............',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('copper.base'), d: pal('mat.leaf.hi') },
  },
  stack: stackOf(6, [{ stat: 'jump', layer: 'add', value: 0.06 }]),
  hooks: [stackOnDrink('meal', n => ({ value: pct(n, 0.06) }))],
  messages: { stack: 'Hara Hachi Bu ×{n}: jump +{value}%' },
  onGain: api => { api.addStack(1); },
});
