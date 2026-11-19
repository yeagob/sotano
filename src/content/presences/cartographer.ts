import listener from './listener';

// The Cartographer (docs/design/built/presences/CARTOGRAPHER.md). Its body is the Listener's model until it has its own art (the art
// agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'cartographer',
  name: 'The Cartographer',
  pattern: 'Knowing where you stand',
};
