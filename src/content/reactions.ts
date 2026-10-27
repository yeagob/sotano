// What happens when elements meet (docs/design/ELEMENTS.md §2): data rows, read by the element
// simulation (src/world/elements.ts). Every reaction goes through the `materialReact` event, so a
// practice can change its result or stop it.

import type { ElementKey } from './elements';

export interface ReactionDef {
  id: string;
  /** The element that acts… */
  a: ElementKey;
  /** …on a neighbouring cell of this element, which changes. */
  b: ElementKey;
  /** What `b` becomes: a block material key (it turns solid), or null (it is simply gone).
   *  `source` applies when `b` is a source, `flow` otherwise. */
  source: string | null;
  flow: string | null;
  /** Particles and sound. */
  fx: 'steam' | 'hiss';
}

export const REACTIONS: ReactionDef[] = [
  // emotion meets old pain: it hardens into a boundary (a lava lake) or plain stone (a trickle)
  { id: 'quench', a: 'water', b: 'lava', source: 'obsidian', flow: 'stone', fx: 'steam' },
  // feeling puts out anger
  { id: 'douse', a: 'water', b: 'fire', source: null, flow: null, fx: 'hiss' },
];
