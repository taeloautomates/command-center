/**
 * /today ritual — Claude reads your context, picks the front-seat task,
 * suggests 2-3 time blocks for the day, and explains why.
 *
 * Inputs gathered:
 *   • Today's calendar events (from the .ics if configured)
 *   • Current MIT (so Claude knows what you're already focused on)
 *   • Current trunk items (deferred tasks)
 *   • Last 24h of brain dump entries (raw idea capture)
 *   • The current time of day (for "what's still possible today")
 *
 * Output:
 *   • Proposed MIT
 *   • 0-3 suggested time-blocks (each with a stone brick + start time)
 *   • One-paragraph reasoning
 */

import { App } from "obsidian";
import { askClaudeJSON } from "./ai-bridge";
import type { TrunkItem, MIT, Brick } from "../types";
import type { ICSEvent } from "./ical";
import type { BrainDumpEntry } from "../persistence";

const BRICK_PRESETS: Record<string, Brick> = {
  "deep work":  { id: "deepwork",   name: "Deep work",  dur: 90, glyph: "■" },
  "reading":    { id: "reading",    name: "Reading",    dur: 45, glyph: "▤" },
  "run":        { id: "run",        name: "Run",        dur: 45, glyph: "▶" },
  "walk":       { id: "walk",       name: "Walk",       dur: 30, glyph: "↗" },
  "stretch":    { id: "stretch",    name: "Stretch",    dur: 20, glyph: "~" },
  "instrument": { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
};

export type PlanContext = {
  mit: MIT;
  trunk: TrunkItem[];
  calendarEvents: ICSEvent[];
  brainDump: BrainDumpEntry[];
  nowHour: number;
};

export type PlannedBlock = {
  /** One of the BRICK_PRESETS keys, lowercased */
  brick: string;
  /** Start hour in 24h (e.g. 14 for 2 PM). May include fractional .5 for half-hour starts. */
  startHour: number;
  /** Override duration in minutes — falls back to brick preset */
  durationMin?: number;
  /** Why Claude picked this block */
  why: string;
};

export type DayPlan = {
  /**
   * The proposed front-seat task. Should be SHORT (≤ 60 chars).
   * If Claude thinks the current MIT is still right, this can equal mit.title.
   */
  mit: string;
  /** Short project tag (≤ 24 chars), e.g. "side-project" or "9-to-5" */
  project: string;
  /** Estimated minutes for the MIT focus session */
  estMin: number;
  /** Suggested time-blocks for the rest of the day */
  blocks: PlannedBlock[];
  /** One paragraph: why these choices, given the context */
  reasoning: string;
  /** Optional one-liner to display as a "header" mood/posture for the day */
  framing?: string;
};

/* ─── Prompt assembly ───────────────────────────────────────── */

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildPrompt(ctx: PlanContext): string {
  const now = new Date();
  const today = fmtDate(now);
  const nowTime = fmtTime(now);

  const cal = ctx.calendarEvents
    .filter((e) => fmtDate(e.start) === today)
    .map((e) => `  • ${fmtTime(e.start)}–${fmtTime(e.end)}  ${e.title}  (${e.calendar})`)
    .join("\n") || "  (none)";

  const trunk = ctx.trunk
    .slice(0, 12)
    .map((t) => `  • ${t.title}${t.project ? ` · ${t.project}` : ""}${t.estMin ? ` · ${t.estMin}m` : ""}`)
    .join("\n") || "  (empty)";

  const dump = ctx.brainDump
    .slice(0, 10)
    .map((b) => `  • [${b.ts}] ${b.text}`)
    .join("\n") || "  (empty)";

  const brickKeys = Object.keys(BRICK_PRESETS).join(", ");

  return `
You are planning Taelo's day. He's an ADHD solo operator who runs a YouTube
channel, a SaaS side project, and a 9-to-5. He needs ONE clear front-seat
task and a few well-placed time blocks. Be decisive. No fluff.

# Context

Date: ${today}
Current time: ${nowTime}

Currently in the Front Seat:
  • "${ctx.mit.title}" — ${ctx.mit.project} · est ${ctx.mit.est}m · started ${ctx.mit.startedAt}

Today's calendar (meetings — don't schedule on top of these):
${cal}

Trunk (deferred tasks waiting):
${trunk}

Recent brain dump (ideas, last few entries):
${dump}

# Your task

Pick ONE front-seat task for the rest of today. Pick what genuinely moves
the needle, not the easiest one. If the current MIT is still right, keep it.
If the trunk has something more urgent or higher-leverage, propose that.

Then suggest 1-3 time blocks for the rest of the day. Schedule around the
meetings above. Don't pile work on top of meetings. Prefer afternoon focus
blocks if mornings are taken.

Available time-block types (use one of these strings exactly for "brick"):
${brickKeys}

Estimate must fit a single focused session (25, 45, 60, 90 minutes — Pomodoro
style, NOT all day).

# Output schema

{
  "mit": "string — the proposed task title, ≤ 60 chars",
  "project": "string — short project tag, ≤ 24 chars (e.g. 'side-project', '9-to-5', 'youtube', 'health')",
  "estMin": number (25 | 45 | 60 | 90),
  "blocks": [
    {
      "brick": "one of: ${brickKeys}",
      "startHour": number (24h, e.g. 14 for 2pm; .5 allowed for half-hour),
      "durationMin": number (optional override),
      "why": "one short sentence"
    }
  ],
  "reasoning": "one paragraph, ≤ 60 words, why this MIT + these blocks make sense given today's context",
  "framing": "optional one-liner mood/posture for the day, ≤ 12 words"
}
`.trim();
}

/* ─── Call ──────────────────────────────────────────────────── */

export async function planToday(ctx: PlanContext): Promise<DayPlan> {
  const prompt = buildPrompt(ctx);
  return askClaudeJSON<DayPlan>(prompt, { timeoutMs: 45_000 });
}

/** Resolve a planned-block's "brick" string back to a real Brick instance. */
export function brickForKey(key: string): Brick | null {
  const k = key?.toLowerCase().trim() ?? "";
  return BRICK_PRESETS[k] ?? null;
}
