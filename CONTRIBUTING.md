# Contributing to THE ROOTS

Thank you for wanting to help. You can report a bug, suggest an idea, send a fix, write a level, draw, compose, translate or test. The full workflow is in [docs/process/GITFLOW.md](docs/process/GITFLOW.md); this page is the short version.

## Report an issue

Use one of the templates in [New issue](https://github.com/yeagob/sotano/issues/new/choose): **bug report** or **feature request**. Questions can be opened as an issue too. For a bug, say which build you played (the number at the foot of the menu, such as `v0.1.0 · 2610291200`), your device and browser, and the steps to reproduce it.

## Send a change

1. **Start from an issue.** Open one first if there is none, so we can agree on the idea before you spend time on it.
2. **Branch from `develop`:** `feature/<issue>-<slug>` for new things, `fix/<issue>-<slug>` for bugs.
3. **Check it locally:**
   ```bash
   npm run typecheck && npm test
   ```
4. **Update the docs** in the same change, when you change behaviour (see [docs/README.md](docs/README.md)).
5. **Open a pull request into `develop`**, not `main`. Fill in the template and link the issue with `Closes #<issue>`.

`main` is the stable version. It only changes through release and hotfix branches, which the maintainer cuts.

## Ground rules

- Comments, docs and identifiers are in **English**. Player-facing text is in `src/i18n/`, in every shipped language.
- Content (materials, items, rooms, enemies) is data in `src/content/`. Prefer adding data over special cases in the game loop.
- **No third-party game assets or names.** Practices use generic technique names or public-domain works.
- Be kind in issues and reviews. We are a small project made in spare time.
