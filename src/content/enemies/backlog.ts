import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const walk = chase({ hesitate: { every: 3, pause: 1 } });

const throwCrate: Behaviour = {
  name: 'throw',
  update(e: Enemy, ctx: EnemyCtx) {
    walk.update(e, ctx);
    e.clock += ctx.dt;
    const t = ctx.target(e);
    if (e.clock >= 3 && t) { e.clock = 0; ctx.shootAt(e, t.x, t.y + 1, t.z); }
  },
};

export default defineEnemy({
  id: 'backlog',
  name: 'Backlog',
  pattern: 'I will get to all of it. Later.',
  hp: 60,
  speed: 0.5,
  size: [0.5, 1.6],
  contactDamage: 4,
  cost: 4,
  minFloor: 5,
  maxFloor: 9,
  drops: { bomb: 0.2, key: 0.1, heart: 0.1 },
  behaviour: throwCrate,
  model: [
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [0, 5 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [1 * TX, 15 * TX, 0], color: pal('mat.crate.dark') },
    { size: [8 * TX, 8 * TX, 8 * TX], pos: [-1 * TX, 24 * TX, 1 * TX], color: pal('mat.crate.base'), tilt: 0.2 },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 6 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 6 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
