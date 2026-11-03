// The revelation: the card, the rumble, the staircase and the unlock (docs/architecture/SKY.md §10.1).
//
// Once per run (one Encounter per run), when the player comes within ENCOUNTER_RANGE of the entity, it
// turns toward them and the card shows the owner's line. When the card is dismissed, or after CARD_WAIT
// seconds, the ground rumbles, the toast says the stairs are open, the staircase is carved and the unlock
// is saved, each exactly once. From the turn until the stairs open the encounter holds the stillness clock
// at zero, so silence cannot carry the player up in the middle of the read (SILENCE_STILL is 3 s, shorter
// than the card). After that, standing still carries them up as before.
//
// Headless: everything reaches the game through EncounterHost, so tests/endgame.test.ts runs it with a fake.
// The game (E2) does the two things the host contract has no verb for: it turns the entity
// (`SpikedEntity.turnToward(player)`) while `met`, and plays the rising chord (`entity.chord`) in `openStairs`.

import type { EncounterApi, EncounterHost, Pos } from '../sky/types';

/** Blocks from the entity where the revelation starts, once per run. */
export const ENCOUNTER_RANGE = 5;
/** Seconds the card waits before the stairs open if it is not dismissed. */
export const CARD_WAIT = 6;
/** Seconds the ground rumbles as the staircase opens. */
export const STAIR_RUMBLE = 2.5;

type Phase = 'waiting' | 'card' | 'open';

export class Encounter implements EncounterApi {
  private phase: Phase = 'waiting';
  private shown = 0;
  private holding = false;

  constructor(private host: EncounterHost) {}

  /** The revelation has started (the entity has turned); it never starts again this run. */
  get met() {
    return this.phase !== 'waiting';
  }

  /** From the turn until the staircase opens. */
  get holdsStill() {
    return this.holding;
  }

  update(dt: number, player: Pos, entity: Pos) {
    if (this.phase === 'waiting') {
      const dx = player.x - entity.x, dy = player.y - entity.y, dz = player.z - entity.z;
      if (dx * dx + dy * dy + dz * dz > ENCOUNTER_RANGE * ENCOUNTER_RANGE) return;
      this.phase = 'card';
      this.shown = 0;
      this.holding = true;
      this.host.holdStill(true);
      this.host.card('endgame.entity.name', ['endgame.entity.line1', 'endgame.entity.line2']);
      return;
    }
    if (this.phase === 'card') {
      this.shown += dt;
      if (this.shown >= CARD_WAIT) this.open();
    }
  }

  dismiss() {
    if (this.phase === 'card') this.open();
  }

  /** The stairs open: rumble, toast, carve, then let go of the stillness and keep the unlock. */
  private open() {
    this.phase = 'open';
    this.host.rumble(STAIR_RUMBLE);
    this.host.toast('toast.stairOpens');
    this.host.openStairs();
    this.holding = false;
    this.host.holdStill(false);
    this.host.saveMeta();
  }
}
