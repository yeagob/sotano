import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const pulse = (e: Enemy, ctx: EnemyCtx) => {
  ctx.strike(e, { lead: 0.8, live: 0.8, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.6, grow: 5, width: 0.7, height: 1.4 } });
};

export default defineEnemy({
  id: 'dread',
  name: 'Dread',
  pattern: 'Something will go wrong.',
  hp: 40,
  speed: 0,
  size: [0.5, 0.5],
  contactDamage: 0,
  cost: 3,
  minFloor: 6,
  maxFloor: 9,
  drops: { heart: 0.08, key: 0.05 },
  behaviour: emitter({ every: 3, shot: pulse }),
  model: [
    { size: [12 * TX, 12 * TX, 12 * TX], pos: [0, 8 * TX, 0], color: pal('husk.panic.dark'), name: 'body' },
    { size: [16 * TX, TX, 16 * TX], pos: [0, 2 * TX, 0], color: pal('husk.panic.base') },
    { size: [16 * TX, TX, 16 * TX], pos: [0, 14 * TX, 0], color: pal('husk.panic.base') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 9 * TX, 6.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 9 * TX, 6.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
