import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'grounding',
  name: 'Grounding',
  description: 'Rooted in the body, you push with your whole weight: kick twice as hard.',
  effect: 'Kicks are twice as strong.',
  inspiredBy: 'Somatic grounding techniques',
  pools: { treasure: 1 },
  tags: ['body', 'contact'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '....aaaa....',
      '...aaaaaa...',
      '..aaaaaaaa..',
      '..aaaaaaaa..',
      '...aaaaaa...',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '....bbbb....',
      '...b.bb.b...',
      '..b..bb..b..',
      '.b...b....b.',
    ],
    palette: { a: pal('mat.grass.hi'), b: pal('mat.crate.base') },
  },
  stats: [{ stat: 'kick', layer: 'mul', value: 2 }],
});
