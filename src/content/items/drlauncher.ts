import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Owner decisions of issue #89 (docs/design/built/practices/milagros/DR-LAUNCHER.md): tier 3, path
// Milagros, the name is the owner's. The missile itself is core behaviour behind the `missile` stat
// (game/game.ts `launchMissile`), so other practices can grant it or change it through `missileLaunch`.
export default defineItem({
  id: 'drlauncher',
  name: 'Dr. Launcher',
  description: 'There is nothing impossible: a limit is only the edge of what you have tried. The breakthrough you carry no longer falls under its own weight; it keeps its line and flies to where you look.',
  effect: 'A quick double tap of the fire control (within 0.3 s) launches one bomb as a missile instead of an intention: it flies straight, speeds up to 24 blocks/s and explodes on the first thing it meets, or after 40 blocks, with your bomb\'s blast. Negative: a bomb blast, which can hurt you too. Positive: a love explosion that mends blocks, heals allies, warms projections toward your side and grows creatures. Refused, with no bomb spent, when a block is within 2 blocks.',
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
