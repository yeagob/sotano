import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Owner decisions of issue #89 (docs/design/built/practices/milagros/DR-LAUNCHER.md): tier 3, path
// Miracles, the name is the owner's. The missile itself is core behaviour behind the `missile` stat
// (game/game.ts `launchMissile`), so other practices can grant it or change it through `missileLaunch`.
export default defineItem({
  id: 'drlauncher',
  name: 'Dr. Launcher',
  description: 'There is nothing impossible: a limit is only the edge of what you have tried. The bomb you carry flies where you look.',
  effect: 'Double-tap fire (within 0.3 s) launches a bomb as a missile: straight, up to 24 blocks/s, exploding on the first thing it meets or after 40 blocks. Negative: a bomb blast, which can hurt you. Positive: a love blast that mends blocks. Refused, no bomb spent, if a block is within 2.',
  inspiredBy: 'Transcending limits (Santiago Dopazo)',
  pools: { treasure: 1 },
  tags: ['milagros', 'explosive'],
  causes: ['missile'],
  color: pal('path.milagros.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '........bb..',
      '......bbcba.',
      '.....bbcbba.',
      '....bbbcbaa.',
      '....bbcbbaa.',
      '.....bcbaa..',
      '..cc..baa...',
      '.cddc.......',
      '.cdc........',
      '.c..........',
      '............',
    ],
    palette: { a: pal('path.milagros.dark'), b: pal('path.milagros.base'), c: pal('path.milagros.glow'), d: pal('bone.paper') },
  },
  stats: [{ stat: 'missile', layer: 'add', value: 1 }],
});
