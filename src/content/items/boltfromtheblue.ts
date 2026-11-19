import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

// Insight strikes all at once and lights everything around it: when your bomb goes off, lightning
// finds the nearest projections around the blast and arcs to them, with the blast's own polarity.
export default defineItem({
  id: 'boltfromtheblue',
  name: 'Bolt from the Blue',
  description: 'Insight does not come in small steps. It strikes all at once, and everything near it is lit up.',
  effect: 'Your bomb blasts arc lightning to up to 3 projections within 3 blocks of the blast\'s edge, 6 damage each.',
  inspiredBy: 'The sudden flash of insight (the \'aha\' of Gestalt psychology)',
  pools: { treasure: 1 },
  tags: ['mind', 'explosive', 'bomb', 'lightning'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '........bbb.',
      '.......bbc..',
      '......bbc...',
      '....bbbbbb..',
      '.....bcc....',
      '.......bc...',
      '......bc....',
      '.....bc.....',
      '....bc......',
      '...bc.......',
      '..d.........',
      '............',
    ],
    palette: { b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('bombBlast', (e, api) => {
      if (e.acted.has('boltfromtheblue')) return;
      e.acted.add('boltfromtheblue');
      const { x, y, z, radius, polarity } = e;
      // the arcs run at the end of the frame, outside the blast that set them off
      api.defer(() => {
        const hit: number[] = [];
        for (let n = 0; n < 3; n++) {
          const t = api.nearestProjection(x, y, z, radius + 3, hit);
          if (!t) break;
          hit.push(t.id);
          api.arc(x, y, z, t.id, 6, 'boltfromtheblue', polarity);
        }
      });
    }, { id: 'arc', priority: 200 }),
  ],
});
