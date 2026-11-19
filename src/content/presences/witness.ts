import listener from './listener';

// The Witness (docs/design/built/presences/WITNESS.md). Its body is the Listener's model until it has its own art (the
// art agent's follow-up); only its identity and words are its own. It sees without judging: it never reads the player's
// hexagram or patterns yet (not built), and it asks no part.
export default {
  ...listener,
  id: 'witness',
  name: 'The Witness',
  pattern: 'Seeing without judging',
};
