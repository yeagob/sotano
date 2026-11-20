import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';
import { KAIROS_CHARGES } from '../../game/kairos';

// The charge is this practice's scratch memory (ItemApi.memory): it lives while the practice is held,
// survives inventory rebuilds and is never saved. The game reads it (Inventory.memoryFor) and empties
// it on release (Game.releaseKairos).
const CHARGE = 'charge';

function fill(api: { memory(): Record<string, number> }, to: number) {
  const m = api.memory();
  m[CHARGE] = Math.max(m[CHARGE] ?? 0, Math.min(KAIROS_CHARGES, to));
}

export default defineItem({
  id: 'kairos',
  name: 'Kairos',
  description: 'The right moment is not counted on the clock. When it comes, you stop the clock and choose where your intentions land.',
  effect: 'Clear 3 rooms to charge (starts charged). Press {miracle} to stop time; mark up to five places with {cast}; press {miracle} again to fire five intentions at once, one at each mark, piercing.',
  inspiredBy: 'Kairos, the Greek idea of the opportune moment',
  pools: { vault: 1, boss: 0.5 },
  messages: {
    notReady: 'The moment has {n} of {max} charges. Clear rooms to fill it.',
    started: 'Time stops. {cast} marks places; press {miracle} again to release.',
    marksFull: 'Five marks is all the moment holds.',
    released: 'Time runs again: five intentions, one at each mark.',
  },
  tags: ['milagros', 'miracle', 'intent'],
  color: pal('path.milagros.glow'),
  quality: 4,
  icon: {
    rows: [
      '....cccc....',
      '..cc....cc..',
      '.c..bb....c.',
      '.c..bb..b.c.',
      'c....bb..b.c',
      'c....bbbb..c',
      'c...........',
      'c....bbbb..c',
      '.c..bb.....c',
      '.c..bb....c.',
      '..cc....cc..',
      '....cccc....',
    ],
    palette: { b: pal('bone.paper'), c: pal('path.milagros.base') },
  },
  hooks: [
    hook('roomClear', (_e, api) => {
      fill(api, (api.memory()[CHARGE] ?? 0) + 1);
    }, { id: 'pip', priority: 50 }),
    hook('bossOvercome', (_e, api) => {
      fill(api, KAIROS_CHARGES);
    }, { id: 'boss-fill', priority: 50 }),
  ],
  onGain(api) {
    fill(api, KAIROS_CHARGES);
  },
});
