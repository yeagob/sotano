// The sky's 'core' messages in English (docs/architecture/SKY.md §12), spread into en.ts. Owned by: R1 writes every key up front; L1, C0, C1 and L2 only use them.

export const SKY_CORE_EN = {
  'level.sky': 'The sky',
  'level.skyDeck': 'The deck',
  'toast.skyEnter': 'You are in the sky. Nothing here takes your health.',
  'toast.skyLeave': 'You fall back to the crown of the tree.',
  'toast.skyPuff': 'Only a good intention lands here. The rest puffs away.',
  'toast.gateOpens': 'The way up opens.',
  'toast.towerDown': 'The tower comes down.',
  'sky.won': 'The guardian yields.',
} as const;
