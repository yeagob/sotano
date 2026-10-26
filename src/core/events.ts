// Event bus with priorities and a mutable/cancellable context (see docs/TECHNICAL.md §4.2).
// It is the backbone of synergies: items, materials and enemies all hook in here.

export interface EventCtx {
  cancelled: boolean;
  cancel(): void;
  /** Hooks that touched this event (only filled in when `bus.trace = true`). */
  touchedBy?: string[];
}

export type Hook<C> = { priority: number; source: string; fn: (ctx: C) => void };

const MAX_DEPTH = 8;

export class EventBus<Events extends { [K in keyof Events]: object }> {
  private hooks = new Map<keyof Events, Hook<any>[]>();
  private depth = 0;
  private deferred: (() => void)[] = [];
  trace = false;

  /** Lower priority runs first. Convention: 0–99 modifiers, 100–199 cancellations, 200+ side effects. */
  on<K extends keyof Events>(type: K, hook: Hook<Events[K] & EventCtx>): () => void {
    const list = this.hooks.get(type) ?? [];
    list.push(hook);
    list.sort((a, b) => a.priority - b.priority);
    this.hooks.set(type, list);
    return () => this.off(type, hook.source);
  }

  /** Removes every hook from a `source` (e.g. when an item is lost). */
  off(type: keyof Events | null, source: string) {
    for (const [k, list] of this.hooks) {
      if (type !== null && k !== type) continue;
      this.hooks.set(k, list.filter(h => h.source !== source));
    }
  }

  /** Emits the event and returns the context (as modified by the hooks). */
  emit<K extends keyof Events>(type: K, payload: Events[K]): Events[K] & EventCtx {
    const ctx = payload as Events[K] & EventCtx;
    ctx.cancelled = false;
    ctx.cancel = () => { ctx.cancelled = true; };
    if (this.trace) ctx.touchedBy = [];
    if (this.depth >= MAX_DEPTH) {
      console.warn(`[events] max depth reached on "${String(type)}", event dropped`);
      ctx.cancelled = true;
      return ctx;
    }
    this.depth++;
    try {
      for (const h of this.hooks.get(type) ?? []) {
        h.fn(ctx);
        ctx.touchedBy?.push(h.source);
        if (ctx.cancelled) break;
      }
    } finally {
      this.depth--;
    }
    return ctx;
  }

  /** Chain reactions: they run in `flush()`, outside the stack of the event that caused them. */
  defer(fn: () => void) { this.deferred.push(fn); }

  /** Runs at most `budget` deferred reactions (the rest wait for the next frame). */
  flush(budget = 64) {
    let n = 0;
    while (this.deferred.length && n++ < budget) this.deferred.shift()!();
  }

  get pending() { return this.deferred.length; }
}
