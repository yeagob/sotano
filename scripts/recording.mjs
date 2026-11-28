// Playwright recordings with their metadata (.claude/skills/sotano-recordings/SKILL.md). Every Playwright run of the game
// leaves a video and a metadata.json in .local/recordings/<feature>/<YYYY-MM-DD>_<HHMMSS>_<slug>/, written when the run
// ends, pass or fail. Gameplay clips for marketing are also copied to .local/marketing/gameplay/<base name>.webm.
//
//   const rec = await startRecording(browser, { feature, slug, issue, title, description, url, designDoc, seed });
//   const page = rec.page;          // the run's page (already at `url`)
//   rec.step('climb the back');     // a step, with its time
//   rec.element('toast', text);     // something that appeared on screen
//   await rec.shot('climb');        // an optional screenshot: shots/01-climb.png
//   await rec.finish({ result: 'pass' });

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const pad = (n, w = 2) => String(n).padStart(w, '0');

/** `YYYY-MM-DD` of a local time. */
export function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
/** `HH:MM:SS` of a local time. */
export function localTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

/** The run's folder name: `<YYYY-MM-DD>_<HHMMSS>_<slug>`, from the run's start (local time). */
export function runFolderName(start, slug) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`recording: the slug must be kebab-case, got "${slug}"`);
  return `${localDate(start)}_${localTime(start).replace(/:/g, '')}_${slug}`;
}

/** The commit under test and its branch, or nulls outside a git checkout. */
export function commitInfo(cwd = REPO) {
  const run = cmd => { try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };
  return { sha: run('git rev-parse --short HEAD'), branch: run('git rev-parse --abbrev-ref HEAD') };
}

/** The metadata of a run (SKILL.md §2), every field present. Pure: the caller gives the times. */
export function buildMetadata(o) {
  const result = o.result ?? 'info';
  return {
    title: o.title,
    description: o.description,
    feature: { slug: o.feature, designDoc: o.designDoc ?? null },
    issue: o.issue ?? null,
    date: localDate(o.start),
    startedAt: localTime(o.start),
    durationSeconds: Math.round(((o.end - o.start) / 1000) * 10) / 10,
    url: o.url ?? null,
    seed: o.seed ?? null,
    commit: o.commit ?? { sha: null, branch: null },
    elements: o.elements ?? [],
    steps: o.steps ?? [],
    result,
    failure: result === 'fail' ? String(o.failure ?? 'unknown failure') : null,
    files: o.files ?? [],
  };
}

/**
 * Opens a recorded browser context and its page. Options: feature, slug, title, description (required); issue, url,
 * seed, designDoc, viewport, marketing (also copy the video to .local/marketing/gameplay/), root (the folder that holds
 * .local; the repository by default), navigate (false: do not open `url`).
 */
export async function startRecording(browser, opts) {
  for (const k of ['feature', 'slug', 'title', 'description']) if (!opts[k]) throw new Error(`recording: "${k}" is required`);
  const root = opts.root ?? REPO;
  const start = new Date();
  const name = runFolderName(start, opts.slug);
  const dir = join(root, '.local', 'recordings', opts.feature, name);
  mkdirSync(dir, { recursive: true });
  const viewport = opts.viewport ?? { width: 1280, height: 720 };
  const context = await browser.newContext({ viewport, recordVideo: { dir, size: viewport } });
  const page = await context.newPage();
  const t0 = Date.now();
  const at = () => Math.round((Date.now() - t0) / 100) / 10;
  const steps = [], elements = [], files = [];
  let shots = 0, finished = null;

  const rec = {
    page, context, dir, name, start,
    step(what) { steps.push({ t: at(), what }); },
    element(name, text) { elements.push(text === undefined ? { t: at(), name } : { t: at(), name, text }); },
    async shot(label) {
      mkdirSync(join(dir, 'shots'), { recursive: true });
      const file = join('shots', `${pad(++shots)}-${label}.png`);
      await page.screenshot({ path: join(dir, file) });
      files.push(file.replace(/\\/g, '/'));
      return join(dir, file);
    },
    /** Ends the run: closes the context (the video is written), names it video.webm, writes metadata.json. Runs once. */
    async finish({ result = 'info', failure = null } = {}) {
      if (finished) return finished;
      const end = new Date();
      let videoPath = null;
      try { videoPath = await page.video()?.path(); } catch { /* no video */ }
      try { await context.close(); } catch { /* already closed */ }
      if (videoPath && existsSync(videoPath)) {
        const target = join(dir, 'video.webm');
        if (videoPath !== target) renameSync(videoPath, target);
        files.unshift('video.webm');
        if (opts.marketing) {
          const out = join(root, '.local', 'marketing', 'gameplay');
          mkdirSync(out, { recursive: true });
          copyFileSync(target, join(out, `${name}.webm`));
        }
      }
      const meta = buildMetadata({
        ...opts, start, end, steps, elements, result, failure, files: [...files, 'metadata.json'],
        commit: opts.commit ?? commitInfo(root),
      });
      writeFileSync(join(dir, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n');
      finished = meta;
      return meta;
    },
    /** Where the run folder is, relative to the root (for reports). */
    get relativeDir() { return relative(root, dir).replace(/\\/g, '/'); },
  };
  if (opts.url && opts.navigate !== false) {
    rec.step(`open ${opts.url}`);
    // a run that cannot even open its page still leaves its metadata (SKILL.md §4.2)
    try { await page.goto(opts.url); } catch (e) { await rec.finish({ result: 'fail', failure: e instanceof Error ? e.message : String(e) }); throw e; }
  }
  return rec;
}

/** Runs `body(rec)` inside a recording and always finishes it: a thrown error is written as `result: "fail"`. */
export async function recorded(browser, opts, body) {
  const rec = await startRecording(browser, opts);
  try {
    const result = (await body(rec)) ?? 'pass';
    return await rec.finish({ result });
  } catch (e) {
    await rec.finish({ result: 'fail', failure: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}
