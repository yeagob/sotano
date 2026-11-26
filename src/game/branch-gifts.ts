// The branches' gifts (issue #329, docs/design/built/levels/giant-tree/BRANCHES.md): the mobility practice at the centre
// of each branch's ball of leaves, the moment all six are held in one run, and the hook for what that moment opens. Pure:
// the game lays the practices, watches the moment and calls the hook.

import { BRANCH_PRACTICES, type BranchPlan } from '../world/branches';

/** Where a branch's practice floats: the centre of its ball of leaves, over the perch (feet height, tile centre). */
export interface BranchGift { branch: number; item: string; x: number; y: number; z: number }

/** The gifts to lay at run start, one per branch whose practice exists in this build (`has`). The double jump (#293) and
 *  the wall jump (#294) are built on their own branches: until they are merged, their balls hold nothing. */
export function branchGifts(plans: readonly BranchPlan[], has: (id: string) => boolean): BranchGift[] {
  return plans.flatMap(b => {
    const item = BRANCH_PRACTICES[b.index];
    return item && has(item) ? [{ branch: b.index, item, x: b.ball[0] + 0.5, y: b.ball[1], z: b.ball[2] + 0.5 }] : [];
  });
}

/** The moment of the achievement (`tree.branches.all`): the run holds the six branch practices at once, however each one
 *  was taken (a practice already held from a room empties its ball, as the Leaves' gift does). */
export function holdsAllBranchPractices(held: (id: string) => boolean): boolean {
  return BRANCH_PRACTICES.every(held);
}

/** "Andar despacio" (the owner's words; Camina Despacio, #340, item id `walk-slow`, built on its own branch): what the
 *  six branch practices open. NOT BUILT HERE: the practice and its effect (a time control while crouched) are #340's. The
 *  hook: when the moment comes, the game puts the practice on a pedestal at the centre of the room where the branches
 *  start, the branch story's hall, the top of the trunk's climb (#328's core). If the item does not exist in this build,
 *  nothing is laid. */
export const WALK_SLOW_ITEM = 'walk-slow';

/** The pedestal's cell for "Andar despacio": the centre of the branch story's hall, on its floor (`floor` is the feet
 *  height of the hall's floor). The practice floats over it. */
export function walkSlowSpot(cx: number, cz: number, floor: number): { x: number; y: number; z: number } {
  return { x: cx, y: floor, z: cz };
}
