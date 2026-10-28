import { pal } from '../palette';
import { phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const SHADOWS = ['doubt', 'critic', 'panic'];
const STILL = 3;

const follow = (e: Enemy, ctx: EnemyCtx) => {
  const you = ctx.near(e);
  if (!you) { e.wishX = 0; e.wishZ = 0; return; }
  e.wishX = (you.vx ?? 0) / e.speed; e.wishZ = (you.vz ?? 0) / e.speed;
};

const mirrors: Behaviour = { name: 'mirrors', update: (e: Enemy, ctx: EnemyCtx) => follow(e, ctx) };

const reveals: Behaviour = {
  name: 'reveals',
  update(e: Enemy, ctx: EnemyCtx) {
    follow(e, ctx);
    e.timer -= ctx.dt;
    if (e.timer <= 0) { e.timer = 6; e.seq++; ctx.summon(e, [SHADOWS[Math.floor(wobble(e.id, e.seq, 1) * SHADOWS.length)]]); }
  },
};

const stops: Behaviour = {
  name: 'stops',
  update(e: Enemy, ctx: EnemyCtx) {
    e.wishX = 0; e.wishZ = 0;
    const you = ctx.near(e);
    const beside = !!you && Math.hypot(you.x - e.body.x, you.z - e.body.z) < 2.5 && Math.hypot(you.vx ?? 0, you.vz ?? 0) < 0.2;
    e.timer = beside ? e.timer + ctx.dt : 0;
    if (e.timer >= STILL) ctx.kill(e);
  },
};

export default defineEnemy({
  id: 'shadow',
  kind: 'boss',
  name: 'The Shadow',
  pattern: 'Everything you do not want to see in yourself',
  hp: 140,
  speed: 2.4,
  size: [0.34, 1.8],
  contactDamage: 8,
  cost: 0,
  minFloor: 9,
  maxFloor: 9,
  behaviour: phased({ arena: ['mirrors', 'stop'], phases: [mirrors, reveals, stops] }),
  model: [
    { size: [8 * TX, 26 * TX, 6 * TX], pos: [0, 12 * TX, 0], color: pal('ink.void'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 28 * TX, 0], color: pal('ink.void') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 6 * TX, 0], color: pal('cold.rim') },
    { size: [8 * TX, TX, TX / 2], pos: [0, 2 * TX, 3.25 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
