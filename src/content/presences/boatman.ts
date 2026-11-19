import listener from './listener';

// The Boatman (docs/design/built/presences/BOATMAN.md). Its body is the Listener's model until it has its own art (the
// art agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'boatman',
  name: 'The Boatman',
  pattern: 'Letting go to move on',
};
