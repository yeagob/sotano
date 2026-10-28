import { pal } from '../palette';
import { emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'downpour',
  kind: 'boss',
  name: 'The Downpour',
  pattern: 'To be left alone',
  hp: 140,
  speed: 0,
  size: [1.4, 1.2],
  contactDamage: 8,
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  behaviour: phased({
    arena: ['lower', 'thin'],
    phases: [
      emitter({
        every: 1.5,
        shot: (e, ctx) => {
          const t = ctx.target(e);
          if (!t) return;
          if (e.flyY < 0) e.flyY = e.body.y + 3.5;
          for (let k = 0; k < 3; k++) {
            const a = wobble(e.id, e.seq, k) * Math.PI * 2, r = 1 + wobble(e.id, e.seq, k + 3) * 2.5;
            ctx.shootAt(e, t.x + Math.cos(a) * r, t.y + 1, t.z + Math.sin(a) * r);
          }
          e.seq++;
        },
      }),
      emitter({
        every: 1.5,
        shot: (e, ctx) => {
          const t = ctx.target(e);
          if (!t) return;
          if (e.flyY > e.body.y + 1.3) e.flyY -= 0.7;
          ctx.shootAt(e, t.x, t.y + 1, t.z);
        },
      }),
      emitter({
        every: 3,
        shot: (e, ctx) => {
          const a = wobble(e.id, e.seq, 2) * Math.PI * 2, r = 2 + wobble(e.id, e.seq, 4) * 3;
          ctx.strike(e, { lead: 1, live: 2.5, damage: 2, shape: { kind: 'field', x: e.body.x + Math.cos(a) * r, y: e.body.y, z: e.body.z + Math.sin(a) * r, r: 1.6, effect: 'sting' } });
          e.seq++;
        },
      }),
    ],
  }),
  model: [
    { size: [30 * TX, 6 * TX, 30 * TX], pos: [0, 26 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [30 * TX, 2 * TX, 30 * TX], pos: [0, 29 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-4 * TX, 22 * TX, 15.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [4 * TX, 22 * TX, 15.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-4 * TX, 22.5 * TX, 15.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [4 * TX, 22.5 * TX, 15.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
