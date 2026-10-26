// Behaviour factories. Each returns a small state machine; enemy files pick one and tune it.
// New patterns (splitting, armour, mirroring) are new factories or an `onDeath`, never a
// switch in the enemy system.

import type { Behaviour, Enemy, EnemyCtx } from './types';

/** Walk at the player and keep pressing on them (Doubt). */
export function chase(opt: { lunge?: number } = {}): Behaviour {
  return {
    name: 'chase',
    update(e, ctx) {
      const [dx, dz] = ctx.towardPlayer(e);
      const k = opt.lunge && ctx.dist(e) < 2.2 ? opt.lunge : 1;
      e.wishX = dx * k; e.wishZ = dz * k;
    },
  };
}

/** Keep a distance and lob projectiles in arcs (Inner Critic). */
export function ranged(opt: { keep: number; cooldown: number; windup: number }): Behaviour {
  return {
    name: 'ranged',
    update(e, ctx) {
      const d = ctx.dist(e);
      const [dx, dz] = ctx.towardPlayer(e);
      e.timer -= ctx.dt;
      if (e.state === 'windup') {
        e.wishX = 0; e.wishZ = 0;
        e.pulse = 1 - e.timer / opt.windup;
        if (e.timer <= 0) {
          ctx.shootAt(e, ctx.player.x, ctx.player.y + 1, ctx.player.z);
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

/** Rush in, swell and burst (Panic). */
export function burst(opt: { trigger: number; fuse: number; radius: number; rush: number }): Behaviour {
  return {
    name: 'burst',
    update(e: Enemy, ctx: EnemyCtx) {
      if (e.state === 'swell') {
        e.wishX = 0; e.wishZ = 0;
        e.timer -= ctx.dt;
        e.pulse = 1 - e.timer / opt.fuse;
        if (e.timer <= 0) { ctx.burst(e, opt.radius); ctx.kill(e); }
        return;
      }
      const [dx, dz] = ctx.towardPlayer(e);
      e.wishX = dx * opt.rush; e.wishZ = dz * opt.rush;
      e.pulse = 0.15 + 0.15 * Math.sin(performance.now() / 90);
      if (ctx.dist(e) < opt.trigger) { e.state = 'swell'; e.timer = opt.fuse; }
    },
  };
}
