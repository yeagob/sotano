import listener from './listener';

// The Star-reader (docs/design/built/presences/STAR-READER.md). Its body is the Listener's model until it has its own art
// (the art agent's follow-up); only its identity and words are its own. It reads without asking: no part leaves the hand.
export default {
  ...listener,
  id: 'star-reader',
  name: 'The Star-reader',
  pattern: 'Reading the shape of what you carry',
};
