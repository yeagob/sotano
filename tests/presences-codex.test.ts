import { describe, expect, it } from 'vitest';
import { PRESENCES, PRESENCE_TALK, type PresenceId } from '../src/content/presences';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const ids = PRESENCES.map(p => p.id) as PresenceId[];

describe('the codex (CODEX.md): every presence that can be met has its entry in both languages', () => {
  it('lists the twelve presences of the roster, the Boundary aside (it is a guardian and is never met)', () => {
    expect(ids).toHaveLength(12);
    expect(ids).not.toContain('boundary' as PresenceId);
  });

  it('has a name, what it asks and what it gives, in English and in Spanish', () => {
    for (const id of ids) {
      for (const key of [PRESENCE_TALK[id].name, `codex.${id}.asks`, `codex.${id}.gives`]) {
        expect(EN.messages[key as keyof typeof EN.messages], key).toBeTruthy();
        expect(ES.messages[key as keyof typeof ES.messages], key).toBeTruthy();
      }
    }
  });

  it('has the heading, the empty line and the two labels in both languages', () => {
    for (const key of ['codex.title', 'codex.empty', 'codex.asks', 'codex.gives']) {
      expect(EN.messages[key as keyof typeof EN.messages], key).toBeTruthy();
      expect(ES.messages[key as keyof typeof ES.messages], key).toBeTruthy();
    }
  });
});
