import { defineItem, hook } from '../../items/types';

/** Cube tag: explodes on its next hard impact. */
export const VOLATILE = 'volatile';

export default defineItem({
  id: 'volatile',
  name: 'Volatile Grip',
  description: 'Blocks you throw explode when they hit something.',
  pools: { treasure: 1 },
  tags: ['blocks', 'explosive'],
  color: 0xff5a1f,
  stats: [{ stat: 'throw', layer: 'mul', value: 1.3 }],
  hooks: [
    // mark the cube; the explosion is a separate hook so synergies can reuse the tag
    hook('throw', e => { e.tags.add(VOLATILE); }, { id: 'arm' }),
    hook('debrisImpact', (e, api) => {
      if (e.tags.has(VOLATILE)) api.explode(e.x, e.y, e.z, 1.8, 14, 'volatile');
    }, { id: 'explode' }),
  ],
});
