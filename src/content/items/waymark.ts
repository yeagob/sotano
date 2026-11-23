import { pal } from '../palette';
import { HALF_HEART } from '../../entities/actors';
import { defineItem, hook, type ItemApi } from '../../items/types';
import { CHECKPOINT_TAG, REVIVE_INVULN_S, REVIVE_SHOVE_RADIUS } from '../../game/checkpoint';

// Waymark (docs/design/built/practices/will/WAYMARK.md): a cairn on the path. It is a checkpoint that works as an
// extra life. The checkpoint lives in the run (game/checkpoint.ts), not in the item, so it survives every rebuild of
// the inventory. Each held copy is one life: a death is cancelled by the first copy's hook, and the copy is spent.
export const WAYMARK = 'waymark';
const LIGHT = pal('light.gold');

/** Pushes the projections near the checkpoint away from it, so the player is not met on arrival. */
function clearCheckpoint(api: ItemApi, at: { x: number; y: number; z: number }) {
  const except: number[] = [];
  for (let n = 0; n < 32; n++) {
    const p = api.nearestProjection(at.x, at.y + 1, at.z, REVIVE_SHOVE_RADIUS, except);
    if (!p) return;
    except.push(p.id);
    const dx = p.x - at.x, dz = p.z - at.z;
    const a = api.rng().next() * Math.PI * 2;
    const away = Math.hypot(dx, dz) > 0.01 ? [dx, dz] : [Math.cos(a), Math.sin(a)];
    api.shove(p.id, away[0], away[1], 6);
  }
}

export default defineItem({
  id: WAYMARK,
  name: 'Waymark',
  description: 'A cairn on the path: stones stacked by someone who walked here before. Wherever you last knew yourself, you can always return to it.',
  effect: 'Marks where you stand, and the start of each new floor. When you would die, you return there with full hearts, 2.5 s of invulnerability and everything you carry. Used up when it saves you: one copy, one extra life.',
  inspiredBy: 'Cairns and waymarks on pilgrim routes',
  pools: { vault: 1, boss: 0.5 },
  tags: ['will', 'life', CHECKPOINT_TAG],
  color: pal('path.will.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '.....gg.....',
      '....gEEg....',
      '.....gg.....',
      '....aaaa....',
      '....abba....',
      '...aaaaaa...',
      '...abbbba...',
      '..aaaaaaaa..',
      '..abbbbbba..',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('bone.dim'), b: pal('bone.faded'), g: pal('path.will.glow'), E: pal('path.will.base') },
  },
  messages: { revived: 'The waymark brings you back.' },
  hooks: [
    // the checkpoint moves to the arrival point of every new floor, so it never points at a floor left behind
    hook('floorEnter', (e, api) => api.setCheckpoint(e.arrival.x, e.arrival.y, e.arrival.z), { id: 'arrival' }),
    // the revive: cancel the death, spend this copy, come back at the checkpoint with full hearts
    hook('death', (e, api) => {
      const cp = api.checkpoint();
      if (!cp) return;
      e.cancel();
      const from = api.playerFeet();
      api.burst(from.x, from.y + 1, from.z, LIGHT, 40);
      const c = api.counts();
      api.heal((c.maxHp - c.hp) / HALF_HEART, 'waymark');
      api.teleportPlayer(cp.x, cp.y, cp.z);
      api.invulnerable(REVIVE_INVULN_S);
      clearCheckpoint(api, cp);
      api.burst(cp.x, cp.y + 1, cp.z, LIGHT, 40);
      api.chime();
      api.toast('revived');
      api.consumeSelf();
    }, { id: 'revive', priority: 150 }),
  ],
  // a new copy marks the place it is picked up
  onGain(api) {
    const f = api.playerFeet();
    api.setCheckpoint(f.x, f.y, f.z);
  },
});
