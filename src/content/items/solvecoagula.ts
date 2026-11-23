import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Most cells one conversion turns (a whole pool of the rooms' size fits; see docs/design/built/practices/milagros). */
const CAP = 256;
const SOURCE = 'solvecoagula';

export default defineItem({
  id: 'solvecoagula',
  name: 'Solve et Coagula',
  description: 'The old alchemists loosened what had hardened and hardened what had loosened: the same work, run in both directions. Where your intention meets water or lava, the work can run.',
  effect: 'A positive intention that touches lava turns the connected lava (up to 256 cells) into water. A negative one turns connected water into lava, never water you stand in.',
  inspiredBy: 'The alchemical formula solve et coagula (dissolve and coagulate), an old image of transformation',
  pools: { treasure: 1, vault: 1 },
  tags: ['milagros', 'miracle', 'intent', 'element'],
  color: pal('path.milagros.glow'),
  quality: 3,
  icon: {
    // an hourglass of two triangles: water above (dissolve), lava below (coagulate)
    rows: [
      '............',
      '.aaaaaaaaaa.',
      '.abbbbbbbba.',
      '..abbbbbba..',
      '...abbbba...',
      '....abba....',
      '.....aa.....',
      '....acca....',
      '...acccca...',
      '..acccccca..',
      '.acccccccca.',
      '.aaaaaaaaaa.',
    ],
    palette: { a: pal('bone.paper'), b: pal('el.water.surface'), c: pal('el.lava.hot') },
  },
  // when your intention enters water or lava (once per entry): a negative one turns the connected water to lava, a
  // positive one turns the connected lava to water. The intention keeps flying; it is read again after the change.
  messages: { refused: 'Not here: the lava would reach you.' },
  hooks: [
    hook('intentElement', (e, api) => {
      if (e.element === 'lava' && e.intent.polarity === 'positive') {
        api.convertFluid(e.x, e.y, e.z, 'lava', 'water', CAP, SOURCE);
      } else if (e.element === 'water' && e.intent.polarity === 'negative') {
        if (api.convertFluid(e.x, e.y, e.z, 'water', 'lava', CAP, SOURCE) < 0) api.toast('refused');
      }
    }, { id: 'transmute', priority: 200 }),
  ],
});
