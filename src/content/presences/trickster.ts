import listener from './listener';

// The Trickster (docs/design/built/presences/TRICKSTER.md). Its body is the Listener's model until it has its own art
// (the art agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'trickster',
  name: 'The Trickster',
  pattern: 'The shortcut that teaches',
};
