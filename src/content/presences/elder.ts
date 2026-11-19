import listener from './listener';

// The Elder (docs/design/built/presences/ELDER.md). Its body is the Listener's model until it has its own art (the art
// agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'elder',
  name: 'The Elder',
  pattern: 'What was taught, and what still holds',
};
