import listener from './listener';

// The Echo (docs/design/built/presences/ECHO.md). Its body is the Listener's model until it has its own art (the art
// agent's follow-up); only its identity and words are its own.
export default {
  ...listener,
  id: 'echo',
  name: 'The Echo',
  pattern: 'Learning from failure',
};
