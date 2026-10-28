import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'ahamoment',
  name: 'Aha Moment',
  description: 'The answer arrives all at once, and its flash jumps from one thought to the next.',
  effect: 'Intentions that hit a projection arc to the nearest other projection within 4 blocks, for half their damage, up to 2 times.',
  inspiredBy: 'Insight learning (Wolfgang Köhler, The Mentality of Apes, 1925)',
  pools: { treasure: 1 },
  tags: ['mind', 'electric'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '.........cc.',
      '........cddc',
      '......c.cddc',
      '......cc.cc.',
      '.bcc...c....',
      'bcddc.ccc...',
      'bcddcccc....',
      'abccb..c....',
      '.aab...cc...',
      '.......c.cc.',
      '........cddc',
      '.........cc.',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind !== 'actor') return;
      let x = e.x, y = e.y, z = e.z;
      const seen = [e.target];
      for (let k = 0; k < 2; k++) {
        const next = api.nearestProjection(x, y, z, 4, seen);
        if (!next) break;
        api.arc(x, y, z, next.id, e.intent.damage * 0.5, 'ahamoment', e.intent.polarity);
        seen.push(next.id);
        ({ x, y, z } = next);
      }
    }, { id: 'arc', priority: 200 }),
  ],
});
