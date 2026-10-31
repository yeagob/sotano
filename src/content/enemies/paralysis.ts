import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const tether = (e: Enemy, ctx: EnemyCtx) => {
  ctx.strike(e, { lead: 0.6, live: 2.5, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 7, force: 3 } });
  ctx.strike(e, { lead: 0.6, live: 2.5, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 2.2, effect: 'slow' } });
};

export default defineEnemy({
  id: 'paralysis',
  name: 'Paralysis',
  pattern: 'Do not move.',
  hp: 100,
  speed: 0,
  size: [0.4, 2.4],
  contactDamage: 0,
  cost: 3,
  minFloor: 6,
  maxFloor: 9,
  drops: { heart: 0.1, key: 0.05 },
  behaviour: emitter({ every: 3, shot: tether }),
  model: [
    { size: [4 * TX, 30 * TX, 4 * TX], pos: [0, 15 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, 3 * TX, 4 * TX], pos: [0, 4 * TX, 2 * TX], color: pal('husk.doubt.base') },
    { size: [6 * TX, 8 * TX, 6 * TX], pos: [0, 32 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 33 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 33 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
