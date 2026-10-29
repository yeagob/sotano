import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'kindling',
  name: 'Kindling',
  description: 'Pain can light a warmth that answers it back.',
  effect: 'When a projection hurts you, fire bursts out of you: 2.5 blocks, 4 points to projections in it, and flammable blocks within 2 blocks catch fire.',
  inspiredBy: 'Kindling, the growing warmth of a fire (a nod to the kindling model in neuroscience)',
  pools: { treasure: 1 },
  tags: ['will', 'fire'],
  color: pal('path.will.glow'),
  quality: 2,
  icon: {
    rows: [
      '.....c......',
      '.....cc.....',
      '....ccc.....',
      '....ccdc....',
      '...ccddc....',
      '...cdddcc...',
      '...cdddcc...',
      '....cddc....',
      'aa..bccb..aa',
      '.aab....baa.',
      '...aabbaa...',
      '.baa....aab.',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('el.fire.base'), d: pal('el.fire.hi') },
  },
  hooks: [
    hook('actorDamage', (e, api) => {
      const at = api.actorAt(e.target);
      if (!at) return;
      api.pulse(at.x, at.y, at.z, 2.5, 4, 3, pal('el.fire.hi'), 'kindling');
      api.igniteArea(Math.floor(at.x), Math.floor(at.y), Math.floor(at.z), 2);
    }, { id: 'flare', priority: 200, target: 'player' }),
  ],
});
