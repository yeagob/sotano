// Palette part 'meditation', spread into PALETTE. The Sanctuary's own colours (docs/art/DECISIONS.md §10.8):
// the Boundary's meditation app is a deliberate exception to the game's look, so its hues live in their own
// namespace and are used by nothing else. Seven roles per meditation: three background stops (high at the top,
// mid, deep at the bottom), the breath's glow, two accents, the motes, and the ink of the text.

export const MEDITATION_PALETTE = {
  'med.app.high': '#101529', 'med.app.mid': '#1E2444', 'med.app.deep': '#0B0E1D',
  'med.app.glow': '#FFF4DE', 'med.app.accent': '#F0C9A0', 'med.app.accent2': '#8FA2E8',
  'med.app.mote': '#E9E2D0', 'med.app.ink': '#F4F1EA', 'med.app.dim': '#C3C6D8',

  'med.ground.high': '#26352B', 'med.ground.mid': '#363021', 'med.ground.deep': '#1A140F',
  'med.ground.glow': '#EFE4BC', 'med.ground.accent': '#C98B5A', 'med.ground.accent2': '#7C9A5E',
  'med.ground.mote': '#B4C285', 'med.ground.ink': '#F3EEDC',

  'med.dusk.high': '#24183A', 'med.dusk.mid': '#5E2B4A', 'med.dusk.deep': '#7A4230',
  'med.dusk.glow': '#FFDCA6', 'med.dusk.accent': '#F2A65A', 'med.dusk.accent2': '#E57FA6',
  'med.dusk.mote': '#FFC98A', 'med.dusk.ink': '#FCF1E0',

  'med.night.high': '#06182A', 'med.night.mid': '#0D2F3F', 'med.night.deep': '#081C2A',
  'med.night.glow': '#DDF5EC', 'med.night.accent': '#5FD6A8', 'med.night.accent2': '#8E7BD6',
  'med.night.mote': '#C4EAF3', 'med.night.ink': '#EEF8F5',

  'med.box.high': '#0F1230', 'med.box.mid': '#1B2152', 'med.box.deep': '#0B0D22',
  'med.box.glow': '#EAF1FF', 'med.box.accent': '#8FB4FF', 'med.box.accent2': '#5A6BD8',
  'med.box.mote': '#C3D2FF', 'med.box.ink': '#EEF2FF',

  'med.warm.high': '#2A1433', 'med.warm.mid': '#5A2346', 'med.warm.deep': '#321523',
  'med.warm.glow': '#FFE4D8', 'med.warm.accent': '#F08FAE', 'med.warm.accent2': '#F7B79A',
  'med.warm.mote': '#FFD2C4', 'med.warm.ink': '#FFF2EC',

  'med.river.high': '#0A282C', 'med.river.mid': '#0F3D43', 'med.river.deep': '#071F24',
  'med.river.glow': '#E8F5EF', 'med.river.accent': '#6FC7B1', 'med.river.accent2': '#3E8FA8',
  'med.river.mote': '#D2EAE1', 'med.river.ink': '#EEF7F3',
} as const;
