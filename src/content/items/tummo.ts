import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Tag on an intention that burns (set by Inner Fire; read by any item that wants burning shots). */
export const BURNING = 'burning';
/** Fire damage the player takes from a flame, as a share of the damage before it. */
const WARM_SHARE = 0.5;
/** Extra fire damage a negative intention deals to every projection in a small sphere where it hits. */
const BURN_DAMAGE = 1.5;

export default defineItem({
  id: 'tummo',
  name: 'Inner Fire',
  description: 'A heat kindled from within, enough to dry wet cloth in the snow.',
  effect: 'Negative intentions burn: they set flammable blocks within 1 block on fire and deal +1.5 fire damage to projections. Fire hurts you half as much.',
  inspiredBy: 'Tummo, the Tibetan inner-heat meditation',
  pools: { treasure: 1 },
  tags: ['body', 'fire', 'intent'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '.....c......',
      '....ccc.....',
      '....cdc.....',
      '...cdddc....',
      '...cdddc....',
      '..cdddddc...',
      '..cdddddc...',
      '...cdddc....',
      '....bbb.....',
      '...bbbbb....',
      '..aabbbaa...',
      '..aaaaaaa...',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.base'), c: pal('el.fire.base'), d: pal('el.fire.hi') },
  },
  hooks: [
    hook('fire', e => {
      e.intent.tags.add(BURNING);
      e.intent.color = pal('el.fire.hi');
    }, { id: 'kindle', priority: 20 }),
    // Positive intentions only mend (BESTIARY polarity), so a positive shot neither ignites nor hurts.
    hook('intentHit', (e, api) => {
      if (!e.intent.tags.has(BURNING) || e.intent.polarity !== 'negative') return;
      if (e.kind === 'block') {
        // the hit point sits on the face the shot came from: step half a block back into the block
        api.igniteArea(Math.floor(e.x - 0.5 * e.nx), Math.floor(e.y - 0.5 * e.ny), Math.floor(e.z - 0.5 * e.nz), 1);
      } else if (e.kind === 'actor') {
        const at = api.actorAt(e.target);
        if (at) api.pulse(at.x, at.y, at.z, 0.6, BURN_DAMAGE, 0, pal('el.fire.hi'), 'tummo');
      }
    }, { id: 'burn', priority: 200 }),
    hook('actorDamage', e => {
      if (e.kind === 'fire' && e.source === 'fire') e.amount *= WARM_SHARE;
    }, { id: 'warm', priority: 20, target: 'player' }),
  ],
});
