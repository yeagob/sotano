import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const RUN = 8, SPENT = 3;
const walk = chase({});

const burn: Behaviour = {
  name: 'burn',
  update(e: Enemy, ctx: EnemyCtx) {
    if (e.state === 'spent') {
      e.wishX = 0; e.wishZ = 0;
      e.timer -= ctx.dt;
      e.pulse = 0.1;
      if (e.timer <= 0) { e.state = 'run'; e.clock = 0; e.speed = e.spec.speed * 0.8; }
      return;
    }
    e.clock += ctx.dt;
    e.speed = e.spec.speed * Math.min(3, 1 + 0.15 * e.clock);
    e.pulse = Math.min(1, e.clock / RUN);
    walk.update(e, ctx);
    if (e.clock >= RUN) {
      e.state = 'spent'; e.timer = SPENT; e.seq++;
      ctx.strike(e, { lead: 0, live: 3, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.9, effect: 'slow' } });
    }
  },
};

export default defineEnemy({
  id: 'burnout',
  name: 'Burnout',
  pattern: 'I cannot stop.',
  hp: 26,
  speed: 1.2,
  size: [0.3, 0.9],
  contactDamage: 4,
  cost: 3,
  minFloor: 7,
  maxFloor: 8,
  drops: { heart: 0.1, bomb: 0.08 },
  elements: { fire: { path: 'cross', harm: 0, speed: 1 }, lava: { path: 'avoid' } },
  behaviour: burn,
  model: [
    { size: [8 * TX, 10 * TX, 6 * TX], pos: [0, 6 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 13 * TX, 0], color: pal('husk.doubt.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 13 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 13 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 4 * TX, 2 * TX], pos: [-5 * TX, 6 * TX, 0], color: pal('husk.doubt.hi'), name: 'armL' },
    { size: [2 * TX, 4 * TX, 2 * TX], pos: [5 * TX, 6 * TX, 0], color: pal('husk.doubt.hi'), name: 'armR' },
  ],
});
