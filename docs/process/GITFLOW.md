# Git workflow: GitFlow

THE ROOTS is developed with GitFlow. `main` is always the last stable version. `develop` is where the next version is built and tested. Everything else lives on short-lived branches that come from one of those two and go back into them through a pull request.

This is the rule for code, docs, art, levels, the bestiary and the process itself.

## Branches

| Branch | Comes from | Goes into | Lives for | Name |
|---|---|---|---|---|
| `main` | | | forever | the stable version; every release is a tag on it |
| `develop` | `main` (once) | | forever | the integration branch; the default branch of the repository |
| `feature/<issue>-<slug>` | `develop` | `develop` | one issue | new behaviour, content or docs |
| `fix/<issue>-<slug>` | `develop` | `develop` | one issue | a bug that is not urgent |
| `release/<version>` | `develop` | `main`, then `develop` | one release | the last fixes and the version bump |
| `hotfix/<issue>-<slug>` | `main` | `main`, then `develop` | one fix | a bug in the stable version that cannot wait |

- `<issue>` is the GitHub issue number. Work without an issue is rare; open one first.
- `<slug>` is two to five words in lowercase, joined with dashes: `feature/42-cave-water-flow`.
- Delete a branch after it is merged. The history stays in the merge commit.

## Versions

Versions follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`, set in `package.json`. The build shows it next to the build stamp (`v0.1.1-dev · 2610291200`), so every tester can say which build they played.

- **`main` carries the released version**, `0.1.0` today. Each release is an annotated tag `v0.1.0` on that commit.
- **`develop` carries the next version with a `-dev` suffix**, `0.1.1-dev` today: the next release is a patch of 0.1.0 until the owner decides otherwise. The suffix ends when the release branch is cut.
- **`main` and `develop` hold the same code**, except for the version number in `package.json`.
- **Tester builds** are the tagged releases on `main`. `0.1.0` is the first one: the first stable version and the first one given to testers. A pre-release tag such as `v0.2.0-beta.1` can be cut from a `release/0.2.0` branch when testers need to try something before the stable tag.

Which part of the version changes:

- **PATCH** (`0.1.1`): fixes only, no new behaviour a player would notice.
- **MINOR** (`0.2.0`): new practices, floors, enemies, systems or languages.
- **MAJOR** (`1.0.0`): the release we call finished.

## Issues

Players and testers report through the [issue templates](../../.github/ISSUE_TEMPLATE/). Every issue gets a label and, once it is accepted for work, a milestone with the version it is aimed at.

1. **Triage.** The owner reads the issue, asks what is missing, and labels it (`bug`, `feature`, `question`, `needs-info`).
2. **Branch.** Create `feature/<issue>-<slug>` or `fix/<issue>-<slug>` from `develop`.
3. **Work.** Keep the branch small. Update the docs in the same branch, as the [documentation rules](../README.md) require, and keep every player-facing text in every shipped language.
4. **Pull request.** Open a PR into **`develop`**, fill in the template, and link the issue with `Closes #<issue>`.
5. **Checks.** The [CI workflow](../../.github/workflows/ci.yml) must be green: typecheck and tests.
6. **Review and merge.** The owner merges with a merge commit (not squash, not rebase), so the branch shows in the history, once CI is green. The owner is the only maintainer, so no second person has to approve; an agent review on the PR is optional and does not block the merge.

## Releases

A release is cut when `develop` has enough for a version, or on a steady rhythm, whichever comes first.

1. Create `release/<version>` from `develop`. Set `package.json` to the release version without the suffix (`npm version 0.2.0 --no-git-tag-version`). Fix only what the release needs.
2. Open a PR from `release/<version>` into **`main`**. CI must be green. Merge with a merge commit.
3. Tag the merge commit on `main`: `git tag -a v0.2.0 -m "THE ROOTS 0.2.0"`, then push the tag. Publish the changelog section of the version as the GitHub release notes.
4. Merge `main` back into `develop` (a PR `main` → `develop`, or a merge commit), and set `develop` back to `0.3.0-dev` (the next minor, with the suffix).
5. Delete the release branch.
6. Vercel deploys `main` to production and `develop` to a preview. The release is live when the production deployment for the tag is ready.

## Changelog

[CHANGELOG.md](../../CHANGELOG.md) is the record of what each version changed, written for players and testers. It is kept in the repository, so the release notes travel with the code.

- **Every pull request that merges into `develop` adds its entry to the changelog of the current version**, in the same branch. The entry is one line under the right heading (`Added`, `Changed`, `Fixed`, `Removed`), with the issue number: `- Locked doors open on contact, not from across the room (#5).`
- **The current version is the `## Unreleased` section at the top**, which is the version in `package.json` on `develop` (`0.1.1-dev` today). Entries go there, never into a finished version.
- **A PR with no changelog line is not ready to merge**, unless the change is invisible to players (a refactor, a test, a docs fix). Say so in the PR body.
- **Cutting a release** (step 1 of Releases): the `release/<version>` branch renames `## Unreleased` to `## <version> · <date>` and opens an empty `## Unreleased` above it.
- **Publishing a release**: the tag's changelog section is the release notes. Copy it into the GitHub release for the tag, and publish it with the tag on `main`.
- **Hotfixes** get their own `### Fixed` line under the new patch version.

## Hotfixes

For a bug in the stable version that cannot wait for the next release:

1. Create `hotfix/<issue>-<slug>` from `main`.
2. Fix, bump the PATCH version (`0.1.0` → `0.1.1`), and open a PR into **`main`**.
3. Tag `v0.1.1` on `main` after the merge.
4. Merge `main` into `develop` so the fix is not lost in the next release.

## Rules

- **No direct commits to `main`.** Every change reaches it through a `release/*` or `hotfix/*` pull request. CI blocks any other source branch.
- **No direct commits to `develop`** after the process is set up. Use a `feature/*` or `fix/*` branch.
- **Pull requests into `main` come only from `release/*` or `hotfix/*`.** The CI job `gitflow` enforces this.
- **Keep `develop` green.** A failing `develop` blocks every other branch; fix it first.
- **Docs travel with the change.** See [the documentation rules](../README.md).
- **Nothing ships untested.** `npm run typecheck && npm test` is the minimum before a PR.

## Setting it up on GitHub

These are settings, not files in the repository. The owner applies them once:

- **Default branch:** `develop`, so new pull requests target it without a choice.
- **Branch protection on `main`:** require a pull request, require the `CI` status checks, block force pushes and deletion.
- **Branch protection on `develop`:** require a pull request and the `CI` status checks; block force pushes and deletion.
- **Vercel:** production branch `main`; every other branch gets a preview.
- **Tags:** protect `v*` so a released tag cannot be moved.
