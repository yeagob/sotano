import { pal } from '../palette';
import { wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

/** Seconds between darts, the wings-flat telegraph before one, the dart's reach in speed, and the rest after it. */
const DART_EVERY = 3;
const WINDUP = 0.5;
const DART_SPEED = 3;
const RECOVER = 0.7;
/** Blocks over the floor it hovers: eye height, where its touch can land (the player is 1.8 tall). */
const FLIT_HEIGHT = 1;

/**
 * Scattered attention (Distraction, Noise): it flits about three blocks around its target and changes
 * its angle every 1.2 s, then every few seconds it stops, snaps its wings flat (0.5 s), darts through the
 * place where you stood, and rests, open to a hit. Only the dart touches: 'armed' is true only then.
 * An ally with no foe keeps you company the same way, without darting.
 */
export const flit: Behaviour = {
  name: 'flit',
  update(e: Enemy, ctx: EnemyCtx) {
    const foe = ctx.target(e);
    const t = foe ?? (e.faction === 'self' ? ctx.near(e) : null);
    e.hover = FLIT_HEIGHT;
    e.timer -= ctx.dt;
    if (e.state === 'windup') {
      e.wishX = 0; e.wishZ = 0; e.armed = false;
      e.pulse = Math.min(1, 1 - e.timer / WINDUP);
      if (e.timer > 0) return;
      const d = foe ? ctx.dist(e, foe) : 0;
      if (!foe || d < 0.01) { e.state = 'move'; e.timer = 1.2; e.pulse = 0; return; }
      const [dx, dz] = [foe.x - e.body.x, foe.z - e.body.z];
      e.aimX = dx / d; e.aimZ = dz / d;
      e.state = 'dart'; e.timer = Math.min(1.2, (d + 1) / (e.speed * DART_SPEED)); e.armed = true;
      return;
    }
    if (e.state === 'dart') {
      e.wishX = e.aimX * DART_SPEED; e.wishZ = e.aimZ * DART_SPEED; e.pulse = 1;
      if (e.timer <= 0) { e.state = 'recover'; e.timer = RECOVER; e.armed = false; }
      return;
    }
    if (e.state === 'recover') {
      e.wishX = 0; e.wishZ = 0; e.pulse = 0; e.armed = false;
      if (e.timer <= 0) { e.state = 'move'; e.timer = 1.2; e.clock = 0; }
      return;
    }
    e.armed = false;
    e.clock += ctx.dt;
    if (e.timer <= 0) { e.timer = 1.2; e.seq++; }
    if (foe && e.clock >= DART_EVERY && ctx.dist(e, foe) < 9) {
      e.state = 'windup'; e.timer = WINDUP; e.clock = 0;
      ctx.cue(e, 'windup');
      return;
    }
    const a = wobble(e.id, e.seq, 1) * Math.PI * 2;
    const cx = t ? t.x : e.body.x, cz = t ? t.z : e.body.z;
    const tx = cx + Math.cos(a) * 3, tz = cz + Math.sin(a) * 3;
    const dx = tx - e.body.x, dz = tz - e.body.z, l = Math.hypot(dx, dz) || 1;
    e.wishX = dx / l; e.wishZ = dz / l;
    e.pulse = 0.4 + 0.3 * Math.sin(e.timer * 9);
  },
};

export default defineEnemy({
  id: 'distraction',
  name: 'Distraction',
  pattern: 'Ooh, what is that?',
  hp: 12,
  speed: 1.8,
  size: [0.22, 0.2],
  contactDamage: 2,
  cost: 1,
  minFloor: 1,
  maxFloor: 5,
  drops: { heart: 0.05 },
  behaviour: flit,
  model: [
    { size: [6 * TX, 3 * TX, 4 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [8 * TX, TX / 2, 3 * TX], pos: [-4 * TX, 3.5 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, 0.35] },
    { size: [8 * TX, TX / 2, 3 * TX], pos: [4 * TX, 3.5 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, -0.35] },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 2.5 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 2.5 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
