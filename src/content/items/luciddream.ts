import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';
import { PHASE_CAP, PHASE_SECONDS, PHASE_STATUS } from '../../game/phase';

// Lucid Dream (docs/design/built/practices/MIRACLES.md, miracle #122): a bomb, a key or a heart that is collected
// starts a phase; the body passes through blocks with finite hp for the time it lasts. The rules that move the body
// are in game/phase.ts and the game's simulation; this item only starts the timer.
export default defineItem({
  id: 'luciddream',
  name: 'Lucid Dream',
  description: 'In a lucid dream you know the walls are made of you. Pick up a bomb, a key or a heart and, for a few seconds, you walk through what holds you.',
  effect: 'Picking up a bomb, key or heart lets you walk through blocks for 3 seconds (more pickups add time, up to 6). Unbreakable blocks stay solid. You always come out in free space.',
  inspiredBy: 'Lucid dreaming (Frederik van Eeden, 1913)',
  pools: { vault: 1, boss: 0.5 },
  tags: ['mind', 'miracle', 'movement'],
  color: pal('path.mind.glow'),
  quality: 4,
  icon: {
    rows: [
      '.aaaaaaaaaa.',
      'abbbbbbbbbba',
      'abcc....ccba',
      'abc......cba',
      'ab...dd...ba',
      'ab..dddd..ba',
      'ab...dd...ba',
      'abc......cba',
      'abcc....ccba',
      'abbbbbbbbbba',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('bone.dim'), b: pal('bone.faded'), c: pal('path.mind.dark'), d: pal('path.mind.glow') },
  },
  hooks: [
    // the phase starts only when the pickup is actually collected: after every hook that could cancel it (priority 200)
    hook('pickupCollect', (e, api) => {
      if (e.cancelled || e.amount <= 0) return;
      api.grantStatus(PHASE_STATUS, PHASE_SECONDS, { add: true, cap: PHASE_CAP });
    }, { id: 'phase', priority: 200 }),
  ],
});
