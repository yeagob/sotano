import type { MessageKey } from '../../i18n';
import type { PresenceId } from './index';

/** A request from the depths (REQUESTS.md, decided): one thing the presence asks the player to do in the real world, shown
 *  on the consent card beside the exchange. The exchange still completes only on the card's own answer (Give or Keep);
 *  the request adds a line of text and an alternative, and nothing else. Every physical request has an alternative, and
 *  a request is never urgent or timed on the card. */
export type RequestKind = 'breathe' | 'still' | 'write' | 'draw' | 'move';

export interface PresenceRequest {
  kind: RequestKind;
  /** What the presence asks, one sentence. */
  ask: MessageKey;
  /** The alternative the card always names: a seated or quiet way, or saying it in the head. */
  alt: MessageKey;
}

/** The requests built so far. The Gardener asks to breathe (REQUESTS.md, decided); the Boatman asks to move before the
 *  crossing. The Child (draw) and the Elder (be still, write a line) name requests in their documents too; their cards are
 *  not wired yet (see docs/design/not-built/presences/REQUESTS.md). */
export const PRESENCE_REQUEST: Partial<Record<PresenceId, PresenceRequest>> = {
  gardener: { kind: 'breathe', ask: 'request.breathe', alt: 'request.breathe.alt' },
  boatman: { kind: 'move', ask: 'request.move', alt: 'request.move.alt' },
};

export function requestOf(id: PresenceId): PresenceRequest | undefined {
  return PRESENCE_REQUEST[id];
}
