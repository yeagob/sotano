import type { Covenant } from './covenant';

/** The Mender's Thread (COVENANT.md; owner, #228, D10): the Covenant's Thread is an inventory item, not a run record. The
 *  Mender drops it after a Give, once a run, and the Thread is kept in the Covenant's record when the player picks up the
 *  Thread the Mender dropped. Any other copy (a debug grant, the test bench) is an item and no piece: one source each. */
export const MENDERS_THREAD = 'menders-thread';

/** Whether the Mender drops the Thread now: once a run, while the record has no Thread and the player does not hold one. */
export function menderDropsThread(record: Covenant, dropped: boolean, holding: boolean): boolean {
  return !dropped && !holding && !record.includes('thread');
}

/** Whether gaining this item keeps the Covenant's Thread: only the Thread, and only once the Mender has dropped it. */
export function gainKeepsThread(itemId: string, dropped: boolean): boolean {
  return dropped && itemId === MENDERS_THREAD;
}
