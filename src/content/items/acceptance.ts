import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'acceptance',
  name: 'Radical Acceptance',
  description: 'Stop fighting what already happened: your own breakthroughs no longer hurt you.',
  effect: 'Your own bomb and thrown-block explosions no longer damage you.',
  inspiredBy: 'Radical acceptance (Dialectical Behaviour Therapy)',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.....aa.....',
      '....abba....',
      '.a..abba..a.',
      '.aa.abba.aa.',
      '.aba.aa.aba.',
      '..abaaaaba..',
      '...abbbba...',
      '....aaaa....',
      '..cccccccc..',
      '............',
      '............',
    ],
    palette: { a: pal('path.mind.glow'), b: pal('limestone.hi'), c: pal('path.body.dark') },
  },
  hooks: [
    hook('actorDamage', (e, api) => {
      if (api.isPlayer(e.owner) && e.kind === 'explosion') e.cancel();
    }, { id: 'no-self-harm', priority: 100, target: 'player' }),
  ],
});
