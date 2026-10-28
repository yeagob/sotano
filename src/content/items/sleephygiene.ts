import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'sleephygiene',
  name: 'Sleep Hygiene',
  description: 'Rest is not lost time: it is where the body rebuilds what the day wore down.',
  effect: '+1 heart container, and invulnerability after a hit lasts 0.5 s longer.',
  inspiredBy: 'Sleep hygiene (cognitive behavioural therapy for insomnia)',
  pools: { treasure: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '......c.....',
      '.......cc...',
      '.......bc...',
      '.......bba..',
      '.......bba..',
      '......bbba..',
      'c....bbbba..',
      '.cbbbbbba...',
      '.ccbbbbaa...',
      '...aaaa...d.',
      '.........d.d',
      '..........d.',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('bone.paper') },
  },
  stats: [{ stat: 'maxHearts', layer: 'add', value: 1 }, { stat: 'invuln', layer: 'add', value: 0.5 }],
});
