import { MAT } from '../src/content/materials';
import { describe, expect, it } from 'vitest';
import { PRESENCE_REQUEST, requestOf } from '../src/content/presences/requests';
import { findPresenceOffer, unlocksPresence } from '../src/content/presences';
import { RunRandom } from '../src/core/rng';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { PARTS } from '../src/content/parts';

describe('requests from the depths (REQUESTS.md): one shared mechanism on the consent card', () => {
  it('only the presences whose designs name a request carry one: the Gardener, the Boatman, the Child and the Elder', () => {
    expect(Object.keys(PRESENCE_REQUEST).sort()).toEqual(['boatman', 'child', 'elder', 'gardener']);
    expect(requestOf('child')?.kind).toBe('draw');
    expect(requestOf('elder')?.kind).toBe('still');
    expect(requestOf('gardener')?.kind).toBe('breathe');
    expect(requestOf('boatman')?.kind).toBe('move');
    expect(requestOf('listener')).toBeUndefined();
  });

  it('every request has its ask and its alternative in English and Spanish, and the alternative is never the ask', () => {
    for (const r of Object.values(PRESENCE_REQUEST)) {
      expect(EN.messages[r!.ask]).toBeTruthy();
      expect(ES.messages[r!.ask]).toBeTruthy();
      expect(EN.messages[r!.alt]).toBeTruthy();
      expect(ES.messages[r!.alt]).toBeTruthy();
      expect(r!.alt).not.toBe(r!.ask);
    }
  });

  it('a request asks for nothing more: the exchange is the same offer, and the part the card names is still the one taken', () => {
    const hand = [MAT.stone, MAT.root, PARTS[0]];
    const offer = findPresenceOffer('gardener', hand);
    expect(offer).toEqual({ index: 1, carried: MAT.root });
    expect(unlocksPresence('gardener', PARTS[0])).toBe(false);
  });

  it('the requests are fixed content: no seed, and the same text on every read', () => {
    expect(requestOf('gardener')).toEqual(requestOf('gardener'));
    expect(new RunRandom(1).fork('presence', 'gardener').next()).toBe(new RunRandom(1).fork('presence', 'gardener').next());
  });
});
