import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const wall = (e: Enemy, ctx: EnemyCtx) => {
  if (e.tags.has('walled')) return;
  e.tags.add('walled');
  ctx.arena(e, 'ice');
};

export default defineEnemy({
  id: 'isolation',
  name: 'Isolation',
  pattern: 'Leave me alone.',
  hp: 36,
  speed: 0,
  size: [0.5, 1.2],
  contactDamage: 4,
  cost: 3,
  minFloor: 9,
  maxFloor: 9,
  drops: { heart: 0.1, key: 0.05 },
  behaviour: emitter({ every: 3, shot: wall }),
  model: [
    { size: [10 * TX, 14 * TX, 10 * TX], pos: [0, 7 * TX, 0], color: pal('cold.deep'), name: 'body' },
    { size: [12 * TX, 2 * TX, 12 * TX], pos: [0, 15 * TX, 0], color: pal('cold.rim') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 9 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 9 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
