import { pal } from '../palette';
import { chase, wave } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const swim = chase({});

const surge: Behaviour = {
  name: 'surge',
  update(e: Enemy, ctx: EnemyCtx) {
    swim.update(e, ctx);
    e.clock += ctx.dt;
    if (e.clock >= 4) { e.clock = 0; wave(e, ctx, 2.4, 1.2, 0.8); }
  },
};

export default defineEnemy({
  id: 'undertow',
  name: 'Undertow',
  pattern: 'It is too much',
  hp: 14,
  speed: 0.7,
  size: [0.5, 0.6],
  contactDamage: 4,
  cost: 2,
  minFloor: 3,
  maxFloor: 4,
  drops: { heart: 0.08 },
  elements: { water: { path: 'dwell', speed: 1.5 } },
  behaviour: surge,
  model: [
    { size: [14 * TX, 8 * TX, 8 * TX], pos: [0, 4 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [14 * TX, 3 * TX, 8 * TX], pos: [0, 9.5 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [4 * TX, 3 * TX, TX / 2], pos: [-3 * TX, 6 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 3 * TX, TX / 2], pos: [3 * TX, 6 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-3 * TX, 6 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [3 * TX, 6 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
