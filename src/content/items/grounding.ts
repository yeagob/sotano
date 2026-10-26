import { defineItem } from '../../items/types';

export default defineItem({
  id: 'grounding',
  name: 'Grounding',
  description: 'Rooted in the body, you push with your whole weight: kick twice as hard.',
  inspiredBy: 'Somatic grounding techniques',
  pools: { treasure: 1 },
  tags: ['body', 'contact'],
  color: 0x4a5568,
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
    palette: { a: 0x6fa83a, b: 0x8b5a2b },
  },
  stats: [{ stat: 'kick', layer: 'mul', value: 2 }],
});
