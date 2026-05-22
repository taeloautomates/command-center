/**
 * Activity log — append-only ledger of everything you do inside the
 * Command Center. One line per event.
 *
 * Storage: `command-center/activity-log.md` as Obsidian-editable markdown.
 * Each line: `- ISO_TIMESTAMP · KIND · DETAIL`
 *
 * Designed to be:
 *   - Human-readable (you can scroll the file in Obsidian and see your day)
 *   - Trivially parseable (line-oriented, fixed delimiter)
 *   - Append-only (no rewrites, no race conditions)
 *
 * Used by: /close-day ritual to synthesize the day; Today's Activity card.
 */

import { App, normalizePath, TFile } from "obsidian";

export type ActivityKind =
  | "todo_done"
  | "todo_undone"
  | "eod_done"
  | "eod_undone"
  | "mit_promoted"
  | "mit_dismissed"
  | "block_placed"
  | "block_removed"
  | "brain_dump"
  | "plan_today"
  | "close_day"
  | "note";          // free-form manual note

export type ActivityEntry = {
  ts: string;        // ISO 8601
  kind: ActivityKind;
  detail: string;    // human-readable summary
};

export const ACTIVITY_LOG_FILE = "command-center/activity-log.md";

const SEED = `# Activity log

Append-only ledger of everything that happens in the Command Center.
The dashboard writes to this file as you work. \`/close-day\` reads it to
synthesize the day.

Format: \`- ISO_TIMESTAMP · KIND · DETAIL\`. Edit by hand only if you know
what you're doing — duplicate or out-of-order lines will confuse close-day.

`;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(ACTIVITY_LOG_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

/**
 * Append an event. Fire-and-forget — failures are logged but never thrown.
 * The dashboard mutators shouldn't break if the log fails to write.
 */
export async function appendActivity(
  app: App,
  kind: ActivityKind,
  detail: string,
): Promise<void> {
  try {
    const file = await ensureFile(app);
    const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "");  // strip ms
    const line = `- ${ts} · ${kind} · ${detail.replace(/\s+/g, " ").trim()}\n`;
    // Use process appendFile rather than read+rewrite to keep this race-safe
    // when multiple mutations fire close together.
    await app.vault.append(file, line);
  } catch (e) {
    console.warn("[command-center] activity-log append failed:", e);
  }
}

/** Read the log. Optionally filter to events on/after `sinceMs` (Date.now() of the cutoff). */
export async function loadActivityLog(app: App, sinceMs?: number): Promise<ActivityEntry[]> {
  try {
    const file = await ensureFile(app);
    const text = await app.vault.read(file);
    const lines = text.split(/\r?\n/);
    const out: ActivityEntry[] = [];
    for (const raw of lines) {
      const m = raw.match(/^-\s+(\S+)\s+·\s+(\w+)\s+·\s+(.+)$/);
      if (!m) continue;
      const ts = m[1];
      const kind = m[2] as ActivityKind;
      const detail = m[3].trim();
      if (sinceMs !== undefined) {
        const t = Date.parse(ts);
        if (Number.isFinite(t) && t < sinceMs) continue;
      }
      out.push({ ts, kind, detail });
    }
    return out;
  } catch (e) {
    console.warn("[command-center] activity-log read failed:", e);
    return [];
  }
}

/** Convenience: load today's entries (since local midnight). */
export async function loadTodaysActivity(app: App): Promise<ActivityEntry[]> {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return loadActivityLog(app, midnight.getTime());
}

/** Compact "13:42" timestamp for the activity card. */
export function activityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Human-readable kind label for the card. */
export function activityLabel(kind: ActivityKind): string {
  switch (kind) {
    case "todo_done":     return "✓ todo";
    case "todo_undone":   return "↺ todo";
    case "eod_done":      return "✓ eod";
    case "eod_undone":    return "↺ eod";
    case "mit_promoted":  return "→ seat";
    case "mit_dismissed": return "← trunk";
    case "block_placed":  return "▦ block";
    case "block_removed": return "× block";
    case "brain_dump":    return "✎ dump";
    case "plan_today":    return "☀ plan";
    case "close_day":     return "● close";
    case "note":          return "· note";
  }
}
