import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'mindset',
  name: 'Growth Mindset',
  description: 'Believing you can grow lifts you higher: jump much higher.',
  effect: 'Jump height ×1.7.',
  inspiredBy: 'Mindset (Carol Dweck)',
  pools: { treasure: 1, boss: 1 },
  tags: ['mind', 'movement'],
  color: pal('path.mind.glow'),
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
    palette: { a: pal('path.body.glow'), b: pal('mat.grass.base'), c: pal('path.body.base'), d: pal('mat.crate.base') },
  },
  stats: [{ stat: 'jump', layer: 'mul', value: 1.7 }],
});
