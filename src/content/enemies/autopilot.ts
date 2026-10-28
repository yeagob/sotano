import { pal } from '../palette';
import { distanceToSegment } from '../../enemies/attacks';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const ROUTE: [number, number][] = [[-4, -3], [4, -3], [4, 3], [-4, 3]];

const loop: Behaviour = {
  name: 'loop',
  update(e: Enemy, ctx: EnemyCtx) {
    const [cx, cz] = ctx.centre(e);
    const at = (k: number): [number, number] => [cx + ROUTE[k % 4][0], cz + ROUTE[k % 4][1]];
    e.timer -= ctx.dt;
    if (e.state === 'aim') {
      e.wishX = 0; e.wishZ = 0; e.pulse = 1 - e.timer / 0.7;
      if (e.timer <= 0) { e.state = 'run'; ctx.cue(e, 'sweep'); }
      return;
    }
    if (e.state === 'run') {
      e.wishX = e.aimX * 4.2 / e.speed; e.wishZ = e.aimZ * 4.2 / e.speed;
      const [nx, nz] = at(e.seq + 1);
      const stopped = Math.abs(e.body.vx) + Math.abs(e.body.vz) < 0.15 && e.timer < 1.2;
      if (Math.hypot(nx - e.body.x, nz - e.body.z) < 0.9 || stopped || e.timer <= 0) {
        e.state = 'move'; e.seq += stopped ? 0 : 1; e.timer = stopped ? 1 : 0; e.pulse = 0;
      }
      return;
    }
    if (e.state === 'stun') {
      e.wishX = 0; e.wishZ = 0;
      if (e.timer <= 0) e.state = 'move';
      return;
    }
    const [tx, tz] = at(e.seq), [nx, nz] = at(e.seq + 1);
    const you = ctx.near(e);
    if (you && distanceToSegment(you.x, you.z, tx, tz, nx, nz) < 1.6) {
      const dx = nx - tx, dz = nz - tz, l = Math.hypot(dx, dz);
      e.aimX = dx / l; e.aimZ = dz / l;
      e.state = 'aim'; e.timer = 0.7;
      ctx.strike(e, { lead: 0, live: 0.7, damage: 0, shape: { kind: 'line', x0: tx, z0: tz, x1: nx, z1: nz, y: e.body.y, width: 0.3 } });
      e.wishX = 0; e.wishZ = 0;
      return;
    }
    const dx = tx - e.body.x, dz = tz - e.body.z, l = Math.hypot(dx, dz);
    if (l < 0.6) e.seq++;
    e.wishX = l > 1e-3 ? dx / l * 0.8 : 0; e.wishZ = l > 1e-3 ? dz / l * 0.8 : 0;
    e.pulse = 0.15;
  },
};

export default defineEnemy({
  id: 'autopilot',
  name: 'Autopilot',
  pattern: 'Living by routine',
  hp: 10,
  speed: 0.8,
  size: [0.34, 1.2],
  contactDamage: 4,
  cost: 2,
  minFloor: 1,
  maxFloor: 2,
  drops: { heart: 0.08, bomb: 0.06 },
  breaks: { tier: 0, power: 4 },
  behaviour: loop,
  model: [
    { size: [10 * TX, 6 * TX, 10 * TX], pos: [0, 10 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, TX, 10 * TX], pos: [0, 13.5 * TX, 0], color: pal('cold.rim') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 11 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 11 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [10 * TX, TX / 2, 10 * TX], pos: [0, 1 * TX, 0], color: pal('cold.dim') },
  ],
});
