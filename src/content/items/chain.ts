import { mat } from '../materials';
import { defineItem, hook } from '../../items/types';

export const NEIGHBOURS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/** Who breaks blocks on behalf of Chain Reaction (used to stop it from chaining itself). */
export const CHAIN_SOURCE = 'chain';

export default defineItem({
  id: 'chain',
  name: 'Chain Reaction',
  description: 'Breaking a block damages its neighbours of the same material.',
  pools: { treasure: 1 },
  tags: ['blocks'],
  color: 0xe05d5d,
  hooks: [
    hook('blockBreak', (e, api) => {
      if (e.source === CHAIN_SOURCE) return; // chain damage does not chain again
      const m = e.material;
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const x = e.x + dx, y = e.y + dy, z = e.z + dz;
        // deferred: runs after this break finishes, within the per-frame budget
        api.defer(() => {
          if (api.materialAt(x, y, z) === m) api.damageBlock(x, y, z, mat(m).hp * 0.6, 'crush', CHAIN_SOURCE);
        });
      }
    }, { id: 'spread', priority: 200 }),
  ],
});
