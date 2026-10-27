import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'lionsmane',
  name: "Lion's Mane",
  description: 'A shaggy mushroom that grows on old wood, where nobody looks. Eat it and you feel bigger than the room: the ceiling was never the limit.',
  effect: 'Jump height ×2. Jumping into dirt, crates, stone or brick (tier 1 or lower) breaks them with your head.',
  inspiredBy: "Lion's mane mushroom (Hericium erinaceus); a nod to the platformers that taught a generation to jump",
  pools: { treasure: 1, boss: 2 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '....aaaa....',
      '..aaaaaaaa..',
      '.aadaaaadaa.',
      'aaaaaaaaaaaa',
      'aaaaadaaaaaa',
      'bbbbbbbbbbbb',
      'b.b.cbbc.b.b',
      '....cbbc....',
      '....cbbc....',
      '....cbbc....',
      '...cbbbbc...',
      '...cccccc...',
    ],
    palette: { a: pal('bone.paper'), b: pal('bone.faded'), c: pal('rock.f1.dark'), d: pal('path.body.base') },
  },
  stats: [
    { stat: 'jump', layer: 'mul', value: 2 },
    { stat: 'headbutt', layer: 'add', value: 2 },
  ],
  // a wink, now and then, when a ceiling gives way
  messages: { castle: 'Thank you! But your ceiling is in another castle.' },
  hooks: [
    hook('headBump', (e, api) => {
      if (e.breaks && api.rng().chance(0.2)) api.toast('castle');
    }, { id: 'wink', priority: 200 }),
  ],
});
