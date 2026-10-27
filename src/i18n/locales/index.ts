// The shipped locales. To add a language: copy es.ts, translate it, list it here
// (docs/architecture/LOCALIZATION.md §5). tests/i18n.test.ts lists whatever it still lacks.

import type { MessageKey } from './en';
import { EN } from './en';
import { ES } from './es';

/** CLDR plural forms (`Intl.PluralRules`); `other` is always required. */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type Message = string | Plural;

/** Content translations by id. Any missing field falls back to the definition's English. */
export interface ContentTexts {
  items: Record<string, { name?: string; description?: string; effect?: string; inspiredBy?: string; messages?: Record<string, string> }>;
  synergies: Record<string, { name?: string; description?: string; messages?: Record<string, string> }>;
  enemies: Record<string, { name?: string; pattern?: string }>;
  /** By material key ('stone'). */
  materials: Record<string, string>;
  parts: Record<string, { name?: string; description?: string }>;
}

export interface Catalog {
  code: string;
  /** The language's own name, for the selector ('Español'). */
  name: string;
  messages: Record<MessageKey, Message>;
  content: ContentTexts;
}

export const LOCALES: readonly Catalog[] = [EN, ES];
