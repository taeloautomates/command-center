/**
 * /close-day ritual — counterpart to /plan-today.
 *
 * Read the day's activity log + open todos + current MIT + trunk, and ask
 * Claude to synthesize:
 *   • What got done (count + summary)
 *   • What didn't (specific undone items, ordered by importance)
 *   • Carry-over suggestion: which undone items belong in tomorrow's trunk
 *   • One-paragraph reflection
 *
 * The dashboard then offers a "Move to tomorrow's trunk" button — nothing
 * moves automatically. User confirms.
 */

import { App } from "obsidian";
import { askClaudeJSON } from "./ai-bridge";
import { loadTodaysActivity, ActivityEntry } from "./activity-log";
import type { Todo, MIT, TrunkItem } from "../types";

export type CloseDayContext = {
  mit: MIT;
  trunk: TrunkItem[];
  sideTodos: Todo[];
  eodTodos: Todo[];
  activity: ActivityEntry[];
};

export type CarryItem = {
  title: string;
  project?: string;
  estMin?: number;
  /** Why it should carry over (one-liner) */
  why: string;
};

export type CloseDaySummary = {
  /** One-line headline for the day (e.g. "Solid focus block, but admin work slipped") */
  headline: string;
  /** Bullets of what got done */
  done: string[];
  /** Bullets of what's still open */
  undone: string[];
  /** Specific items to carry to tomorrow's trunk */
  carryOver: CarryItem[];
  /** One paragraph, ≤ 60 words */
  reflection: string;
};

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildPrompt(ctx: CloseDayContext): string {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const log = ctx.activity.length === 0
    ? "  (no events logged today)"
    : ctx.activity
        .slice(-50)
        .map((a) => {
          const d = new Date(a.ts);
          const t = Number.isFinite(d.getTime()) ? fmtTime(d) : a.ts;
          return `  • ${t} · ${a.kind} · ${a.detail}`;
        })
        .join("\n");

  const openSide = ctx.sideTodos.filter((t) => !t.done);
  const openEod = ctx.eodTodos.filter((t) => !t.done);

  const sideStr = openSide.length === 0
    ? "  (all checked)"
    : openSide.map((t) => `  • ${t.text}`).join("\n");
  const eodStr = openEod.length === 0
    ? "  (all checked)"
    : openEod.map((t) => `  • ${t.text}`).join("\n");

  const trunk = ctx.trunk
    .slice(0, 12)
    .map((t) => `  • ${t.title}${t.project ? ` · ${t.project}` : ""}`)
    .join("\n") || "  (empty)";

  return `
You are running Taelo's end-of-day reflection. He's an ADHD solo operator —
he hates fluff and meta-commentary. Be specific. Cite actual log entries.
Don't moralize. No "great job" energy.

# Today's context (${today}, ${fmtTime(now)})

Front-seat task right now:
  • "${ctx.mit.title}" — ${ctx.mit.project} · est ${ctx.mit.est}m

Open side-project todos:
${sideStr}

Open EOD checklist:
${eodStr}

Current trunk (already deferred):
${trunk}

Activity log for today:
${log}

# Your task

Give Taelo a tight reflection on the day. Be honest:
- What actually got done? Pull from the log entries.
- What was open and stayed open? List the specific items.
- Which open items should carry over to tomorrow's trunk? Don't just dump
  everything — pick the 1-5 that genuinely matter. Drop trivial admin.
- One-paragraph reflection: ≤ 60 words, specific, no fluff.

# Output schema

{
  "headline": "string — one line, ≤ 80 chars, the shape of the day",
  "done":    ["string", "..."],   // 2-6 bullets, each ≤ 80 chars
  "undone":  ["string", "..."],   // 0-8 bullets of what's still open
  "carryOver": [
    {
      "title": "string ≤ 60 chars",
      "project": "string ≤ 24 chars (optional)",
      "estMin": number (optional — 25 | 45 | 60 | 90),
      "why": "string ≤ 80 chars — one short sentence"
    }
  ],
  "reflection": "string — one paragraph, ≤ 60 words"
}
`.trim();
}

export async function closeDay(app: App, ctx: Omit<CloseDayContext, "activity">): Promise<CloseDaySummary> {
  const activity = await loadTodaysActivity(app);
  const full: CloseDayContext = { ...ctx, activity };
  const prompt = buildPrompt(full);
  return askClaudeJSON<CloseDaySummary>(prompt, { timeoutMs: 45_000 });
}
