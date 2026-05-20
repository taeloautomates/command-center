/**
 * Filesystem helpers for reading data that lives outside the Obsidian vault.
 * Obsidian desktop plugins run in Electron, so we have full Node fs access.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export function expandHome(p: string): string {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  if (p === "~") return os.homedir();
  return p;
}

export async function readFileSafe(p: string): Promise<string | null> {
  try {
    return await fs.readFile(expandHome(p), "utf8");
  } catch {
    return null;
  }
}

export type DirEntry = { name: string; path: string; mtimeMs: number; size: number };

export async function listDir(p: string, opts: { ext?: string } = {}): Promise<DirEntry[]> {
  try {
    const dir = expandHome(p);
    const names = await fs.readdir(dir);
    const filtered = opts.ext ? names.filter((n) => n.endsWith(opts.ext!)) : names;
    const entries = await Promise.all(
      filtered.map(async (name) => {
        const full = path.join(dir, name);
        try {
          const st = await fs.stat(full);
          return { name, path: full, mtimeMs: st.mtimeMs, size: st.size };
        } catch {
          return null;
        }
      })
    );
    return entries.filter((e): e is DirEntry => e !== null);
  } catch {
    return [];
  }
}

/** Pretty-print a relative time like "4m", "2h", "3d". */
export function timeAgo(mtimeMs: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - mtimeMs);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/** "12m 34s" style duration from milliseconds. */
export function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (m < 60) return `${m}m ${String(sec).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}
