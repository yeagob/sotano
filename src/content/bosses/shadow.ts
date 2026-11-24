import { pal } from '../palette';
import { phased, wobble } from '../../enemies/behaviours';
import { evasive } from '../../enemies/evade';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const SHADOWS = ['doubt', 'critic', 'panic'];
const STILL = 3;
/** How close it comes in its last phase: inside the 2.5 blocks of `stops`, never touching you. */
const HOME = 2;
/** The tag its stillness ending leaves on the enemy as it dies: the game reads it and reports `how: 'stillness'`
 *  (ACHIEVEMENTS §1). Turned to your side in the achievements, not destroyed. */
export const STILLNESS_TAG = 'stillness';

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
    // it has stopped fighting, not stopped living: it comes home, slowly, to stand beside you (issue #314)
    if (you) {
      const dx = you.x - e.body.x, dz = you.z - e.body.z, d = Math.hypot(dx, dz);
      if (d > HOME) { e.wishX = dx / d * 0.4; e.wishZ = dz / d * 0.4; }
    }
    const beside = !!you && Math.hypot(you.x - e.body.x, you.z - e.body.z) < 2.5 && Math.hypot(you.vx ?? 0, you.vz ?? 0) < 0.2;
    e.timer = beside ? e.timer + ctx.dt : 0;
    if (e.timer >= STILL) { e.tags.add(STILLNESS_TAG); ctx.kill(e); }
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
  // you cannot shoot your own shadow: it slides around you, keeping its distance (so standing still beside
  // it still ends the fight). It never repositions on its own: if you stand still, so does it, by design.
  behaviour: evasive(phased({ arena: ['mirrors', 'stop'], phases: [mirrors, reveals, stops] }), { kind: 'orbit', dist: 3, tell: 0.25, seconds: 0.35, cooldown: 2, counter: false, idle: 0 }),
  model: [
    { size: [8 * TX, 26 * TX, 6 * TX], pos: [0, 12 * TX, 0], color: pal('ink.void'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 28 * TX, 0], color: pal('ink.void') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 6 * TX, 0], color: pal('cold.rim') },
    { size: [8 * TX, TX, TX / 2], pos: [0, 2 * TX, 3.25 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
