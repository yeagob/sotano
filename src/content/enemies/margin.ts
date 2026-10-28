import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const note = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  ctx.strike(e, { lead: 0.5, live: 8, damage: 0, shape: { kind: 'field', x: t.x, y: t.y, z: t.z, r: 1.2, effect: 'slow' } });
  ctx.shootAt(e, t.x, t.y, t.z);
};

export default defineEnemy({
  id: 'margin',
  name: 'The Margin',
  pattern: 'And another thing…',
  hp: 28,
  speed: 0,
  size: [0.3, 1.9],
  contactDamage: 0,
  cost: 2,
  minFloor: 3,
  maxFloor: 6,
  drops: { heart: 0.08, key: 0.05 },
  elements: { water: { path: 'avoid' } },
  behaviour: emitter({ every: 3, shot: note }),
  model: [
    { size: [8 * TX, 28 * TX, 3 * TX], pos: [0, 14 * TX, 0], color: pal('paper.base'), name: 'body' },
    { size: [8 * TX, 2 * TX, 3 * TX], pos: [0, 29 * TX, 0], color: pal('paper.hi') },
    { size: [2 * TX, 26 * TX, TX / 2], pos: [5 * TX, 14 * TX, 1.75 * TX], color: pal('ink.line') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-1 * TX, 22 * TX, 1.75 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 22.5 * TX, 2 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
