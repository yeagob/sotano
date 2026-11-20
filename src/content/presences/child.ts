import listener from './listener';

// The Child (docs/design/built/presences/CHILD.md). Its body is the Listener's model until it has its own art (the art
// agent's follow-up); only its identity and words are its own. It is always joyful: it never cries.
export default {
  ...listener,
  id: 'child',
  name: 'The Child',
  pattern: 'Permission to make something badly',
};
