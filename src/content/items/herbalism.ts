import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { amt, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'herbalism',
  name: 'Herbal Lore',
  description: 'Every plant is a small, patient medicine. Learned slowly, it steadies the hand that uses it.',
  effect: 'Every potion you drink: damage +0.35, up to 6 times (starts at 1).',
  inspiredBy: 'Hildegard of Bingen, Physica (12th century)',
  pools: { treasure: 0.5 },
  tags: ['body', 'potion', 'nourish'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '.....aa.....',
      '....abba....',
      '..aabbbbaa..',
      '..abbbbbba..',
      '...aabbaa...',
      '....abba....',
      '.....cc.....',
      '.....cc.....',
      '.....cc.....',
      '....cccc....',
      '............',
      '............',
    ],
    palette: { a: pal('mat.leaf.outline'), b: pal('mat.leaf.hi'), c: pal('path.body.glow') },
  },
  stack: stackOf(6, [{ stat: 'damage', layer: 'add', value: 0.35 }]),
  hooks: [stackOnDrink('potion', n => ({ value: amt(n, 0.35) }))],
  messages: { stack: 'Herbal Lore ×{n}: damage +{value}' },
  onGain: api => { api.addStack(1); },
});
