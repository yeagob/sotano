import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const walk = chase({});

const freeze: Behaviour = {
  name: 'freeze',
  update(e: Enemy, ctx: EnemyCtx) {
    walk.update(e, ctx);
    e.clock += ctx.dt;
    if (e.clock >= 3) {
      e.clock = 0;
      ctx.strike(e, { lead: 0, live: 3, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 2.5, effect: 'slow' } });
    }
  },
};

export default defineEnemy({
  id: 'numbness',
  name: 'Numbness',
  pattern: 'I do not feel anything.',
  hp: 60,
  speed: 0.5,
  size: [0.4, 1.8],
  contactDamage: 4,
  cost: 3,
  minFloor: 9,
  maxFloor: 9,
  drops: { heart: 0.1, key: 0.06 },
  elements: { water: { path: 'cross', speed: 0.7 } },
  behaviour: freeze,
  model: [
    { size: [12 * TX, 24 * TX, 10 * TX], pos: [0, 12 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [13 * TX, 3 * TX, 11 * TX], pos: [0, 24 * TX, 0], color: pal('cold.rim') },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 30 * TX, 0], color: pal('paper.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 30 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 30 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
