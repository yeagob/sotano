import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Cube tag: explodes on its next hard impact. */
export const VOLATILE = 'volatile';

export default defineItem({
  id: 'catharsis',
  name: 'Symbolic Act',
  description: 'A symbolic act reaches what words cannot: blocks you throw burst on impact.',
  effect: 'Blocks you throw explode when they hit something (radius 1.8, can hurt you). Throw strength ×1.3.',
  inspiredBy: 'Psychomagic (Alejandro Jodorowsky); catharsis in psychodrama (J. L. Moreno)',
  pools: { treasure: 1 },
  tags: ['emotion', 'blocks', 'explosive'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      'a..........a',
      '.a........a.',
      '..a......a..',
      '...bbbbbb...',
      '...bccccb...',
      '...bccccb...',
      '...bccccb...',
      '...bccccb...',
      '...bbbbbb...',
      '..a......a..',
      '.a........a.',
      'a..........a',
    ],
    palette: { a: pal('path.will.glow'), b: pal('path.will.base'), c: pal('sky.horizon') },
  },
  causes: ['volatile'],
  stats: [{ stat: 'throw', layer: 'mul', value: 1.3 }],
  hooks: [
    // mark the cube; the explosion is a separate hook so synergies can reuse the tag
    hook('throw', e => { e.tags.add(VOLATILE); }, { id: 'arm' }),
    hook('debrisImpact', (e, api) => {
      if (e.tags.has(VOLATILE)) api.explode(e.x, e.y, e.z, 1.8, 14, 'volatile');
    }, { id: 'explode' }),
  ],
});
