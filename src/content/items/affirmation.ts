import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Set on an intention once it has placed its copy: at most one copy per intention. */
export const COPIED = 'affirmed';

export default defineItem({
  id: 'affirmation',
  name: 'Affirmation',
  description: 'What you affirm you make a little more real, one copy at a time.',
  effect: 'A positive intention that hits a block places a copy of that block beside it, of the same material (only into empty space inside the room).',
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
    // the copy goes into the cell the hit face looks onto; placeBlock refuses anything it must (body, door, wall)
    hook('intentHit', (e, api) => {
      if (e.kind !== 'block' || e.intent.polarity !== 'positive' || e.intent.tags.has(COPIED)) return;
      const cx = Math.floor(e.x - e.nx * 0.5), cy = Math.floor(e.y - e.ny * 0.5), cz = Math.floor(e.z - e.nz * 0.5);
      const m = api.materialAt(cx, cy, cz);
      if (m && api.placeBlock(cx + e.nx, cy + e.ny, cz + e.nz, m, 'affirmation')) e.intent.tags.add(COPIED);
    }, { id: 'copy', priority: 200 }),
  ],
});
