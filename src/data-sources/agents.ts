/**
 * Parse Claude Code session transcripts (.jsonl).
 *
 * Each .jsonl file under ~/.claude/projects/<slug>/ is one session.
 * We extract a title (first non-template user message), mtime, and a coarse duration
 * (last timestamp − first timestamp). Sessions are sliced into Active / Recent / All.
 */

import * as fs from "fs/promises";
import { expandHome, listDir, timeAgo, fmtDuration, DirEntry } from "./fs-helpers";

export type AgentSession = {
  id: string;
  title: string;
  cwd: string;
  mtimeMs: number;
  durationMs: number;
  isActive: boolean;
  messageCount: number;
};

const CONTENT_ENGINE_DIR = "~/.claude/projects/-Users-ek-Desktop-Content-engine/";
const ACTIVE_WINDOW_MS = 10 * 60 * 1000;       // last 10 min counts as "active"
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;  // last 24h counts as "recent"

async function readFirstUserText(filepath: string): Promise<string> {
  try {
    const content = await fs.readFile(filepath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const m = obj.message;
        if (!m || m.role !== "user") continue;
        let text = "";
        if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.content)) {
          text = m.content
            .filter((x: any) => x && x.type === "text" && typeof x.text === "string")
            .map((x: any) => x.text)
            .join(" ");
        }
        text = text.trim();
        if (!text) continue;
        // Skip template/tool-result messages that often look like XML or carry tool ids.
        if (text.startsWith("<") || text.includes("tool_use_id")) continue;
        return text.slice(0, 120).replace(/\s+/g, " ");
      } catch {
        // skip malformed line
      }
    }
  } catch {
    // file read failed
  }
  return "(untitled session)";
}

/** Get a coarse duration by walking the file once for first/last `timestamp`. */
async function readDuration(filepath: string): Promise<{ durationMs: number; messageCount: number }> {
  try {
    const content = await fs.readFile(filepath, "utf8");
    let first = 0;
    let last = 0;
    let count = 0;
    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) continue;
      count++;
      try {
        const obj = JSON.parse(line);
        const ts = obj.timestamp ?? obj.created_at;
        if (typeof ts === "string") {
          const t = Date.parse(ts);
          if (!isNaN(t)) {
            if (!first) first = t;
            last = t;
          }
        }
      } catch {
        // skip
      }
    }
    return { durationMs: Math.max(0, last - first), messageCount: count };
  } catch {
    return { durationMs: 0, messageCount: 0 };
  }
}

async function entryToSession(entry: DirEntry, nowMs: number): Promise<AgentSession> {
  const [title, meta] = await Promise.all([readFirstUserText(entry.path), readDuration(entry.path)]);
  return {
    id: entry.name.replace(/\.jsonl$/, "").slice(0, 8),
    title,
    cwd: "Content engine",
    mtimeMs: entry.mtimeMs,
    durationMs: meta.durationMs,
    isActive: nowMs - entry.mtimeMs < ACTIVE_WINDOW_MS,
    messageCount: meta.messageCount,
  };
}

export async function loadAgentSessions(opts: { limit?: number } = {}): Promise<AgentSession[]> {
  const entries = await listDir(CONTENT_ENGINE_DIR, { ext: ".jsonl" });
  entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const sliced = opts.limit ? entries.slice(0, opts.limit) : entries;
  const nowMs = Date.now();
  return Promise.all(sliced.map((e) => entryToSession(e, nowMs)));
}

export function partitionSessions(sessions: AgentSession[], nowMs = Date.now()) {
  const active = sessions.filter((s) => nowMs - s.mtimeMs < ACTIVE_WINDOW_MS);
  const recent = sessions.filter((s) => {
    const age = nowMs - s.mtimeMs;
    return age >= ACTIVE_WINDOW_MS && age < RECENT_WINDOW_MS;
  });
  const older = sessions.filter((s) => nowMs - s.mtimeMs >= RECENT_WINDOW_MS);
  return { active, recent, older };
}

export { timeAgo, fmtDuration };
