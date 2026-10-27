import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'thinkwaitfast',
  name: 'Thinking, Waiting, Fasting',
  description: 'Three quiet skills: intentions reach further, you recover longer after a hit, and luck finds you.',
  effect: 'Range ×1.25. +0.6 s of invulnerability after being hit. Luck +1.',
  inspiredBy: 'Siddhartha (Hermann Hesse): "I can think, I can wait, I can fast"',
  pools: { treasure: 1 },
  tags: ['mind', 'will'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '............',
      'a..a..a..a..',
      '.aa.aa.aa.aa',
      '............',
      '.b..b..b..b.',
      'b.bb.bb.bb.b',
      '............',
      'cc..cc..cc..',
      '..cc..cc..cc',
      '............',
      '............',
    ],
    palette: { a: pal('bone.paper'), b: pal('iron.hi'), c: pal('rock.f2.hi') },
  },
  stats: [
    { stat: 'range', layer: 'mul', value: 1.25 },
    { stat: 'invuln', layer: 'add', value: 0.6 },
    { stat: 'luck', layer: 'add', value: 1 },
  ],
});
