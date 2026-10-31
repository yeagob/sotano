import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const decree = (e: Enemy, ctx: EnemyCtx) => {
  const share = e.hp / e.maxHp;
  const effect = share > 0.5 ? 'mute' : share > 0.25 ? 'slow' : 'sting';
  ctx.strike(e, { lead: 0.6, live: 4, damage: 2, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 3, effect } });
};

export default defineEnemy({
  id: 'dogma',
  name: 'Dogma',
  pattern: 'It has always been this way.',
  hp: 120,
  speed: 0,
  size: [0.8, 2.6],
  contactDamage: 0,
  cost: 4,
  minFloor: 5,
  maxFloor: 6,
  armor: 0.2,
  drops: { heart: 0.1, key: 0.06 },
  behaviour: emitter({ every: 5, shot: decree }),
  model: [
    { size: [14 * TX, 38 * TX, 6 * TX], pos: [0, 19 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [14 * TX, 3 * TX, 6 * TX], pos: [0, 37 * TX, 0], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX / 2], pos: [0, 22 * TX, 3.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 22 * TX, 3.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
