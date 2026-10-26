// Event bus with priorities and a mutable/cancellable context (see docs/ITEMS.md §4).
// It is the backbone of synergies: items, synergies (and later rooms, curses, enemies) hook in here.
//
// Rules:
//  - Lower priority runs first. 0–99 modify the payload, 100–199 may cancel, 200+ side effects
//    (which must not cancel).
//  - A hook that throws is logged with its source and skipped; it never breaks the frame.
//  - Nested emits are capped at MAX_DEPTH: past it the event is cancelled ("fail closed":
//    nothing happens), so a protective hook can never be bypassed by a deep chain.
//  - Chain reactions go through `defer`, owned by a source so they die with it, capped at MAX_DEFERRED.
//  - A hook slower than SLOW_HOOK_MS is reported once.

export interface EventCtx {
  cancelled: boolean;
  cancel(): void;
  /** Hooks that touched this event (only filled in when `bus.trace = true`). */
  touchedBy?: string[];
}

export type Hook<C> = { priority: number; source: string; id?: string; fn: (ctx: C) => void };

export const MAX_DEPTH = 8;
/** A hook slower than this (ms) is reported once: it would stutter the frame. */
const SLOW_HOOK_MS = 4;
/** Safety cap for queued chain reactions; past it the oldest are dropped. */
const MAX_DEFERRED = 5000;

export class EventBus<Events extends { [K in keyof Events]: object }> {
  private hooks = new Map<keyof Events, Hook<any>[]>();
  private depthNow = 0;
  private deferred: { fn: () => void; source: string }[] = [];
  private slowReported = new Set<string>();
  trace = false;

  /** Events only the core loop may emit, never from inside a hook (e.g. `death`, `doorOpen`):
   *  emitting one nested is a bug and is reported once. Cancelling them at the depth cap would
   *  change their meaning (a cancelled `death` means "survive"). */
  constructor(private rootOnly: readonly (keyof Events)[] = []) {}

  /** How many emits are running right now (0 = called from the core loop). */
  get depth() { return this.depthNow; }

  on<K extends keyof Events>(type: K, hook: Hook<Events[K] & EventCtx>): () => void {
    const list = this.hooks.get(type) ?? [];
    list.push(hook);
    list.sort((a, b) => a.priority - b.priority); // stable: equal priorities keep install order
    this.hooks.set(type, list);
    return () => this.off(type, hook.source);
  }

  /** Removes every hook from a `source` (on one event, or all with `null`) and its pending deferred calls. */
  off(type: keyof Events | null, source: string) {
    for (const [k, list] of this.hooks) {
      if (type !== null && k !== type) continue;
      this.hooks.set(k, list.filter(h => h.source !== source));
    }
    if (type === null) this.deferred = this.deferred.filter(d => d.source !== source);
  }

  /** Emits the event and returns the context (as modified by the hooks). */
  emit<K extends keyof Events>(type: K, payload: Events[K]): Events[K] & EventCtx {
    const ctx = payload as Events[K] & EventCtx;
    ctx.cancelled = false;
    ctx.cancel = () => { ctx.cancelled = true; };
    if (this.trace) ctx.touchedBy = [];
    if (this.depthNow > 0 && this.rootOnly.includes(type) && !this.slowReported.has('root:' + String(type))) {
      this.slowReported.add('root:' + String(type));
      console.error(`[events] "${String(type)}" emitted from inside a hook (depth ${this.depthNow}); it must only come from the core loop`);
    }
    if (this.depthNow >= MAX_DEPTH) {
      ctx.cancelled = true;
      if (!this.slowReported.has('depth:' + String(type))) {
        this.slowReported.add('depth:' + String(type));
        console.warn(`[events] max depth reached on "${String(type)}": cancelled`);
      }
      return ctx;
    }
    this.depthNow++;
    try {
      for (const h of this.hooks.get(type) ?? []) {
        try {
          const t0 = performance.now();
          h.fn(ctx);
          const ms = performance.now() - t0;
          if (ms > SLOW_HOOK_MS && !this.slowReported.has(h.source + h.id)) {
            this.slowReported.add(h.source + h.id);
            console.warn(`[events] hook ${h.source}${h.id ? '.' + h.id : ''} took ${ms.toFixed(1)} ms on "${String(type)}"`);
          }
        } catch (err) {
          console.error(`[events] hook ${h.source}${h.id ? '.' + h.id : ''} failed on "${String(type)}"`, err);
        }
        ctx.touchedBy?.push(h.id ? `${h.source}.${h.id}` : h.source);
        if (ctx.cancelled) break;
      }
    } finally {
      this.depthNow--;
    }
    return ctx;
  }

  /** Chain reactions: they run in `flush()`, outside the stack of the event that caused them. */
  defer(fn: () => void, source = 'core') {
    this.deferred.push({ fn, source });
    if (this.deferred.length > MAX_DEFERRED) {
      this.deferred.splice(0, this.deferred.length - MAX_DEFERRED);
      if (!this.slowReported.has('deferred-cap')) {
        this.slowReported.add('deferred-cap');
        console.warn(`[events] more than ${MAX_DEFERRED} chain reactions queued; dropping the oldest`);
      }
    }
  }

  /** Runs at most `budget` deferred reactions (the rest wait for the next frame). */
  flush(budget = 64) {
    let n = 0;
    while (this.deferred.length && n++ < budget) {
      const d = this.deferred.shift()!;
      try { d.fn(); } catch (err) { console.error(`[events] deferred call from ${d.source} failed`, err); }
    }
  }

  clearDeferred() { this.deferred = []; }

  get pending() { return this.deferred.length; }

  /** Every hook per event, in run order: for debugging exceptions (`S.hooks()` in the console). */
  dump(): Record<string, { priority: number; source: string; id?: string }[]> {
    const out: Record<string, { priority: number; source: string; id?: string }[]> = {};
    for (const [k, list] of this.hooks) {
      if (list.length) out[String(k)] = list.map(h => ({ priority: h.priority, source: h.source, id: h.id }));
    }
    return out;
  }
}
