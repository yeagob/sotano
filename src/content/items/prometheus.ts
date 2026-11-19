import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Tag on a fire seed: one intention in five carries it, and it bursts on impact. */
export const FIRE_SEED = 'fireSeed';
/** Share of intentions that are fire seeds. */
const SEED_CHANCE = 0.2;
/** A fire seed is this much bigger (its look, and the target it hits). */
const SEED_SIZE = 1.4;
const BURST_RADIUS = 1.6;
const BURST_DAMAGE = 5;
const BURST_FIRE_RADIUS = 1.5;

export default defineItem({
  id: 'prometheus',
  name: 'Stolen Fire',
  description: 'Fire carried to others is never lost by the one who gives it.',
  effect: 'One intention in five (20%) is a fire seed. A negative seed bursts on impact (1.6 blocks, 5 damage) and sets flammable blocks within 1.5 blocks on fire. The burst never hurts you.',
  inspiredBy: 'The myth of Prometheus (Hesiod, Aeschylus)',
  pools: { treasure: 1 },
  tags: ['emotion', 'fire', 'intent'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '.....d......',
      '....ddd.....',
      '....cdc.....',
      '...cdddc....',
      '...cdddc....',
      '....cdc.....',
      '.....b......',
      '.....b......',
      '....bbb.....',
      '....bbb.....',
      '....aaa.....',
      '....aaa.....',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('el.fire.base'), d: pal('el.fire.hi') },
  },
  hooks: [
    hook('fire', (e, api) => {
      if (api.rng().chance(SEED_CHANCE)) {
        e.intent.tags.add(FIRE_SEED);
        e.intent.radius *= SEED_SIZE;
      }
    }, { id: 'seed', priority: 30 }),
    // The burst is damage to projections and fire on blocks only: the player is never in its reach.
    // A positive seed stays a seed (positive intentions only mend, so it does not burst).
    hook('intentHit', (e, api) => {
      if (!e.intent.tags.has(FIRE_SEED) || e.intent.polarity !== 'negative') return;
      if (e.kind === 'block') {
        const x = Math.floor(e.x - 0.5 * e.nx), y = Math.floor(e.y - 0.5 * e.ny), z = Math.floor(e.z - 0.5 * e.nz);
        api.igniteArea(x, y, z, BURST_FIRE_RADIUS);
        api.pulse(e.x, e.y, e.z, BURST_RADIUS, BURST_DAMAGE, 0, pal('el.fire.hi'), 'prometheus');
      } else if (e.kind === 'actor') {
        const at = api.actorAt(e.target);
        if (!at) return;
        api.igniteArea(Math.floor(at.x), Math.floor(at.y), Math.floor(at.z), BURST_FIRE_RADIUS);
        api.pulse(at.x, at.y, at.z, BURST_RADIUS, BURST_DAMAGE, 0, pal('el.fire.hi'), 'prometheus');
      } else {
        api.igniteArea(Math.floor(e.x), Math.floor(e.y), Math.floor(e.z), BURST_FIRE_RADIUS);
        api.pulse(e.x, e.y, e.z, BURST_RADIUS, BURST_DAMAGE, 0, pal('el.fire.hi'), 'prometheus');
      }
    }, { id: 'burst', priority: 200 }),
  ],
});
