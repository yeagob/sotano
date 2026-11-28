import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error: a plain ES module script with no type declarations
import { buildMetadata, recorded, runFolderName, startRecording } from '../scripts/recording.mjs';

const FIELDS = ['title', 'description', 'feature', 'issue', 'date', 'startedAt', 'durationSeconds', 'url', 'seed', 'commit', 'elements', 'steps', 'result', 'failure', 'files'];

/** A stand-in for Playwright's browser: a context whose page writes a fake video when the context closes. */
function fakeBrowser(opts: { gotoFails?: boolean } = {}) {
  const made: { dir: string }[] = [];
  return {
    made,
    async newContext(o: { recordVideo: { dir: string } }) {
      const video = join(o.recordVideo.dir, 'abc123.webm');
      made.push({ dir: o.recordVideo.dir });
      const page = {
        async goto() { if (opts.gotoFails) throw new Error('net::ERR_CONNECTION_REFUSED'); },
        async screenshot({ path }: { path: string }) { writeFileSync(path, 'png'); },
        video: () => ({ path: async () => video }),
      };
      return { newPage: async () => page, close: async () => { writeFileSync(video, 'webm'); } };
    },
  };
}

const roots: string[] = [];
const tempRoot = () => { const r = mkdtempSync(join(tmpdir(), 'rec-')); roots.push(r); return r; };
afterEach(() => { for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });

const OPTS = { feature: 'worm-desert', slug: 'ride-and-dismount', issue: 354, title: 'Ride the worm', description: 'Rides it.', url: 'http://localhost:5173/?test&seed=7', seed: '7', designDoc: 'docs/design/built/levels/worm-desert/WORM.md', commit: { sha: 'abc1234', branch: 'test' } };

describe('Playwright recordings (sotano-recordings)', () => {
  it('names the run folder <YYYY-MM-DD>_<HHMMSS>_<slug> from its local start time, and refuses a slug that is not kebab-case', () => {
    expect(runFolderName(new Date(2026, 10, 28, 9, 5, 7), 'ride-and-dismount')).toBe('2026-11-28_090507_ride-and-dismount');
    expect(() => runFolderName(new Date(), 'Ride and Dismount')).toThrow();
  });

  it('builds metadata with every field of the skill, its date, start, duration to one decimal and no failure on a pass', () => {
    const start = new Date(2026, 10, 28, 9, 5, 7), end = new Date(start.getTime() + 12_345);
    const m = buildMetadata({ ...OPTS, start, end, result: 'pass' });
    expect(Object.keys(m)).toEqual(FIELDS);
    expect(m.date).toBe('2026-11-28');
    expect(m.startedAt).toBe('09:05:07');
    expect(m.durationSeconds).toBe(12.3);
    expect(m.feature).toEqual({ slug: 'worm-desert', designDoc: 'docs/design/built/levels/worm-desert/WORM.md' });
    expect(m.failure).toBeNull();
  });

  it('writes the folder, video.webm, shots and metadata.json with the steps and elements in order, and the marketing copy', async () => {
    const root = tempRoot();
    const rec = await startRecording(fakeBrowser(), { ...OPTS, root, marketing: true });
    rec.step('climb the back');
    rec.element('toast', 'You are on its back.');
    rec.element('boss bar');
    await rec.shot('climb');
    const meta = await rec.finish({ result: 'pass' });
    expect(rec.dir).toBe(join(root, '.local', 'recordings', 'worm-desert', rec.name));
    expect(rec.name).toMatch(/^\d{4}-\d{2}-\d{2}_\d{6}_ride-and-dismount$/);
    const written = JSON.parse(readFileSync(join(rec.dir, 'metadata.json'), 'utf8'));
    expect(written).toEqual(meta);
    expect(Object.keys(written)).toEqual(FIELDS);
    expect(written.result).toBe('pass');
    expect(written.steps.map((s: { what: string }) => s.what)).toEqual([`open ${OPTS.url}`, 'climb the back']);
    expect(written.elements.map((e: { name: string; text?: string }) => [e.name, e.text])).toEqual([['toast', 'You are on its back.'], ['boss bar', undefined]]);
    expect(written.files).toEqual(['video.webm', 'shots/01-climb.png', 'metadata.json']);
    expect(existsSync(join(rec.dir, 'video.webm'))).toBe(true);
    expect(existsSync(join(rec.dir, 'shots', '01-climb.png'))).toBe(true);
    expect(existsSync(join(root, '.local', 'marketing', 'gameplay', `${rec.name}.webm`))).toBe(true);
    // finish runs once
    expect(await rec.finish({ result: 'fail', failure: 'late' })).toBe(meta);
  });

  it('a failed run still writes its metadata with result fail and the error', async () => {
    const root = tempRoot();
    let dir = '';
    await expect(recorded(fakeBrowser(), { ...OPTS, root }, async (rec: { dir: string; step(w: string): void }) => {
      dir = rec.dir;
      rec.step('get on the back');
      throw new Error('the rider fell');
    })).rejects.toThrow('the rider fell');
    const m = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
    expect(m.result).toBe('fail');
    expect(m.failure).toBe('the rider fell');
    expect(m.steps.at(-1).what).toBe('get on the back');
    expect(Object.keys(m)).toEqual(FIELDS);
  });

  it('a run that cannot open its page still writes its metadata, failed', async () => {
    const root = tempRoot();
    const browser = fakeBrowser({ gotoFails: true });
    await expect(startRecording(browser, { ...OPTS, root })).rejects.toThrow('ERR_CONNECTION_REFUSED');
    const m = JSON.parse(readFileSync(join(browser.made[0].dir, 'metadata.json'), 'utf8'));
    expect(m.result).toBe('fail');
    expect(m.failure).toContain('ERR_CONNECTION_REFUSED');
  });
});
