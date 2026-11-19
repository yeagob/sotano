// Counts the blocks the player places in this run. Every placing path emits the `blockPlaced` event
// (game.ts tryPlace is the only one that puts a material block into the world), so the count is fed
// from that event and never from a path of its own. The Child's build reads it by a mark: the count
// when the Child starts watching, then how many blocks came after.

/** The blocks the Child asks the player to place while it watches (the design's "three blocks"). */
export const CHILD_BUILD_BLOCKS = 3;

export class BuildCount {
  private placed = 0;

  /** One block placed: called once for each `blockPlaced` event. */
  record(): void {
    this.placed++;
  }

  /** The count now, to compare against later with `since`. */
  mark(): number {
    return this.placed;
  }

  /** How many blocks were placed after the mark. Never negative. */
  since(mark: number): number {
    return Math.max(0, this.placed - mark);
  }

  /** True once `need` blocks came after the mark (the Child's build is done). */
  reached(mark: number, need: number = CHILD_BUILD_BLOCKS): boolean {
    return this.since(mark) >= need;
  }
}
