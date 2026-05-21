/**
 * Voice intent parser.
 *
 * Maps a Whisper transcript to a dashboard action. Keyword/regex-based —
 * no LLM call needed, fast, deterministic, runs offline once Whisper
 * returned the transcript.
 *
 * Supported intents:
 *   place_block    — "block 90 deep work at 2pm", "schedule 30m walk at 11"
 *   set_mit        — "set MIT to edit the watch tutorial", "focus on ..."
 *   add_trunk      — "trunk fix login bug", "defer write migration notes"
 *   brain_dump     — "brain dump build a reddit scraper", "note ..."
 *   timer          — "pause", "resume", "done", "add five minutes"
 *   switch_tab     — "switch to inspired", "open social"
 *   open_terminal  — "open terminal", "open claude"
 *   unknown        — fallback with the raw transcript
 */

import type { TabId, Brick } from "./types";

export type VoiceIntent =
  | { kind: "place_block"; brick: Brick; startMin: number }
  | { kind: "set_mit"; title: string }
  | { kind: "add_trunk"; title: string }
  | { kind: "brain_dump"; text: string }
  | { kind: "timer"; action: "pause" | "resume" | "done" | "add5" }
  | { kind: "switch_tab"; tab: TabId }
  | { kind: "open_terminal" }
  | { kind: "plan_today" }
  | { kind: "unknown"; raw: string };

const TABS_BY_KEYWORD: Record<string, TabId> = {
  "9 to 5": "9-to-5", "9to5": "9-to-5", "nine to five": "9-to-5", "work": "9-to-5",
  "side project": "Side Project", "sideproject": "Side Project", "side": "Side Project",
  "health": "Health", "fitness": "Health", "workout": "Health", "gym": "Health",
  "inspired": "Inspired", "inspiration": "Inspired", "art": "Inspired", "music": "Inspired",
  "social": "Social", "socials": "Social",
};

const BRICK_PRESETS: Record<string, Brick> = {
  "deep work":  { id: "deepwork",  name: "Deep work",  dur: 90, glyph: "■" },
  "deepwork":   { id: "deepwork",  name: "Deep work",  dur: 90, glyph: "■" },
  "reading":    { id: "reading",   name: "Reading",    dur: 45, glyph: "▤" },
  "read":       { id: "reading",   name: "Reading",    dur: 45, glyph: "▤" },
  "run":        { id: "run",       name: "Run",        dur: 45, glyph: "▶" },
  "running":    { id: "run",       name: "Run",        dur: 45, glyph: "▶" },
  "walk":       { id: "walk",      name: "Walk",       dur: 30, glyph: "↗" },
  "stretch":    { id: "stretch",   name: "Stretch",    dur: 20, glyph: "~" },
  "stretching": { id: "stretch",   name: "Stretch",    dur: 20, glyph: "~" },
  "instrument": { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
  "guitar":     { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
  "piano":      { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
  "practice":   { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
};

/** Parse "2pm", "14:30", "2:15", "14", "noon", "midnight" → minutes since midnight. */
function parseTimeToMin(raw: string): number | null {
  const s = raw.toLowerCase().trim().replace(/\s+/g, "");
  if (s === "noon" || s === "midday") return 12 * 60;
  if (s === "midnight") return 0;
  // 14:30 / 9:15
  const colon = s.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
  if (colon) {
    let h = parseInt(colon[1], 10);
    const m = parseInt(colon[2], 10);
    if (colon[3] === "pm" && h < 12) h += 12;
    if (colon[3] === "am" && h === 12) h = 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }
  // 2pm / 11am / 14
  const ampm = s.match(/^(\d{1,2})(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    if (ampm[2] === "pm" && h < 12) h += 12;
    if (ampm[2] === "am" && h === 12) h = 0;
    if (h < 0 || h > 23) return null;
    return h * 60;
  }
  const num = s.match(/^(\d{1,2})$/);
  if (num) {
    const h = parseInt(num[1], 10);
    if (h < 0 || h > 23) return null;
    return h * 60;
  }
  return null;
}

/** Parse "30 min", "45m", "1 hour", "90" → minutes. */
function parseDuration(raw: string): number | null {
  const s = raw.toLowerCase().trim();
  const hm = s.match(/^(\d+)\s*h(?:ou)?r?s?\s*(\d+)?\s*m?(?:in)?(?:utes?)?\s*$/);
  if (hm) return parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
  const m = s.match(/^(\d+)\s*m(?:in)?(?:utes?)?\s*$/);
  if (m) return parseInt(m[1], 10);
  const h = s.match(/^(\d+)\s*h(?:ou)?r?s?\s*$/);
  if (h) return parseInt(h[1], 10) * 60;
  const num = s.match(/^(\d+)\s*$/);
  if (num) {
    const n = parseInt(num[1], 10);
    return n;  // raw number = minutes
  }
  return null;
}

function findBrickInText(text: string): Brick | null {
  const t = text.toLowerCase();
  // Find longest-matching preset key
  let best: { key: string; brick: Brick } | null = null;
  for (const [key, brick] of Object.entries(BRICK_PRESETS)) {
    if (t.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, brick };
    }
  }
  return best?.brick ?? null;
}

export function parseIntent(transcript: string): VoiceIntent {
  const t = transcript.trim();
  if (!t) return { kind: "unknown", raw: transcript };
  const lower = t.toLowerCase();

  // ── Plan today / AI ritual ──
  if (
    /\b(plan|design)\s+(my\s+)?(today|day)\b/.test(lower) ||
    /\bwhat\s+should\s+i\s+(focus|work)\s+on\b/.test(lower) ||
    /\bclaude.*(plan|figure\s+out).*(day|today)\b/.test(lower) ||
    /^plan\s+today$/.test(lower) ||
    /^plan\s+my\s+day$/.test(lower)
  ) {
    return { kind: "plan_today" };
  }

  // ── Timer controls ──
  if (/\b(pause|hold)\b.*\b(timer|focus|clock)\b/.test(lower) || /^pause$/.test(lower)) {
    return { kind: "timer", action: "pause" };
  }
  if (/\b(resume|unpause|start)\b/.test(lower) && /\b(timer|focus)\b/.test(lower)) {
    return { kind: "timer", action: "resume" };
  }
  if (/^(resume|unpause)$/.test(lower)) return { kind: "timer", action: "resume" };
  if (/\b(done|complete|finished|mark.*done)\b/.test(lower) && /\b(task|mit|focus)\b/.test(lower)) {
    return { kind: "timer", action: "done" };
  }
  if (/(add|plus|extend).*(5|five).*min/.test(lower) || /\+5/.test(lower)) {
    return { kind: "timer", action: "add5" };
  }

  // ── Switch tab ──
  const switchMatch = lower.match(/(?:switch to|open|go to|show)\s+(.+?)(?:\s+tab)?\s*$/);
  if (switchMatch) {
    const target = switchMatch[1].trim().replace(/[.!?]$/, "");
    if (target.includes("terminal") || target.includes("claude")) return { kind: "open_terminal" };
    for (const [keyword, tab] of Object.entries(TABS_BY_KEYWORD)) {
      if (target.includes(keyword)) return { kind: "switch_tab", tab };
    }
  }
  if (/open\s+(the\s+)?terminal/.test(lower) || /open\s+claude(\s+code)?/.test(lower)) {
    return { kind: "open_terminal" };
  }

  // ── Place block ──
  // "block 90 deep work at 2pm" / "schedule 30m walk at 11"
  const blockMatch = lower.match(
    /(?:block|schedule|set|put)\s+(?:(\d+\s*(?:m|min|minutes?|h|hour|hours?)?)\s+)?(.+?)\s+(?:at|for|@)\s+(\S+)/
  );
  if (blockMatch) {
    const durRaw = blockMatch[1];
    const activityRaw = blockMatch[2];
    const timeRaw = blockMatch[3];
    const time = parseTimeToMin(timeRaw);
    const brick = findBrickInText(activityRaw);
    if (brick && time !== null) {
      const dur = durRaw ? parseDuration(durRaw) ?? brick.dur : brick.dur;
      return {
        kind: "place_block",
        brick: { ...brick, dur },
        startMin: time,
      };
    }
  }

  // ── Set MIT ──
  const mitMatch = lower.match(/(?:set\s+(?:my\s+)?mit|focus\s+on|i'?m\s+focusing\s+on|new\s+mit|change\s+mit)\s+(?:to\s+)?(.+)/);
  if (mitMatch) {
    return { kind: "set_mit", title: cleanTitle(mitMatch[1]) };
  }

  // ── Add to trunk ──
  const trunkMatch = lower.match(/(?:trunk|defer|park|backlog|later|put.*in.*trunk)\s+(.+)/);
  if (trunkMatch) {
    return { kind: "add_trunk", title: cleanTitle(trunkMatch[1]) };
  }

  // ── Brain dump ──
  const dumpMatch = lower.match(/(?:brain\s*dump|capture|note|idea|jot|save\s+(?:this\s+)?(?:idea|thought))\s+(.+)/);
  if (dumpMatch) {
    return { kind: "brain_dump", text: cleanTitle(dumpMatch[1]) };
  }

  return { kind: "unknown", raw: transcript };
}

function cleanTitle(raw: string): string {
  return raw
    .trim()
    .replace(/^(that|to|this is|it is)\s+/i, "")
    .replace(/[.!?]+\s*$/g, "")
    .replace(/\s+/g, " ");
}
