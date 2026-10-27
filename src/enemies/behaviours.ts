// Behaviour factories. Each returns a small state machine; enemy files pick one and tune it.
// New patterns (splitting, armour, mirroring) are new factories or an `onDeath`, never a
// switch in the enemy system.

import type { Behaviour, Enemy, EnemyCtx } from './types';

/**
 * Walk at the target and keep pressing on it (Doubt). With `hesitate`, it stops every so often to
 * reconsider (an escape window), and before it can hurt by touch it reaches for you for `reach`
 * seconds (a telegraph): owner ruling Q4, docs/art/DECISIONS.md §8.8.
 */
export function chase(opt: { lunge?: number; hesitate?: { every: number; pause: number }; reach?: number } = {}): Behaviour {
  return {
    name: 'chase',
    update(e, ctx) {
      const t = ctx.target(e);
      if (!t) { e.wishX = 0; e.wishZ = 0; e.pulse = 0; return; }
      const d = ctx.dist(e, t);
      e.timer -= ctx.dt;
      if (opt.reach) {
        if (e.state === 'reach') {
          e.wishX = 0; e.wishZ = 0;
          e.pulse = 1 - e.timer / opt.reach;
          if (e.timer <= 0) { e.state = 'press'; e.timer = 1.2; e.armed = true; }
          return;
        }
        if (e.state === 'press' && (e.timer <= 0 || d > 2.2)) { e.state = 'move'; e.armed = false; e.pulse = 0; e.timer = opt.hesitate?.every ?? 1.4; }
        if (e.state !== 'press') {
          e.armed = false;
          if (d < 1.5 && e.state !== 'pause') { e.state = 'reach'; e.timer = opt.reach; return; }
        }
      }
      if (opt.hesitate && e.state !== 'press') {
        if (e.state === 'pause') {
          e.wishX = 0; e.wishZ = 0;
          if (e.timer <= 0) { e.state = 'move'; e.timer = opt.hesitate.every; }
          return;
        }
        if (e.timer <= 0) { e.state = 'pause'; e.timer = opt.hesitate.pause; return; }
      }
      const [dx, dz] = ctx.toward(e, t);
      const k = opt.lunge && d < 2.2 ? opt.lunge : 1;
      e.wishX = dx * k; e.wishZ = dz * k;
    },
  };
}

/** Keep a distance from the target and lob projectiles in arcs (Inner Critic). */
export function ranged(opt: { keep: number; cooldown: number; windup: number }): Behaviour {
  return {
    name: 'ranged',
    update(e, ctx) {
      const t = ctx.target(e);
      e.timer -= ctx.dt;
      if (!t) { e.wishX = 0; e.wishZ = 0; e.state = 'move'; e.pulse = 0; return; }
      const d = ctx.dist(e, t);
      const [dx, dz] = ctx.toward(e, t);
      if (e.state === 'windup') {
        e.wishX = 0; e.wishZ = 0;
        e.pulse = 1 - e.timer / opt.windup;
        if (e.timer <= 0) {
          ctx.shootAt(e, t.x, t.y + 1, t.z);
          e.state = 'move'; e.timer = opt.cooldown; e.pulse = 0;
        }
        return;
      }
      // back off when too close, approach when too far, strafe in between
      const strafe = Math.sin(e.id * 1.7 + e.timer * 0.8) > 0 ? 1 : -1;
      if (d < opt.keep - 1) { e.wishX = -dx; e.wishZ = -dz; }
      else if (d > opt.keep + 2) { e.wishX = dx; e.wishZ = dz; }
      else { e.wishX = -dz * strafe * 0.6; e.wishZ = dx * strafe * 0.6; }
      if (e.timer <= 0 && d < opt.keep + 6) { e.state = 'windup'; e.timer = opt.windup; }
    },
  };
}

/** Rush at the target, swell and burst (Panic). */
export function burst(opt: { trigger: number; fuse: number; radius: number; rush: number }): Behaviour {
  return {
    name: 'burst',
    update(e: Enemy, ctx: EnemyCtx) {
      // calmed (by water): it drifts, its light dims, and only then does it look for you again
      if (e.state === 'calm') {
        e.timer -= ctx.dt;
        e.pulse = 0.05;
        e.wishX *= 0.9; e.wishZ *= 0.9;
        if (e.timer <= 0) { e.state = 'move'; e.timer = 0; }
        return;
      }
      if (e.state === 'swell') {
        e.wishX = 0; e.wishZ = 0;
        e.timer -= ctx.dt;
        // three stepped swells, the last one white (docs/art/DECISIONS.md §8.10)
        e.pulse = Math.min(1, Math.ceil((1 - e.timer / opt.fuse) * 3) / 3);
        if (e.timer <= 0) { ctx.burst(e, opt.radius); ctx.kill(e); }
        return;
      }
      const t = ctx.target(e);
      e.timer += ctx.dt; // free-running clock for the idle flicker
      e.pulse = 0.15 + 0.15 * Math.sin(e.timer * 11);
      if (!t) { e.wishX = 0; e.wishZ = 0; return; }
      const [dx, dz] = ctx.toward(e, t);
      e.wishX = dx * opt.rush; e.wishZ = dz * opt.rush;
      if (ctx.dist(e, t) < opt.trigger) { e.state = 'swell'; e.timer = opt.fuse; }
    },
  };
}
