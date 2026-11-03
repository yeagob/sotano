// The revelation: the card, the rumble, the staircase and the unlock (docs/architecture/SKY.md §10.1). Stub (K0): EN builds it.

import type { EncounterApi, EncounterHost, Pos } from '../sky/types';

/** Blocks from the entity where the revelation starts, once per run. */
export const ENCOUNTER_RANGE = 5;
/** Seconds the card waits before the stairs open if it is not dismissed. */
export const CARD_WAIT = 6;

export class Encounter implements EncounterApi {
  readonly holdsStill = false;
  readonly met = false;
  constructor(_host: EncounterHost) {}
  update(_dt: number, _player: Pos, _entity: Pos) {}
  dismiss() {}
}
