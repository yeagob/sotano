// Event bus with priorities and a mutable/cancellable context (see docs/ITEMS.md §4).
// It is the backbone of synergies: items, synergies (and later rooms, curses, enemies) hook in here.
//
// Rules:
//  - Lower priority runs first. 0–99 modify the payload, 100–199 may cancel, 200+ side effects
//    (which must not cancel).
//  - A hook that throws is logged with its source and skipped; it never breaks the frame.
//  - Nested emits are capped at MAX_DEPTH: past it the event runs with no hooks (default
//    behaviour) instead of being dropped.
//  - Chain reactions go through `defer`, owned by a source so they die with it.

export interface EventCtx {
  cancelled: boolean;
  cancel(): void;
  /** Hooks that touched this event (only filled in when `bus.trace = true`). */
  touchedBy?: string[];
}

export type Hook<C> = { priority: number; source: string; id?: string; fn: (ctx: C) => void };

const MAX_DEPTH = 8;

export class EventBus<Events extends { [K in keyof Events]: object }> {
  private hooks = new Map<keyof Events, Hook<any>[]>();
  private depth = 0;
  private deferred: { fn: () => void; source: string }[] = [];
  trace = false;

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
    if (this.depth >= MAX_DEPTH) {
      console.warn(`[events] max depth reached on "${String(type)}": running without hooks`);
      return ctx;
    }
    this.depth++;
    try {
      for (const h of this.hooks.get(type) ?? []) {
        try {
          h.fn(ctx);
        } catch (err) {
          console.error(`[events] hook ${h.source}${h.id ? '.' + h.id : ''} failed on "${String(type)}"`, err);
        }
        ctx.touchedBy?.push(h.id ? `${h.source}.${h.id}` : h.source);
        if (ctx.cancelled) break;
      }
    } finally {
      this.depth--;
    }
    return ctx;
  }

  /** Chain reactions: they run in `flush()`, outside the stack of the event that caused them. */
  defer(fn: () => void, source = 'core') { this.deferred.push({ fn, source }); }

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
