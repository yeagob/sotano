import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Seconds between two warmths while you stand in fire. */
const WARM_EVERY = 3;
/** Damage points healed per warmth: a quarter heart. */
const WARM_POINTS = 2;
/** Most damage points healed per room: one heart. */
const WARM_ROOM_CAP = 8;
/** Healing takes half-hearts (ItemApi.heal). */
const WARM_HALF_HEARTS = WARM_POINTS / 4;

export default defineItem({
  id: 'firewalking',
  name: 'Firewalking',
  description: 'Walking the coals is walking through fear: the fire was never the thing you were afraid of.',
  effect: 'Fire never hurts you. Standing in fire heals a quarter heart every 3 seconds (up to 1 heart per room). Lava still burns.',
  inspiredBy: 'Firewalking rituals (e.g. the Anastenaria of Greece and Bulgaria)',
  pools: { treasure: 1 },
  tags: ['will', 'fire'],
  color: pal('path.will.glow'),
  quality: 2,
  icon: {
    rows: [
      '....aaaa....',
      '....abba....',
      '....abba....',
      '....abba....',
      '...abbbba...',
      '...abbbba...',
      '..aabbbbaa..',
      '.ddcdcdcdd..',
      'cddcddcddcdc',
      '.dcdddddcd..',
      '..cccccc....',
      '............',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('el.fire.base'), d: pal('el.fire.hi') },
  },
  hooks: [
    // Fire-cause damage to the player is cancelled every frame the player touches fire (the cancel
    // sets no invulnerability, so the event repeats each frame): that frame is the touch. Lava is not.
    hook('actorDamage', (e, api) => {
      if (!(e.kind === 'fire' && e.source === 'fire')) return;
      e.cancel();
      const m = api.memory(), t = api.time(), c = api.counts();
      if (c.hp >= c.maxHp || t < (m.next ?? 0) || (m.room ?? 0) >= WARM_ROOM_CAP) return;
      m.next = t + WARM_EVERY;
      m.room = (m.room ?? 0) + WARM_POINTS;
      api.heal(WARM_HALF_HEARTS);
    }, { id: 'ward', priority: 100, target: 'player' }),
    hook('roomEnter', (_e, api) => { api.memory().room = 0; }, { id: 'reset', priority: 200 }),
  ],
});
