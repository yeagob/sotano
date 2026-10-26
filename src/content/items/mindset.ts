import { defineItem } from '../../items/types';

export default defineItem({
  id: 'mindset',
  name: 'Growth Mindset',
  description: 'Believing you can grow lifts you higher: jump much higher.',
  effect: 'Jump height ×1.7.',
  inspiredBy: 'Mindset (Carol Dweck)',
  pools: { treasure: 1 },
  tags: ['mind', 'movement'],
  color: 0x6fd36f,
  quality: 1,
  icon: {
    rows: [
      '.....aa.....',
      '....aaaa....',
      '...aaaaaa...',
      '..aa.aa.aa..',
      '.....aa.....',
      '.....bb.....',
      '..cc.bb.....',
      '.cccbbb.....',
      '..c..bb.cc..',
      '.....bbccc..',
      '.....bb.c...',
      '....dddd....',
    ],
    palette: { a: 0x8fe38f, b: 0x4a8a3a, c: 0x6fd36f, d: 0x7a5233 },
  },
  stats: [{ stat: 'jump', layer: 'mul', value: 1.7 }],
});
