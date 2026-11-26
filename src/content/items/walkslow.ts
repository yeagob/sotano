import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Walk Slowly (Camina Despacio, issue #340): crouched with the feet on the ground, the world runs at half speed. The rule is
// the `walkSlow` stat read by Game.simulate through game/time-scale.ts. The crouch is Child's Pose's (the `crouch` stat and
// action): this practice does not give it (owner, #364). Its only pool is 'unlock': an achievement lays it by id, no pool
// draws it. Docs: docs/design/built/practices/body/WALK-SLOWLY.md.
export default defineItem({
  id: 'walk-slow',
  name: 'Walk Slowly',
  description: 'Slowness is not falling behind: it is refusing the hurry. Bend low and stay close to the ground, and the rush of the world loosens around you until you can see every moving thing.',
  effect: "Crouched with your feet on the ground, the whole world runs at 50% speed: projections and their shots, your intentions, loose blocks, elements and your own body (a crouched walk goes at 22.5% of the walk). Standing up or leaving the ground ends it at once. The crouch is Child's Pose's: without it you cannot crouch.",
  inspiredBy: 'Santiago Dopazo: "The most revolutionary act you can carry out is to walk slowly"',
  pools: { unlock: 1 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 4,
  icon: {
    rows: [
      '.......c.c..',
      '......c.....',
      '.......bbb..',
      '......bbbbb.',
      '......bbbbb.',
      '.c.c...bbb..',
      'c......bbb..',
      '.bbb...ddd..',
      'bbbbb.......',
      'bbbbb.......',
      '.bbb........',
      '.ddd........',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'walkSlow', layer: 'add', value: 1 }],
});
