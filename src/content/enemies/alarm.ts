import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const RADIUS = 2.2, LINK = 4, FUSE = 0.9, RUSH = 1.6, TRIGGER = 2.2;
const KIN = ['alarm', 'panic'];

const alarm: Behaviour = {
  name: 'alarm',
  update(e: Enemy, ctx: EnemyCtx) {
    if (e.state === 'swell') {
      e.wishX = 0; e.wishZ = 0;
      e.timer -= ctx.dt;
      e.pulse = Math.min(1, Math.ceil((1 - e.timer / FUSE) * 3) / 3);
      for (const k of ctx.others(e, LINK, KIN)) if (k.state !== 'swell') { k.state = 'swell'; k.timer = 0.4; }
      if (e.timer <= 0) { ctx.burst(e, RADIUS); ctx.kill(e); }
      return;
    }
    const t = ctx.target(e);
    e.timer += ctx.dt;
    e.pulse = 0.15 + 0.15 * Math.sin(e.timer * 11);
    if (!t) { e.wishX = 0; e.wishZ = 0; return; }
    const [dx, dz] = ctx.toward(e, t);
    e.wishX = dx * RUSH; e.wishZ = dz * RUSH;
    if (ctx.dist(e, t) < TRIGGER) { e.state = 'swell'; e.timer = FUSE; }
  },
};

export default defineEnemy({
  id: 'alarm',
  name: 'Alarm',
  pattern: 'Everyone, something is wrong!',
  hp: 14,
  speed: 2.4,
  size: [0.38, 0.9],
  contactDamage: 0,
  cost: 2,
  minFloor: 3,
  maxFloor: 6,
  drops: { bomb: 0.25, heart: 0.05 },
  elements: {
    water: { speed: 0.5, path: 'cross', enter: e => { e.state = 'calm'; e.timer = 2.5; e.pulse = 0; } },
    fire: { path: 'avoid', enter: e => { if (e.state !== 'swell') { e.state = 'swell'; e.timer = 0.3; } } },
    lava: { path: 'avoid', enter: e => { if (e.state !== 'swell') { e.state = 'swell'; e.timer = 0.3; } } },
  },
  behaviour: alarm,
  model: [
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [0, 8 * TX, 0], color: pal('husk.panic.base'), name: 'body' },
    { size: [10 * TX, TX, 10 * TX], pos: [0, 13.5 * TX, 0], color: pal('cold.rim') },
    { size: [TX, 4 * TX, TX / 2], pos: [3.5 * TX, 9 * TX, 5.25 * TX], color: pal('captive.smoulder'), glow: true, name: 'core' },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-2 * TX, 9.5 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [3 * TX, 9.5 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 9.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'eye' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [3 * TX, 9.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'eye' },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [-6 * TX, 15 * TX, 0], color: pal('husk.panic.hi'), rot: [0, 0, 0.52] },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [6 * TX, 15 * TX, 0], color: pal('husk.panic.hi'), rot: [0, 0, -0.52] },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [-4 * TX, 1.5 * TX, 4 * TX], color: pal('husk.panic.dark') },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [4 * TX, 1.5 * TX, 4 * TX], color: pal('husk.panic.dark') },
  ],
});
