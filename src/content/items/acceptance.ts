import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'acceptance',
  name: 'Radical Acceptance',
  description: 'Stop fighting what already happened: your own breakthroughs no longer hurt you.',
  effect: 'Your own bomb and thrown-block explosions no longer damage you.',
  inspiredBy: 'Radical acceptance (Dialectical Behaviour Therapy)',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: 0xe88fb5,
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
    palette: { a: 0xe88fb5, b: 0xfbd3e4, c: 0x3a8a5a },
  },
  hooks: [
    hook('actorDamage', (e, api) => {
      if (api.isPlayer(e.owner) && e.kind === 'explosion') e.cancel();
    }, { id: 'no-self-harm', priority: 100, target: 'player' }),
  ],
});
