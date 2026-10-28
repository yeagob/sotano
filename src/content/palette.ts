// The one palette of The Roots (docs/art/DECISIONS.md §3, art guide §3).
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

  // Material ramps (outline, dark, base, hi): DECISIONS §6.2. Brick and door frames take rock.f1.
  'mat.dirt.outline': '#2E1F14', 'mat.dirt.dark': '#4F3624', 'mat.dirt.base': '#6B4A30', 'mat.dirt.hi': '#87603F',
  'mat.grass.outline': '#24361A', 'mat.grass.dark': '#3D5A2A', 'mat.grass.base': '#557A37', 'mat.grass.hi': '#78A24A',
  'mat.stone.outline': '#2A2A2E', 'mat.stone.dark': '#47474D', 'mat.stone.base': '#626268', 'mat.stone.hi': '#82828A',
  'mat.deepstone.outline': '#121119', 'mat.deepstone.dark': '#22212C', 'mat.deepstone.base': '#33313F', 'mat.deepstone.hi': '#4A4759',
  'mat.crate.outline': '#2E1D0F', 'mat.crate.dark': '#5A3A1E', 'mat.crate.base': '#7D5530', 'mat.crate.hi': '#A3743E',
  'mat.obsidian.outline': '#07050C', 'mat.obsidian.dark': '#140F20', 'mat.obsidian.base': '#221935', 'mat.obsidian.hi': '#3B2B55', 'mat.obsidian.accent': '#6E58A0',
  'mat.bedrock.outline': '#060507', 'mat.bedrock.dark': '#0E0D10', 'mat.bedrock.base': '#18161B', 'mat.bedrock.hi': '#24212A',
  'mat.seed.dark': '#1E1626', 'mat.seed.base': '#2A2233', 'mat.seed.hi': '#3A3046',
  // Building materials: each floor builds its rooms from its own (DECISIONS §6.5).
  'mat.loam.outline': '#423624', 'mat.loam.dark': '#645237', 'mat.loam.base': '#846D4D', 'mat.loam.hi': '#968163',
  'mat.flagstone.outline': '#1C1712', 'mat.flagstone.dark': '#312A22', 'mat.flagstone.base': '#443B32', 'mat.flagstone.hi': '#5F564D',
  'mat.rubble.outline': '#393927', 'mat.rubble.dark': '#56583C', 'mat.rubble.base': '#737452', 'mat.rubble.hi': '#868768',
  'mat.wetbrick.outline': '#0D262A', 'mat.wetbrick.dark': '#183E45', 'mat.wetbrick.base': '#27555E', 'mat.wetbrick.hi': '#487079',
  'mat.ashlar.outline': '#293C3B', 'mat.ashlar.dark': '#3F5C59', 'mat.ashlar.base': '#567977', 'mat.ashlar.hi': '#6C8C89',
  'mat.slate.outline': '#3F343F', 'mat.slate.dark': '#604F60', 'mat.slate.base': '#7F697F', 'mat.slate.hi': '#917D91',
  'mat.darkbrick.outline': '#271724', 'mat.darkbrick.dark': '#42293E', 'mat.darkbrick.base': '#5A3C56', 'mat.darkbrick.hi': '#755871',

  // Elements (DECISIONS §3.8): owned by the world. Fire and lava are the only warm emitters that
  // are not the player's, and they hurt: warmth that isn't yours burns. Water never glows.
  'el.water.body': '#1D4B6E', 'el.water.surface': '#4F9CC8', 'el.water.foam': '#BFE6F2', 'el.water.fog': '#0D2A3A',
  'el.lava.crust': '#1A0703', 'el.lava.crust2': '#3A0D05', 'el.lava.molten': '#C2410C', 'el.lava.hot': '#FF7A1A', 'el.lava.vein': '#FFD25A',
  'el.fire.deep': '#A8200D', 'el.fire.base': '#FF5A1F', 'el.fire.hi': '#FFB13B', 'el.fire.core': '#FFF1A8',
  'el.ember.hot': '#FFD070', 'el.ember.dead': '#5A1A0A', 'el.smoke': '#2B2522',

  // Projection husks (DECISIONS §8.8–8.10): dark husks near-black with a cold rim; the Lectern's cold paper.
  'husk.doubt.dark': '#1A1520', 'husk.doubt.base': '#262030', 'husk.doubt.hi': '#352C42',
  'husk.panic.dark': '#16100E', 'husk.panic.base': '#1F1714', 'husk.panic.hi': '#2E2219',
  'paper.dark': '#8C93A0', 'paper.base': '#C9CFD8', 'paper.hi': '#E4E8EE',

  // Skin (a player setting, hands only) and the house's jumper.
  'skin.t1': '#F3D2B3', 'skin.t2': '#E2B48F', 'skin.t3': '#B98260',
  'skin.t4': '#9A6844', 'skin.t5': '#6F4A30', 'skin.t6': '#4A3020',
  'cloth.base': '#3D4F73', 'cloth.cuff': '#2C3A57', 'cloth.hi': '#4E6290',

  'living.dark': '#26331F', 'living.base': '#46603D', 'living.hi': '#7A9A62', 'living.glow': '#B5D39A',
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
