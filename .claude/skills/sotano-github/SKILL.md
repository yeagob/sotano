---
name: sotano-github
description: Version control and GitHub for The Roots (yeagob/sotano): GitFlow branches, naming, worktrees, commits, pull requests, merges, the CI and gitflow checks, branch cleanup, and the deploy-to-main process (marked pending review, with the steps that could not be verified listed). Use it for every branch, commit, worktree, pull request, merge, tag or release. The issue-by-issue process is in sotano-issues.
---

# Git and GitHub for The Roots

The repo follows GitFlow. The written rules are in `docs/process/GITFLOW.md` (the source of truth; this skill repeats the parts agents use) and the short version in `CONTRIBUTING.md`. Every `gh` command takes `--repo yeagob/sotano`.

## 1. Branches

| Branch | Comes from | Goes into | Lives for |
|---|---|---|---|
| `main` | | | forever; the stable version, every release is a tag on it |
| `develop` | `main` (once) | | forever; the default branch and the integration branch |
| `feature/<issue>-<slug>` | `develop` | `develop` | one issue |
| `fix/<issue>-<slug>` | `develop` | `develop` | one issue; a bug that is not urgent |
| `release/<version>` | `develop` | `main`, then `develop` | kept as history |
| `hotfix/<issue>-<slug>` | `main` | `main`, then `develop` | one fix |
| `chore/<slug>` or `chore/back-merge-<version>` | `develop` | `develop` | one change with no issue (process, docs, back-merge) |
| `docs/<slug>` | `develop` | `develop` | docs-only work with no issue |
| `port/<slug>` | an integration branch | the integration branch | one part of an iteration |

- `<slug>` is two to five lowercase words joined with dashes: `feature/42-cave-water-flow`.
- Feature, fix, hotfix, chore and docs branches are deleted when their PR is merged. Release branches are kept.
- Pull requests into `main` come only from `release/*` or `hotfix/*`. The `gitflow` job in `.github/workflows/ci.yml` fails any other source.
- Never commit straight to `main`, and not to `develop` either. Use a branch.
- Branch from `origin/develop` (after `git fetch origin`), not from a local branch you cannot vouch for.

## 2. Versions

- `package.json` holds the version. `develop` carries the next version with `-dev` (today `0.2.9-dev`). `main` carries the released version (today `0.2.8-alpha`, tag `v0.2.8-alpha`).
- Fixes and small changes after a release are patches. The owner decides when a MINOR comes.
- Tags are annotated (`git cat-file -t v0.2.6-alpha` prints `tag`).

## 3. Worktrees

Work in a worktree, never in the shared checkout `D:\Projects\Sotano` (other sessions commit there).

```
git worktree add -b feature/<issue>-<slug> D:/Projects/Sotano/.claude/worktrees/<name> origin/develop
git -C D:/Projects/Sotano/.claude/worktrees/<name> log --oneline -1
git worktree list
git worktree remove D:/Projects/Sotano/.claude/worktrees/<name>
```

- Always pass the base explicitly. The Agent tool's `isolation: "worktree"` branches from develop and does not include unmerged work from an integration branch (a wrong-base incident). Check the `log --oneline -1` line in every new worktree.
- Remove the worktree before deleting its branch.

## 4. Commits

- **Name the files.** `git add -- <path> <path>`. Never `git add -A`, `git add .` or `git commit -a` / `-am` in the shared checkout: a `-am` once swept ten unrelated files into a commit.
- Check what you are about to commit: `git status --short` and `git diff --cached --stat`.
- End every commit message with the `Co-Authored-By` line that the session's attribution note gives you. Example for this session's model:

```
git commit -m "Document the issue and GitHub process as skills" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

- In PowerShell, for a longer message, use a single-quoted here-string with the closing `'@` at column 0:

```
git commit -F - <<'EOF'
Subject line

Body.

Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
EOF
```

  (Git Bash only. In PowerShell use `git commit -m @'` ... `'@` with the same text.)
- Do not use `git stash` in this repo. Commit your named files instead.
- Before any push, check for commits you did not make: `git log --oneline origin/develop..<branch>`.

## 5. Pull requests

- Base `develop` for `feature/*`, `fix/*`, `chore/*`, `docs/*`. Base `main` only for `release/*` and `hotfix/*`.

```
gh pr create --repo yeagob/sotano --base develop --head feature/<issue>-<slug> --title "<title>" --body-file <file>
gh pr view <n> --repo yeagob/sotano --json state,mergeCommit,baseRefName,headRefName
gh pr checks <n> --repo yeagob/sotano
```

- The body follows `.github/PULL_REQUEST_TEMPLATE.md`. `Closes #n` only for a fully resolved issue; `Refs #n` for a partial one.
- A PR into `develop` adds one line to `CHANGELOG.md` under `## Unreleased`, unless the change is invisible to players. Say so in the body if there is no line.
- Titles and changelog lines for the tutorial and the book name only the action (`The book was changed.`). Never spoil a page.
- End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Sessions track a PR with `mcp__ccd_pr__bind_pr` and read it with `mcp__ccd_pr__get_status` (load them with ToolSearch first).

## 6. CI checks

- **`CI`** (`.github/workflows/ci.yml`, job name `CI`): on pull requests and on pushes to `main` and `develop`. Runs `npm ci`, `npm run typecheck`, `npm test` on Ubuntu with Node 24.
- **`gitflow`** (same file, job name `gitflow`): on pull requests only. Fails a PR into `main` unless its source is `release/*` or `hotfix/*`. For a PR into `develop` it prints `OK` and passes.
- Branch protection, read with `gh api repos/yeagob/sotano/branches/<branch>/protection`: `develop` requires the check `CI`, requires 0 approvals, does not enforce admins, blocks force pushes and deletion. `main` requires `CI` and `gitflow`.
- Do not poll CI in a loop. Read it once with `gh pr checks` or `mcp__ccd_pr__get_status`.

## 7. Merge

```
gh pr merge <n> --repo yeagob/sotano --merge
```

- Merge commit only. Never `--squash` or `--rebase` (`GITFLOW.md`, Review and merge). The history of this repo is merge commits (`Merge pull request #249 from yeagob/feature/practices-iteration`).
- Merge only when `CI` is green.
- Never `--admin` without the owner's explicit yes, even though `develop` does not enforce admins.
- Never `--auto` unless the owner asked for it.
- `--delete-branch` (`-d`) deletes the local and remote branch. It fails for a branch a worktree still has checked out: remove the worktree first.

## 8. Branch cleanup

```
git worktree remove D:/Projects/Sotano/.claude/worktrees/<name>
git push origin --delete <branch>
git branch -d <branch>
```

- Release branches are not deleted.
- Ask the owner before deleting a branch that has unmerged commits (`git branch -D`, or `git push origin --delete` of unmerged work).

## 9. Hotfix (from GITFLOW.md)

1. `hotfix/<issue>-<slug>` from `main`.
2. Fix it. Set the hotfix version in `package.json` (`0.1.2-f1`, then `-f2`). The build shows it as `0.1.2.f1`.
3. PR into `main` (allowed only from `hotfix/*`), CI green, merge commit.
4. Tag the merge commit with the dotted label (`v0.1.2.f1`), publish its changelog section as the GitHub release.
5. Back-merge `main` into `develop` (section 10, step 4), so the fix is not lost.

The `-f1` form in `package.json` is documented in `GITFLOW.md`; no hotfix in the repo's history has been checked against it. To confirm with the owner before the first hotfix.

## 10. Deploy to main

**PENDING REVIEW.** The owner has not approved these steps as written. Each step says where it comes from. Ask the owner before any deploy: a tag push, a GitHub release, or a merge into `main` each need a yes.

1. **Cut the release branch from develop.** `git worktree add -b release/<version> <path> origin/develop`. *Source: GITFLOW.md, Releases 1. Matches PR #242 (`release/0.2.6-alpha` into `main`).*
2. **Set the version** in `package.json`, without the dev suffix: `npm version <version> --no-git-tag-version` (an alpha keeps its label, `npm version 0.2.6-alpha --no-git-tag-version`). *Source: GITFLOW.md. Verified: `main` has `"version": "0.2.6-alpha"`.*
3. **Turn the changelog's `## Unreleased` into the version's heading** (`## <version> · <date>`) and open an empty `## Unreleased` above it. *Source: GITFLOW.md, Changelog. Verified: `origin/main` `CHANGELOG.md` has `## Unreleased`, then `## 0.2.6-alpha · 2026-11-19`.*
4. **PR `release/<version>` into `main`**, CI and `gitflow` green, merge commit. The PR body names the changes and says that `develop` returns to the dev version after the back-merge. *Source: GITFLOW.md, Releases 2. Verified: PR #242.*
5. **Tag the merge commit on `main`**, annotated: `git tag -a v<version> <merge-sha> -m "THE ROOTS <version>"`, then push the tag with `git push origin v<version>`. *Source: GITFLOW.md, Releases 3. Verified: the tags are annotated. The push command and who runs it: to confirm with the owner.* A cloud session can be refused the tag push: the GitHub remote answers HTTP 403 (seen for `v0.2.8-alpha`, which was tagged locally and not pushed). Do not retry a 403. Report it, and the owner pushes the tag from their machine or grants the push. Check the result with `git ls-remote --tags origin v<version>`.
6. **GitHub release for the tag**, with the tag's changelog section as the notes, marked pre-release for an alpha. *Source: GITFLOW.md, Releases 3 and Changelog. Verified: `gh release list` shows `v0.2.6-alpha` as Pre-release and `v0.2.4` as Latest. How it is created (command, flags, draft or not): to confirm with the owner. Check flags with `gh release create --help`; do not guess them. In a cloud session the GitHub tools cannot create a release (they only read releases), so the owner creates it, or it is done from a machine with `gh`.*
7. **Back-merge `main` into `develop`**: a `chore/back-merge-<version>` branch from `origin/develop`, `origin/main` merged into it, a PR into `develop`. *Source: GITFLOW.md, Releases 4. Verified: PR #243 (`chore/back-merge-0.2.5`), PR #244 (`chore/back-merge-0.2.6`) and PR #280 (`chore/back-merge-0.2.8-alpha`, which set `develop` to `0.2.9-dev`) into `develop`. The exact merge command and how the version conflict is resolved: to confirm with the owner.*
8. **Set `develop` back to the next dev version**, `npm version <next>-dev --no-git-tag-version` (for example `0.2.7-dev` after 0.2.6-alpha). *Source: GITFLOW.md, Releases 4. Verified: `develop` carries `0.2.7-dev`. The owner decides when the next MINOR comes.*
9. **Keep the release branch.** `release/<version>` stays on the remote and locally. *Source: GITFLOW.md, Releases 5. Verified locally: the worktree `release-0.2.6-alpha` exists. The remote branch: to confirm with `git ls-remote --heads origin release/<version>`.*
10. **Production deploy.** The GITFLOW doc says Vercel deploys `main` to production and `develop` to a preview, and that the release is live when the tag's production deployment is ready. *Source: GITFLOW.md, Releases 6. Not verifiable from the repo: there is no `vercel.json`, and `.vercel` is ignored. To confirm with the owner: the Vercel project settings and how to check that the deployment is ready. Verified by the owner: `v0.2.8-alpha` (merge `8a51768`, PR #278) was live in production on 2026-11-21, as the owner stated in the session; no check from the repo or the GitHub tools.*

## 11. Settings the owner applies (not in the repo)

From `GITFLOW.md`, Setting it up on GitHub: default branch `develop`; branch protection on `main` and `develop`; Vercel production branch `main`; protected `v*` tags. Read the protection with the `gh api` command in section 6. Tag protection and the Vercel settings cannot be read from the repo: to confirm with the owner.
