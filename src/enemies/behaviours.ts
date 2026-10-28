// Behaviour factories. Each returns a small state machine; enemy files pick one and tune it.
// New patterns (splitting, armour, mirroring) are new factories or an `onDeath`, never a
// switch in the enemy system.

import type { Behaviour, Enemy, EnemyCtx } from './types';
import { fx } from '../core/fx';
import { hash3 } from '../core/rng';

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

/**
 * Keeps away from you (the roots' Wonders): it runs from you inside `scared` blocks and otherwise
 * drifts, hovering, never toward you.
 */
export function flee(opt: { hover: number; scared: number }): Behaviour {
  return {
    name: 'flee',
    update(e, ctx) {
      e.timer -= ctx.dt;
      const you = ctx.near(e);
      if (e.timer <= 0) {
        e.timer = 1.2 + fx.random() * 2;
        const a = fx.random() * Math.PI * 2;
        e.wishX = Math.cos(a) * 0.6; e.wishZ = Math.sin(a) * 0.6;
      }
      if (you) {
        const dx = you.x - e.body.x, dz = you.z - e.body.z, d = Math.hypot(dx, dz) || 1;
        if (d < opt.scared) { e.wishX = -dx / d; e.wishZ = -dz / d; }
      }
      e.pulse = 0.5 + 0.5 * Math.sin(e.timer * 3);
      const lift = opt.hover + Math.sin(e.timer * 2.4) * 0.25;
      if (e.body.vy < 2 && e.body.onGround || e.body.vy < 0) e.body.vy += (lift * 4 - e.body.vy) * Math.min(1, ctx.dt * 6);
    },
  };
}

/**
 * A peaceful creature (the roots, L6): it hovers at about a block over the ground and drifts, now
 * toward you (curious) and now away, never touching. Cosmetic randomness only (`fx`).
 */
export function wander(opt: { hover: number; near: number; far: number }): Behaviour {
  return {
    name: 'wander',
    update(e, ctx) {
      e.timer -= ctx.dt;
      const you = ctx.near(e);
      if (e.timer <= 0) {
        e.timer = 1.2 + fx.random() * 2;
        const a = fx.random() * Math.PI * 2;
        e.wishX = Math.cos(a) * 0.6; e.wishZ = Math.sin(a) * 0.6;
        if (you) {
          const dx = you.x - e.body.x, dz = you.z - e.body.z, d = Math.hypot(dx, dz) || 1;
          // come closer when you are far, keep a little distance when you are near
          if (d > opt.far) { e.wishX = dx / d; e.wishZ = dz / d; } else if (d < opt.near) { e.wishX = -dx / d; e.wishZ = -dz / d; }
        }
      }
      // hover: lift toward the hovering height, a slow bob
      e.pulse = 0.5 + 0.5 * Math.sin(e.timer * 3);
      const lift = opt.hover + Math.sin(e.timer * 2.4) * 0.25;
      if (e.body.vy < 2 && e.body.onGround || e.body.vy < 0) e.body.vy += (lift * 4 - e.body.vy) * Math.min(1, ctx.dt * 6);
    },
  };
}

/**
 */
export function leap(opt: { every: number; range: number; crouch: number; air: number; reach: number; damage: number }): Behaviour {
  return {
    name: 'leap',
    update(e, ctx) {
      const t = ctx.target(e);
      e.timer -= ctx.dt;
      if (e.state === 'air') {
        if (e.body.onGround && e.timer < opt.air - 0.1) {
          ctx.strike(e, { lead: 0, live: 0.25, damage: opt.damage, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 2.5, width: 0.5, height: 1.2 } });
          e.state = 'move'; e.timer = opt.every; e.pulse = 0;
          return;
        }
        if (e.timer <= 0) { e.state = 'move'; e.timer = opt.every; }
        return;
      }
      if (!t) { e.wishX = 0; e.wishZ = 0; e.pulse = 0; return; }
      const d = ctx.dist(e, t);
      if (e.state === 'crouch') {
        e.wishX = 0; e.wishZ = 0;
        e.pulse = 1 - e.timer / opt.crouch;
        if (e.timer <= 0) {
          const vx = e.aimX * d / opt.air, vz = e.aimZ * d / opt.air;
          e.body.vx = vx; e.body.vz = vz; e.body.vy = 13 * opt.air;
          e.state = 'air'; e.timer = opt.air; e.pulse = 0;
          ctx.cue(e, 'leap');
        }
        return;
      }
      if (e.timer <= 0 && d < opt.range) {
        const dx = t.x - e.body.x, dz = t.z - e.body.z, l = Math.hypot(dx, dz) || 1;
        e.aimX = dx / l; e.aimZ = dz / l;
        if (ctx.safe(e, t.x, t.y, t.z)) ctx.strike(e, { lead: opt.crouch, live: 0, damage: opt.damage, shape: { kind: 'ring', x: t.x, y: t.y, z: t.z, r: opt.reach, grow: 0, width: 0.4, height: 1.5 } });
        e.state = 'crouch'; e.timer = opt.crouch;
        return;
      }
      const [dx, dz] = ctx.toward(e, t);
      e.wishX = dx * 0.6; e.wishZ = dz * 0.6;
    },
  };
}

/**
 */
export function charge(opt: { aim: number; speed: number; run: number; stun: number; range: number; cooldown: number }): Behaviour {
  return {
    name: 'charge',
    update(e, ctx) {
      const t = ctx.target(e);
      e.timer -= ctx.dt;
      if (e.state === 'stun') {
        e.wishX = 0; e.wishZ = 0; e.pulse = 0;
        if (e.timer <= 0) { e.state = 'move'; e.timer = opt.cooldown; }
        return;
      }
      if (e.state === 'aim') {
        e.wishX = 0; e.wishZ = 0; e.pulse = 1 - e.timer / opt.aim;
        if (e.timer <= 0) {
          e.state = 'run'; e.timer = opt.run; e.pulse = 0;
          ctx.cue(e, 'sweep');
        }
        return;
      }
      if (e.state === 'run') {
        e.wishX = e.aimX * opt.speed / e.speed; e.wishZ = e.aimZ * opt.speed / e.speed;
        const stopped = Math.abs(e.body.vx) + Math.abs(e.body.vz) < 0.2 && e.timer < opt.run - 0.15;
        if (stopped || e.timer <= 0) { e.state = 'stun'; e.timer = stopped ? opt.stun : 0.2; e.wishX = 0; e.wishZ = 0; }
        return;
      }
      if (e.timer > 0 || !t) { e.wishX = 0; e.wishZ = 0; e.pulse = 0; return; }
      const dx = t.x - e.body.x, dz = t.z - e.body.z;
      const alongX = Math.abs(dx) >= Math.abs(dz);
      if ((Math.abs(dx) < 1 || Math.abs(dz) < 1) && Math.hypot(dx, dz) < opt.range) {
        e.aimX = alongX ? Math.sign(dx) : 0;
        e.aimZ = alongX ? 0 : Math.sign(dz);
        const len = alongX ? Math.abs(dx) : Math.abs(dz);
        ctx.strike(e, { lead: opt.aim, live: 0, damage: 0, shape: { kind: 'line', x0: e.body.x, z0: e.body.z, x1: e.body.x + e.aimX * len, z1: e.body.z + e.aimZ * len, y: e.body.y, width: 0.3 } });
        e.state = 'aim'; e.timer = opt.aim;
        return;
      }
      const [wx, wz] = ctx.toward(e, t);
      e.wishX = wx * 0.5; e.wishZ = wz * 0.5;
    },
  };
}

/**
 */
export function patrol(opt: { route: [number, number][]; reach: number; onCross(e: Enemy, ctx: EnemyCtx, waypoint: [number, number]): void }): Behaviour {
  return {
    name: 'patrol',
    update(e, ctx) {
      const you = ctx.near(e);
      const [cx, cz] = ctx.centre(e);
      const at = opt.route[e.seq % opt.route.length];
      if (you && Math.hypot(you.x - e.body.x, you.z - e.body.z) < opt.reach) { opt.onCross(e, ctx, at); return; }
      const dx = cx + at[0] - e.body.x, dz = cz + at[1] - e.body.z, l = Math.hypot(dx, dz);
      if (l < 0.6) e.seq++;
      e.wishX = l > 1e-3 ? dx / l * 0.7 : 0; e.wishZ = l > 1e-3 ? dz / l * 0.7 : 0;
      e.pulse = 0.2;
    },
  };
}

export function emitter(opt: { every: number; follow?: { speed: number; keep: number }; shot(e: Enemy, ctx: EnemyCtx): void }): Behaviour {
  return {
    name: 'emitter',
    update(e, ctx) {
      e.wishX = 0; e.wishZ = 0;
      if (opt.follow) {
        const t = ctx.target(e);
        if (t && ctx.dist(e, t) > opt.follow.keep) {
          const [dx, dz] = ctx.toward(e, t);
          e.wishX = dx * opt.follow.speed / e.speed; e.wishZ = dz * opt.follow.speed / e.speed;
        }
      }
      e.timer -= ctx.dt;
      e.pulse = Math.max(0, 1 - e.timer / opt.every) * 0.5;
      if (e.timer <= 0) { e.timer = opt.every; opt.shot(e, ctx); }
    },
  };
}

export function phase(opt: { hover: number; speed: number }): Behaviour {
  return {
    name: 'phase',
    update(e, ctx) {
      e.ghost = true;
      if (e.flyY < 0) e.flyY = e.body.y + opt.hover;
      const t = ctx.target(e);
      if (!t) { e.wishX = 0; e.wishZ = 0; return; }
      const [dx, dz] = ctx.toward(e, t);
      e.wishX = dx * opt.speed; e.wishZ = dz * opt.speed;
    },
  };
}

export const PHASE_HOLD = 2;

/**
 */
export function phased(opt: { phases: Behaviour[]; arena: string[] }): Behaviour {
  return {
    name: 'phased',
    update(e, ctx) {
      const share = e.hp / e.maxHp;
      const stage = share <= 1 / 3 ? 2 : share <= 2 / 3 ? 1 : 0;
      if (stage > e.stage) {
        e.stage = stage;
        e.hold = PHASE_HOLD;
        e.state = 'move'; e.timer = 0; e.seq = 0; e.armed = true;
        ctx.arena(e, opt.arena[stage - 1]);
        ctx.cue(e, 'phase');
        return;
      }
      opt.phases[e.stage].update(e, ctx);
    },
  };
}

/**
 */
export function sleep(opt: { wakeSpeed: number; then: Behaviour }): Behaviour {
  return {
    name: 'sleep',
    update(e, ctx) {
      if (e.tags.has('asleep')) {
        e.wishX = 0; e.wishZ = 0; e.pulse = 0.05;
        if (Math.hypot(e.body.vx, e.body.vz) > opt.wakeSpeed) { e.tags.delete('asleep'); ctx.cue(e, 'phase'); }
        return;
      }
      opt.then.update(e, ctx);
    },
  };
}

/**
 */
export function wobble(id: number, seq: number, k = 0): number {
  return hash3(id, seq, k, 0x2f);
}

export function chirp(opt: { every: number; base: Behaviour }): Behaviour {
  return {
    name: 'chirp',
    update(e, ctx) {
      opt.base.update(e, ctx);
      e.clock += ctx.dt;
      if (e.clock < opt.every) return;
      e.clock = 0;
      if (ctx.quiet(e)) ctx.cue(e, 'chirp');
    },
  };
}

export function wave(e: Enemy, ctx: EnemyCtx, seconds: number, height = 2.2, width = 0.7): void {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const forward = wobble(e.id, e.seq, 1) < 0.5;
  const from = forward ? x0 - 1.5 : x1 + 1.5, to = forward ? x1 + 1.5 : x0 - 1.5;
  ctx.strike(e, { lead: 1.2, live: seconds, damage: 8, shape: { kind: 'sweep', axis: 'x', from, to, speed: Math.abs(to - from) / seconds, across: [z0, z1], y: e.body.y, height, width } });
  e.seq++;
}
