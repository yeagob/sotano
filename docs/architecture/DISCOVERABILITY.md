# Discoverability: search, social previews and crawlers

How THE ROOTS is found and described outside the game: search engines, social networks, and AI
assistants and their crawlers. The game is a canvas, so everything a crawler can read lives in
the static HTML and in a few files in `public/`. Keep the facts in sync when the game's name,
address, language list or description changes.

## The canonical address

`https://sotano-yeagobs-projects.vercel.app/` (the Vercel deployment in the README). Every
absolute URL in `index.html`, `public/sitemap.xml` and `public/llms.txt` uses it. If a custom
domain is added, change all of them together (and the `canonical` link).

## What lives where

| File | Read by | What it does |
|---|---|---|
| `index.html` `<head>` | search engines, social networks, AI crawlers | Title, description, keywords, robots directive, canonical link, `hreflang` for English and Spanish, Open Graph and X/Twitter card tags, JSON-LD (`VideoGame` and `WebSite`) |
| `index.html` `<noscript>` | crawlers without JavaScript, players with scripts off | A short English description of the game and a link to the repository |
| `public/social-card.jpg` | social networks, link previews | 1200 × 630 JPEG (the cover, cropped around the title). Used by `og:image` and `twitter:image` |
| `public/robots.txt` | all crawlers | Everything allowed, the AI crawlers named explicitly, and the sitemap address |
| `public/sitemap.xml` | search engines | The one page, its Spanish alternate and its image |
| `public/llms.txt` | AI assistants and agents ([llmstxt.org](https://llmstxt.org)) | Summary, keywords and links to the play page and the documentation on GitHub |
| `src/i18n/dom.ts` | players and browsers | Sets `document.title` and the description meta from `seo.title` and `seo.description` in the active language |

## Languages

English is the source. `?lang=es` (or the browser's language, or the saved choice) selects
Spanish; the tab title and description then follow it. The static HTML stays English, which is
what crawlers that do not run scripts read. The `hreflang` links tell search engines that
`/?lang=es` is the Spanish version of the page.

## Rules when you change the game

- The name, the description and the keywords describe the game the way the README does. Keep
  `index.html` (`<head>`, `<noscript>`, the JSON-LD), `src/i18n/locales/en.ts` and `es.ts`
  (`seo.title`, `seo.description`), `public/llms.txt` and this file in step.
- Comparisons with other games (Minecraft, The Binding of Isaac, Noita) are descriptive, in plain
  text. Do not use their logos or artwork.
- The `<noscript>` text is English only on purpose: it is shown only where scripts are off,
  and the game needs scripts to run. Everything the game shows is translated (`sotano-i18n`).
- If the cover art changes, regenerate `public/social-card.jpg` (1200 × 630, title centred) and
  check it in a social card preview tool.
- Keep the description under about 160 characters, so search results do not cut it.
- Run `npm run typecheck && npm test` before committing: the i18n tests cover the new keys.

## Checking it

- `curl -s https://sotano-yeagobs-projects.vercel.app/ | head -60`: the head is there without
  JavaScript.
- Search engines: Google Search Console (add the property, submit `sitemap.xml`) and Bing
  Webmaster Tools. Rich results: Google's Rich Results Test on the page.
- Social: the Open Graph debugger of Facebook and LinkedIn's post inspector, and the card
  validator of X, on the page address.
