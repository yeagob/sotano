# The hidden book: pages 7 to 9

Up: [the Roots as an evolving tutorial](README.md) · Status: **proposal, awaiting the owner.** These three pages are a first draft for the owner to keep, change or replace; the owner will write the rest of the book by hand ([BOOK-DATA §8](BOOK-DATA.md#8-writing-a-new-page-by-hand-for-the-owner)).

After the six tutorial pages the walls start a book. A book page is a single `prose` panel on the start room's south wall (`roots-hall`, south), the panel a player sees on turning round from the spawn; every other slot shows page 1. The page stone in the start room shows the page number ([PAGES §4](PAGES.md#4-the-page-stone)).

The three pages draw only on the documented story: the premise ([PREMISE](../../../built/story/PREMISE.md)), the naming rule that projections are patterns and never people ([NAMING](../../../built/story/NAMING.md)), what a projection wants ("need" in the bestiary documents) and the shape of the world, the roots between the tree above and the silence below ([COSMOLOGY](../../../../lore/COSMOLOGY.md)). They name no tradition, author or therapy, promise nothing and diagnose nothing. They are written for a child and an adult at once, in the second person, gender-neutral in Spanish.

## Page 7 (`book-1`): the basement

> You came down into the basement of your own mind. Down here, what you set your will on changes. Every wall was something you built to stay safe. Once it kept you safe. Now it keeps you small, and you are allowed to break it.

> Bajaste al sótano de tu propia mente. Aquí abajo cambia todo aquello en lo que pones tu voluntad. Cada muro es algo que levantaste para estar a salvo. Un día te protegió. Ahora te empequeñece, y tienes permiso para romperlo.

From the premise: the basement of the mind, reality bending to intention, every wall something once built to stay safe that now keeps you small.

**The page's quotation (owner, 2026-11-12).** Page 7 ends with a quotation from Guillermo Borja, *La locura lo cura* (extractos), Editorial La Llave, 1995, on the `quote` panel of the treasure room's north wall (`roots-gift` → `north`, the end of the page: [BOOK-DATA §2b](BOOK-DATA.md#2b-quotations)). The Spanish is the original, exactly as the owner gave it (369 characters); the English is our translation (369 characters) and the panel says so. Both fit one panel (budget 440, [PANELS §4b](PANELS.md#4b-quote-someone-elses-voice)). The prose and the quotation speak to each other: walls built to stay safe, then authenticity as showing oneself without a façade.

> La autenticidad es no cambiar lo que uno es y acotar lo que uno tiene. Es la capacidad de manifestarse tal y como se es, sin ocultamientos. Lo auténtico es y tiene valor. La autenticidad no es tratar de ser mejor. Esto es sentido del deber, es una obligación, es una orden, una fachada. La verdadera autenticidad es mostrarse, sin juicio, sin temor a ser descalificado.
>
> — Guillermo Borja, *La locura lo cura* (extractos), Editorial La Llave, 1995

> Authenticity is not changing what one is, and marking out what one has. It is the capacity to show oneself just as one is, without hiding. What is authentic is, and has worth. Authenticity is not trying to be better. That is a sense of duty, an obligation, an order, a façade. True authenticity is showing oneself, without judgement, without fear of being disqualified.
>
> — our translation

The page-7 entry, exactly as it is to replace `book-1` in each file (package B6 applies it; the files are not changed by this document):

`src/content/book/book.es.json`:

```json
{
  "id": "book-1",
  "kind": "book",
  "panels": {
    "roots-hall": {
      "south": { "layout": "prose", "text": "Bajaste al sótano de tu propia mente. Aquí abajo cambia todo aquello en lo que pones tu voluntad. Cada muro es algo que levantaste para estar a salvo. Un día te protegió. Ahora te empequeñece, y tienes permiso para romperlo." }
    },
    "roots-gift": {
      "north": { "layout": "quote", "text": "La autenticidad es no cambiar lo que uno es y acotar lo que uno tiene. Es la capacidad de manifestarse tal y como se es, sin ocultamientos. Lo auténtico es y tiene valor. La autenticidad no es tratar de ser mejor. Esto es sentido del deber, es una obligación, es una orden, una fachada. La verdadera autenticidad es mostrarse, sin juicio, sin temor a ser descalificado.", "author": "Guillermo Borja", "work": "La locura lo cura (extractos)", "publisher": "Editorial La Llave", "year": 1995, "lang": "es" }
    }
  }
}
```

`src/content/book/book.en.json`:

```json
{
  "id": "book-1",
  "kind": "book",
  "panels": {
    "roots-hall": {
      "south": { "layout": "prose", "text": "You came down into the basement of your own mind. Down here, what you set your will on changes. Every wall was something you built to stay safe. Once it kept you safe. Now it keeps you small, and you are allowed to break it." }
    },
    "roots-gift": {
      "north": { "layout": "quote", "text": "Authenticity is not changing what one is, and marking out what one has. It is the capacity to show oneself just as one is, without hiding. What is authentic is, and has worth. Authenticity is not trying to be better. That is a sense of duty, an obligation, an order, a façade. True authenticity is showing oneself, without judgement, without fear of being disqualified.", "author": "Guillermo Borja", "work": "La locura lo cura (extractos)", "publisher": "Editorial La Llave", "year": 1995, "lang": "es" }
    }
  }
}
```

Its source row for `docs/lore/SOURCES.md` (package B6): id `la-locura-lo-cura`, *La locura lo cura* (extractos), Guillermo Borja, Editorial La Llave, 1995, kind book, naming status **Credit** (a modern work: quoted with attribution, never used as a name), key idea: authenticity as showing oneself without a façade, not as trying to be better; in the game: the quotation on page 7 of the Roots' book.

## Page 8 (`book-2`): the patterns

> The shapes that block your way are not people. They are patterns: a doubt, a judging voice, a fear at the edge of change. Each one wants something for you, in its own clumsy way. Warm them, and some will turn and walk beside you.

> Las formas que te cierran el paso no son personas. Son patrones: una duda, una voz que juzga, un miedo al borde del cambio. Cada uno quiere algo para ti, a su torpe manera. Témplalos, y algunos se darán la vuelta y caminarán a tu lado.

From the naming rule (patterns, never people), the needs in the bestiary (Doubt wants you not to fail; the Inner Critic wants you accepted; the Threshold Guardian keeps you safe from the unknown) and polarity (good intentions warm a projection until it turns to your side).

## Page 9 (`book-3`): one journey

> Above the roots, a great tree climbs into the sky. Below them, the floors go down, older and colder, to the silence. It is one journey, seen from both ends. What you learn at the bottom grows toward the light.

> Sobre las raíces, un gran árbol sube hasta el cielo. Bajo ellas, los pisos descienden, más antiguos y más fríos, hasta el silencio. Es un solo viaje, visto desde sus dos extremos. Lo que aprendes en el fondo crece hacia la luz.

From the premise ("the depths and the tree are one journey seen from its two ends") and the shape of the world (the roots, the circles going down to the frozen bottom and the silence, the tree above).

## Open questions for the owner

- Keep, change or replace each of the three pages.
- Should the book use a slot other than the start room's south wall (for example the secret panel behind the dig wall, which already speaks in the book's voice on page 1)?
- Should a book page ever change more than one slot (a page across two rooms)? Page 7 already uses two: its prose and its quotation.
- The quotation is about seventy words of a modern book; it is shown with full attribution as a quotation. Confirm the owner is comfortable quoting it at this length ([open question 16](OPEN-QUESTIONS.md)).
