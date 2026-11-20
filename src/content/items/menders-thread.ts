import { pal } from '../palette';
import { defineItem } from '../../items/types';

// The Mender's Thread (COVENANT.md; owner, #228, D10): the Covenant's Thread held as an inventory item, dropped by the
// Mender after a Give and picked up like any practice. Its only pool is 'covenant', which ItemPools never draws from, and
// it is promised (items/pool.ts `isPromised`): no capture, toll or other rule takes it. It has no recipe: a recipe would
// be a second source, and the Covenant's pieces have one source each. Its gold thread is repair, gold's reserved use
// (DECISIONS.md §14.4), the only light token in an icon whose concept is not light itself. Name and effect proposed by agent, pending the owner.
export default defineItem({
  id: 'menders-thread',
  name: "Mender's Thread",
  description: 'What broke was mended with gold, and the seam shows. It is stronger where it broke.',
  effect: '+1 heart container, and 0.25 s more invulnerability after each hit. Promised: no capture, toll or rule can take it from you.',
  inspiredBy: 'Kintsugi (the Japanese craft of mending pottery with gold)',
  pools: { covenant: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '........aaa.',
      '.......a..b.',
      '.......a.ab.',
      '......aab...',
      '.....ab...g.',
      '....ab...g..',
      '...ab...g...',
      '..ab...g....',
      '.ab...g.....',
      'ab...g......',
      '...gg.......',
      'egg.........',
    ],
    palette: { a: pal('bone.paper'), b: pal('bone.faded'), g: pal('light.gold'), e: pal('path.emotion.base') },
  },
  stats: [
    { stat: 'maxHearts', layer: 'add', value: 1 },
    { stat: 'invuln', layer: 'add', value: 0.25 },
  ],
});
