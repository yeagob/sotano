import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'affirmation',
  name: 'Affirmation',
  description: 'What you affirm you make a little more real, one copy at a time.',
  effect: 'Intentions curve toward the nearest block within 6 blocks. A positive one that hits a block leaves a loose copy of it beside the block.',
  inspiredBy: 'Autosuggestion and self-talk (Émile Coué, early 1900s)',
  pools: { treasure: 1 },
  tags: ['emotion', 'blocks'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '........cc..',
      '......cccccc',
      '......bbccaa',
      '......bbbaaa',
      '......bbbaaa',
      '..dd..bbbaaa',
      'dddddd..ba..',
      'ccddbb......',
      'cccbbb......',
      'cccbbb......',
      'cccbbb......',
      '..cb........',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('fire', e => { e.intent.homing += 3; }, { id: 'aim', priority: 20 }),
    hook('intentHit', (e, api) => {
      if (e.kind !== 'block' || e.intent.polarity !== 'positive') return;
      const cx = Math.floor(e.x - e.nx * 0.5), cy = Math.floor(e.y - e.ny * 0.5), cz = Math.floor(e.z - e.nz * 0.5);
      const m = api.materialAt(cx, cy, cz);
      if (!m) return;
      api.spawnDebris(m, cx + 0.5 + e.nx, cy + 0.5 + e.ny, cz + 0.5 + e.nz, 0, 0, 0);
    }, { id: 'copy', priority: 200 }),
  ],
});
