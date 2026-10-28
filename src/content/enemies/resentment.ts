import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const GROWTH_EVERY = 6;
const walk = chase({});

const grudge: Behaviour = {
  name: 'grudge',
  update(e: Enemy, ctx: EnemyCtx) {
    e.clock += ctx.dt;
    e.timer -= ctx.dt;
    if (e.timer <= 0) {
      e.timer = 1;
      ctx.strike(e, { lead: 0, live: 5, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.8, effect: 'slow' } });
    }
    if (e.clock >= GROWTH_EVERY && e.maxHp < e.spec.hp * 2) {
      e.clock = 0;
      e.maxHp = Math.min(e.spec.hp * 2, e.maxHp * 1.2);
      e.hp = Math.min(e.maxHp, e.hp * 1.2);
      e.pulse = 0.6;
    }
    walk.update(e, ctx);
  },
};

export default defineEnemy({
  id: 'resentment',
  name: 'Resentment',
  pattern: 'I will not forget',
  hp: 14,
  speed: 0.8,
  size: [0.38, 0.9],
  contactDamage: 4,
  cost: 2,
  minFloor: 3,
  maxFloor: 4,
  drops: { heart: 0.1 },
  behaviour: grudge,
  model: [
    { size: [10 * TX, 12 * TX, 8 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, 2 * TX, 8 * TX], pos: [0, 14 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [2 * TX, 6 * TX, TX], pos: [6 * TX, 10 * TX, 0], color: pal('ink.void'), rot: [0, 0, 0.4] },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 11 * TX, 4.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 11 * TX, 4.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
