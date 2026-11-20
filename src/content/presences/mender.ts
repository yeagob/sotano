import listener from './listener';

// The Mender (docs/design/built/presences/MENDER.md). Its body is the Listener's model until it has its own art (the art
// agent's follow-up, gold seams); only its identity and words are its own. It waits where the player opened a vault.
export default {
  ...listener,
  id: 'mender',
  name: 'The Mender',
  pattern: 'Repair, with the seam shown',
};
