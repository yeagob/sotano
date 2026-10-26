// The one palette of SÓTANO (docs/art/DECISIONS.md §3, art guide §3).
// Every colour in the game is a named token here. Content and renderers refer to tokens,
// never to hex, so a colour can be changed in one place and tested as a whole.
// Vessel Light: dark, cold, quiet matter; warm light is earned and belongs to the player.

export const PALETTE = {
  // Ink, bone and ash: shared darks and paper.
  'ink.void': '#0E0B10',
  'ink.line': '#14111C',
  'ink.panel': '#17120F',
  'ink.bevel': '#3A2F27',
  'ink.ash': '#3A3236',
  'ui.night': '#0E1022',
  'bone.paper': '#EDE4D0',
  'bone.dim': '#C4B8A3',
  'bone.faded': '#9A8F84',

  // World neutrals: floor rock ramps (outline, dark, base, hi).
  'rock.f1.outline': '#2A211A', 'rock.f1.dark': '#45372B', 'rock.f1.base': '#6B5442', 'rock.f1.hi': '#866A52',
  'rock.f2.outline': '#1F242C', 'rock.f2.dark': '#343A44', 'rock.f2.base': '#4E5560', 'rock.f2.hi': '#69717C',
  'rock.f3.outline': '#1D1C26', 'rock.f3.dark': '#302F3B', 'rock.f3.base': '#4B4A58', 'rock.f3.hi': '#64627A',
  'rock.f4.outline': '#140F19', 'rock.f4.dark': '#241D2B', 'rock.f4.base': '#3B3043', 'rock.f4.hi': '#52455D',
  'rock.source.dark': '#1F1A22', 'rock.source.base': '#2F2833',

  // The light: the player's ramp.
  'light.core': '#FFF1C8',
  'light.hot': '#FFD77A',
  'light.gold': '#F2C14E',
  'light.ember': '#EAA640',
  'light.dusk': '#B8502A',

  // Life: red is reserved for it.
  'life.heart': '#D9434F',
  'life.dark': '#7A1E2A',
  'life.empty': '#4A2226',
  'life.rim': '#7A3A3E',

  // The four paths: base, glow, dark and the shadow a projection takes.
  'path.body.base': '#3FCF7F', 'path.body.glow': '#81E9AF', 'path.body.dark': '#276E46', 'path.body.shadow': '#36634A',
  'path.emotion.base': '#7AA3D4', 'path.emotion.glow': '#8EC1FF', 'path.emotion.dark': '#365981', 'path.emotion.shadow': '#364A63',
  'path.mind.base': '#B074FA', 'path.mind.glow': '#D5B3FF', 'path.mind.dark': '#5D1AB0', 'path.mind.shadow': '#4A3663',
  'path.will.base': '#CA7622', 'path.will.glow': '#E8803F', 'path.will.dark': '#66411C', 'path.will.shadow': '#634D36',

  // The cold: the projections' side.
  'cold.deep': '#2A2F45',
  'cold.dim': '#6F7891',
  'cold.rim': '#8E98B4',
  'cold.body': '#B9C6E6',
  'cold.white': '#EEF2FA',
  'captive.smoulder': '#4A1E12',
  'captive.ember': '#8F3A1C',
  'mood.held': '#2A3550',

  // Bridge materials (never emissive).
  'brass.dark': '#5E4F2A', 'brass.base': '#8F7A45', 'brass.hi': '#B9A26A',
  'iron.dark': '#4D525A', 'iron.base': '#737982', 'iron.hi': '#A8AEB6',
  'limestone.dark': '#7D7770', 'limestone.base': '#A39C93', 'limestone.hi': '#CFC8BE',
  'copper.dark': '#8A5A3A', 'copper.base': '#B07A52', 'copper.hi': '#D4A27A',

  // Sky, fog and transitions.
  'sky.dawnLow': '#E8573C',
  'sky.dawnHigh': '#BFD8F0',
  'sky.day': '#8FC4E8',
  'sky.horizon': '#F3E2C4',
  'sky.albedo': '#F4F1EA',
  'fog.warm': '#3A2E14',
  'fog.f1': '#1E1712',
  'fog.f2': '#121A22',
  'fog.f3': '#15151F',
  'fog.f4': '#0C0910',

  // Skin (a player setting, hands only) and the house's jumper.
  'skin.t1': '#F3D2B3', 'skin.t2': '#E2B48F', 'skin.t3': '#B98260',
  'skin.t4': '#9A6844', 'skin.t5': '#6F4A30', 'skin.t6': '#4A3020',
  'cloth.base': '#3D4F73', 'cloth.cuff': '#2C3A57', 'cloth.hi': '#4E6290',
} as const;

export type PalToken = keyof typeof PALETTE;

/** The four paths, by name. Their glyphs are shown next to the colour, never instead of it. */
export const PATHS = ['body', 'emotion', 'mind', 'will'] as const;
export type PathName = typeof PATHS[number];
export const PATH_GLYPH: Record<PathName, string> = { body: '■', emotion: '●', mind: '◆', will: '▲' };

/** The palette hex as a number, for three.js and canvas painters. Throws on an unknown token. */
export function pal(t: PalToken): number {
  return parseInt(palCss(t).slice(1), 16);
}

/** The palette hex as CSS, for the HUD and the gallery. Throws on an unknown token. */
export function palCss(t: PalToken): string {
  const hex = PALETTE[t];
  if (hex === undefined) throw new Error(`Unknown palette token: ${String(t)}`);
  return hex;
}
