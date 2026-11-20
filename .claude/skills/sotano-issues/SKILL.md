---
name: sotano-issues
description: How to resolve a GitHub issue for The Roots end to end, from reading it to closing it. Covers reading and classifying the issue, sizing it and assigning Opus (design), Haiku (implementation) and Sonnet (read-only validation), branching and worktrees from develop, implementing and verifying, integrating parallel work, review, push, the pull request, CI and merge, deleting the branch and closing the issue. Use it whenever the owner asks to work on an issue, a set of issues or an iteration. Git and GitHub rules are in sotano-github; also use sotano-docs, sotano-i18n and the skill of the area changed.
---

# Resolving an issue (The Roots)

Rules for the main session (the orchestrator). Branch, commit, merge, CI and deploy rules are in `sotano-github`. Every `gh` command takes `--repo yeagob/sotano`.

**Shared checkout.** `D:\Projects\Sotano` is used by other sessions. Never commit to it, never apply a patch to it, never run `git stash`. All work happens in a worktree under `D:\Projects\Sotano\.claude\worktrees\`.

## 1. Read the issue

```
gh issue view <n> --repo yeagob/sotano --comments
gh issue view <n> --repo yeagob/sotano --json state,labels,milestone,closedByPullRequestsReferences
```

- Labels in use: `bug`, `feature`, `question`, `needs-info` (`docs/process/GITFLOW.md`, Issues). A `needs-info` issue is not started: ask the owner what is missing.
- The repo has no `design` or `layout` label. Classify the issue yourself from its body: bug, feature, design (a rule, a mechanic or a story point) or layout (rooms and room templates).
- `closedByPullRequestsReferences` lists linked PRs. Check them before you start, so the work is not done twice (issue #157 was closed by PR #249).
- Find the design text it touches with the Grep tool: search `docs/design/built/` (what exists) and `docs/design/not-built/` (decided or proposed). Use `sotano-design` for any design change.
- If the issue is unclear about meaning, names, story, tone or scope, ask the owner before you write anything (`sotano-docs`, section 3). Otherwise decide and say what you decided.

## 2. Size, path and roles

- **Small change** (one bug, one item, one doc fix): one branch, one PR, done directly in one worktree.
- **Iteration** (several issues, or a feature with parts): one integration branch that collects the parts, then one PR. The practices iteration (PR #249) is the model.

Roles:

- **Opus 5.5 designs and decides.** It writes the spec, the numbers, the tests that define done and the art or design rulings.
- **Haiku 5.5 implements, at high effort.** Agent call with `model: "haiku"` and `effort: "high"`. It writes code and docs that follow an Opus design.
- **Sonnet 5.5 validates, read-only.** Agent call with `model: "sonnet"`. It reviews a diff and returns PASS or FAIL. It never edits.
- **Doubts go to an Opus advisor.** A fresh Agent call with `model: "opus"` and the minimum context: the question, the file paths and the options. The advisor decides; the orchestrator follows the decision.
- **The orchestrator decides.** It leaves a choice to the owner only when the choice is about meaning, names, story, tone or scope, or when it truly must.

Use a fresh Agent call (not a fork) for implementation and validation. Give each agent its worktree path, its branch and its base commit. Do not use the Agent tool's `isolation: "worktree"` for an iteration (see Lessons).

## 3. Branch and worktree

Branch names (`sotano-github` has the full list):

- One issue: `feature/<issue>-<slug>`, or `fix/<issue>-<slug>` for a bug that is not urgent. Both come from `origin/develop`.
- An iteration: one integration branch `feature/<name>` from `origin/develop`, for example `feature/practices-iteration`.
- A part of an iteration, when an agent works on it alone: a short branch such as `port/<slug>` from the integration branch.

Create every worktree with an explicit base:

```
git fetch origin
git worktree add -b feature/<issue>-<slug> D:/Projects/Sotano/.claude/worktrees/<name> origin/develop
git -C D:/Projects/Sotano/.claude/worktrees/<name> log --oneline -1
```

The `log` line must show the commit you passed as the base. If it does not, stop and fix the worktree before any work. For a part of an iteration, the base is the integration branch: `git worktree add -b port/<slug> <path> feature/<name>`.

## 4. Implement and verify

Work in the worktree:

1. Implement. Load the skill of each area the change touches: `sotano-docs` (every change), `sotano-i18n` (every player-readable text, in English and Spanish), `sotano-items`, `sotano-levels`, `sotano-art`, `sotano-controls`, `sotano-popups`, `sotano-book`, `sotano-achievements`.
2. Changelog: add one line under `## Unreleased` in `CHANGELOG.md`, with the issue number (`docs/process/GITFLOW.md`, Changelog). A change to the tutorial or the book names only the action, never the content.
3. Checks, both must pass:

   ```
   npm run typecheck
   npx vitest run
   ```

   `npm test` is the same as `npx vitest run` (`package.json`). CI runs `npm run typecheck` and `npm test`.
4. Sandbox, when a scenario or a report can change:

   ```
   npm run sandbox -- --check
   npm run sandbox -- --all
   git status --short src/sandbox/reports
   ```

   `--check` exits 1 on a diff. Run `--all` only when the change alters scenarios. Then review every report that changed (`git diff -- src/sandbox/reports`). A report that changed without a reason is a bug: revert it and find the cause.
5. Seed pins. The seed version is `GEN_VERSION` in `src/core/seed.ts`. The golden test is `seed 0xBEEF builds the same world it always did` in `tests/rng.test.ts`. The pins are re-recorded once per iteration, on the integration branch, not per PR. Do not bump `GEN_VERSION` for a version that was not released: the practices iteration kept 38 because v38 was not released (PR #249).
6. Commit only the named files (`sotano-github`, Commits).

## 5. Integrate parallel work

Each agent works in its own worktree and commits by name. In the integration worktree:

```
git merge --no-edit port/<slug>
```

When a branch cannot be merged and its patch must be ported, export the patch from the base and apply it with three-way merge. Run the commands in the worktree of the target, never in the main checkout:

```
git rev-parse --show-toplevel
git diff <base>..port/<slug> > <scratchpad>/<slug>.patch
git apply -3 <scratchpad>/<slug>.patch
```

`<base>` is the merge base of the two branches (`git merge-base port/<slug> feature/<name>`).

- Expect conflicts in shared files: `src/core/stats.ts`, `src/game/game.ts`, `src/content/items/index.ts`, `src/content/synergies.ts`, the locales in `src/i18n/locales/`. Resolve them keeping both sides. Never drop an entry (an item, a synergy, a stat, a locale key).
- A port never touches the seed version (`GEN_VERSION`) or the pins. If a patch changes them, remove that part of the patch.
- After every merge or port, run the checks of step 4 again.

## 6. Validate

Start a fresh Sonnet agent, read-only. Give it `git diff origin/develop...<branch>`, the issue text and the list of checks it must confirm. It returns **PASS** or **FAIL** with the findings. On FAIL, fix the branch (Haiku), then ask for a new review. Do not push before PASS.

## 7. Push (owner gate)

Push only after the owner says yes, or when the owner asked you to push and merge. Before pushing, check that the branch holds only your commits:

```
git log --oneline origin/develop..feature/<issue>-<slug>
git push -u origin feature/<issue>-<slug>
```

## 8. Pull request

Write the PR body to a file in the scratchpad, not in the repo. Fill the sections of `.github/PULL_REQUEST_TEMPLATE.md`:

- **Summary:** what changed, from the player's side when it is a game change.
- **Validation:** the outputs of the checks that ran (typecheck, the vitest count, the sandbox result). Paste the result lines, not a summary of them.
- **Not verified:** what was not checked (for example a browser, gamepad or touch check, or the art gate).
- **Closes #n** only for an issue fully resolved; **Refs #n** for a partial one.
- The last line: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

```
gh pr create --repo yeagob/sotano --base develop --head feature/<issue>-<slug> --title "<title>" --body-file <scratchpad>/pr-body.md
```

The title must not spoil the tutorial or the book (`docs/process/GITFLOW.md`, Changelog).

Track the PR with the session tools: load them with `ToolSearch` (`select:mcp__ccd_pr__bind_pr,mcp__ccd_pr__get_status`), then bind the PR with `mcp__ccd_pr__bind_pr` and read its state with `mcp__ccd_pr__get_status`. Do not poll CI yourself.

## 9. CI and merge

- `develop` requires the status check `CI` (typecheck and tests, Ubuntu, Node 24). The `gitflow` job runs on every PR, but only `main` requires it.
- Merge only when `CI` is green (`mcp__ccd_pr__get_status`).

```
gh pr merge <n> --repo yeagob/sotano --merge
```

- Merge commit only (`--merge`), never `--squash` or `--rebase`. The history shows merge commits (`Merge pull request #249`).
- Never `--admin` to bypass a required check without the owner's explicit yes. `develop` does not enforce admins, so the command would work: that is why the rule exists.
- Never `--auto` unless the owner asked for it.

## 10. Delete the branch

Remove the worktree first: git refuses to delete a branch that a worktree has checked out.

```
git worktree remove D:/Projects/Sotano/.claude/worktrees/<name>
git push origin --delete feature/<issue>-<slug>
git branch -d feature/<issue>-<slug>
```

`git branch -d` refuses a branch with unmerged commits. Ask the owner before any `git branch -D` or before deleting a branch that has unmerged commits.

## 11. Close the issue

```
gh issue view <n> --repo yeagob/sotano --json state
```

A merged PR with `Closes #n` closes the issue on the default branch, `develop` (issue #157 was closed this way by PR #249). If the state is still `OPEN` after a `Closes` merge, or the issue was only `Refs`, close it:

```
gh issue close <n> --repo yeagob/sotano --comment "<what landed>. PR: <url>"
```

Close a `Refs` issue only when the owner says it is done.

## 12. Report

Say what is done, what is not verified, and the links (PR, issue). Quote the output lines that prove each check. Never say a step passed without its output.

## Lessons from this iteration

- **Wrong base.** The Agent tool's `isolation: "worktree"` branches from develop, not from the integration branch, so it leaves out unmerged iteration work. That caused a wrong-base incident. Create worktrees with `git worktree add -b <branch> <path> <base>` and check `git log --oneline -1`.
- **Conflicts in shared files.** `git apply -3` conflicts land in the shared files of step 5. Keep both sides; never drop an entry.
- **The shared checkout.** Never commit to it or apply a patch to it. Before any apply, run `git rev-parse --show-toplevel` and check that it is your worktree.
- **No python here.** `python3` is not usable on this machine. Write scripts in node or PowerShell.
- **Overlapping local edits.** A merge can fail when uncommitted doc edits overlap the incoming commit. Commit your named doc files first, then merge. Do not stash.
