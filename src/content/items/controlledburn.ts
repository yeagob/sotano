import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

// A forest burns a little on purpose so it never burns all at once. The fire of your own blasts is
// set and kept small: it lights the dry blocks around the blast, burns projections, and is shielded
// for the player near the blast (see Game.shieldFire). Positive (love) blasts set nothing alight.
export default defineItem({
  id: 'controlledburn',
  name: 'Controlled Burn',
  description: 'The forest burns a little on purpose, so it never burns all at once. A small fire that you light yourself, where you can stand near it, clears what would otherwise catch later.',
  effect: 'Your bomb blasts set flammable blocks in their radius on fire and burn projections for +4 damage. The fire never hurts you within 4 blocks of a blast, for 8 seconds.',
  inspiredBy: 'Controlled burns in forest management',
  pools: { treasure: 1 },
  tags: ['will', 'explosive', 'bomb', 'fire'],
  color: pal('path.will.glow'),
  quality: 2,
  icon: {
    rows: [
      '.....b......',
      '.....bb.....',
      '....bbcb....',
      '....bbcbb...',
      '...bbcccbb..',
      '...bcccccb..',
      '..bbcccccbb.',
      '..bbccccbbb.',
      '.bbbcccbbbb.',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow') },
  },
  hooks: [
    hook('bombBlast', (e, api) => {
      // a love explosion sets nothing alight
      if (e.polarity !== 'negative' || e.acted.has('controlledburn')) return;
      e.acted.add('controlledburn');
      const { x, y, z, radius } = e;
      api.shieldFire(x, y, z, radius + 4, 8);
      // igniting and burning run at the end of the frame: a bomb caught in the fire goes off as its own blast
      api.defer(() => {
        api.igniteArea(Math.floor(x), Math.floor(y), Math.floor(z), radius);
        api.pulse(x, y, z, radius, 4, 0, pal('el.fire.hi'), 'controlledburn');
      });
    }, { id: 'burn', priority: 200 }),
  ],
});
