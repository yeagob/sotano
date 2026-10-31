# Audio

Up: [built feel](README.md)

Every sound in the game is synthesised with WebAudio, with no audio files and no music track. The sounds are made in code, so there is nothing to license and nothing to download. Code: `src/audio/sfx.ts`.

## What is built

- **58 named cues**: 42 one-shot sounds for the game's events, and 16 spatial sounds that have a place in the room. The brief's estimate was "about 60"; this is the count in the code.
- **No music.** There is no music track. Every sound is one of the cues below.

## The one-shot sounds

They follow the event they mark, and each family has its own voice:

- **Intentions and blocks.** A shot, a hit, a break, a pickup, a kick, a placement, a denied action, a mend, and a head-break knock.
- **Doors and keys.** A door, an unlock, a key, and a descent, which is a low tone and a rumble.
- **Practices.** A pickup fanfare, a charge that is full (a clear bell), the cut of Cut Ties with Toxic Relationships (a quick airy swish), the beam of Remember Breathing (a warm, held roar), and the great cut of One Clear Cut (a deep, long sweep).
- **Feedback.** Hurt, heal, a bomb pickup, a fuse, a spawn, a dissolve, a seal, the clearing of a room, a rumble, the polarity tick, a projection turning to your side (warm and rising), an ally turning back (cold and falling), a judgement, a death, the reveal of a boss's practice, steam, catching fire, a splash, a gulp for breath, creaking, a spit, and the soft breath of a restart.

## The spatial sounds

Sounds that must be found start with a transient (a click or a crack), so the ear can locate the onset. The listener is the camera.

- **Omens.** An omen opens with a short click, then a hum that rises from the floor, falls from the ceiling, or sits in a wall.
- **Breach.** A projection breaks out of its room: a crack and a square tone at the place of the breach.
- **Door slam.** A door slams shut at its own place in the room.
- **Projection and boss cues.** Twelve kinds: a line, a ring, a field, a pull, a sweep, a bolt, a leap, a hiding, a chirp, a phase, a boss's windup (a rising growl before an attack), and a quake (a deep thud under a crack of stone). The bestiary designs how these sounds are used in a fight (its spatial sound section, [BESTIARY](README.md)).
- **Swell.** A low, unpositioned swell before a later wave: more are coming.

## Open questions

- None recorded for the audio as built. The bestiary's sound design for each projection's motif is not built ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)).
