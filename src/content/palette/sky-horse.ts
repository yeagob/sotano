// Palette part 'sky-horse' (docs/architecture/SKY.md §11), spread into PALETTE. Owned by: B5. Rulings: docs/art/sky/horse.md.
//
// The horse and its herd are plush (docs/art/sky/README.md §2): felt in low contrast, never cold, never red,
// never gold. The deity is a pale dun with a dark mane, so its giant head and streaming mane read from the
// silhouette; the herd is a darker bay, so a minion reads as one of the herd and never as the deity.

export const SKY_HORSE_PALETTE = {
  // the deity's coat: base, the shade under it (legs), and the soft muzzle
  // (warmer than the paddocks' pale stone, ΔE 11, so the body does not melt into the stone it stands on)
  'plush.horse.coat.base': '#D0AE8C', 'plush.horse.coat.dark': '#A0846C', 'plush.horse.coat.hi': '#E6D4BC',
  // the mane, tail and forelock, shared by the herd
  'plush.horse.mane': '#5A4A40',
  // wide felt eyes and nostrils, with one pale shine each
  'plush.horse.eye': '#2B2224', 'plush.horse.shine': '#EAE2D6',
  // the herd's coat (the minions): a darker bay of the same felt
  'plush.horse.herd.base': '#8C7462', 'plush.horse.herd.dark': '#6C5A4D', 'plush.horse.herd.hi': '#BCA68E',
} as const;
