import listener from './listener';

// The Wanderer (docs/design/built/presences/WANDERER.md). Its body is the Listener's model until it has its own art (the
// art agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'wanderer',
  name: 'The Wanderer',
  pattern: 'Wisdom on the way',
};
