/**
 * Apple Notes — read the user's most-recently-modified iCloud notes.
 *
 * Strategy: osascript shell-out to Notes.app. Notes.app's AppleScript
 * dictionary returns notes in modification-date-desc order by default,
 * so we just walk the first N and bail.
 *
 * Permissions: first call triggers a macOS Automation prompt
 * (System Settings → Privacy & Security → Automation → Obsidian → Notes).
 * After the user clicks OK, subsequent calls are silent.
 *
 * Alternative considered: read the SQLite store directly at
 *   ~/Library/Group Containers/group.com.apple.notes/NoteStore.sqlite
 * Blocked by macOS TCC (Full Disk Access). AppleScript is the cleaner path.
 *
 * Note IDs in Notes.app are CoreData URIs ("x-coredata://..."). Pass them
 * back to AppleScript via `show note id "<id>"` to reveal a note in the app.
 */

import { spawn } from "child_process";
import { augmentedEnv } from "./ai-bridge";

export type AppleNote = {
  id: string;            // CoreData URI
  title: string;
  preview: string;       // first 240 chars of plaintext body, single-line
  folder: string;
  modifiedAt: string;    // ISO 8601
  ageMs: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { notes: AppleNote[]; fetchedAt: number } | null = null;

/**
 * Read the top N most-recently-modified notes.
 *
 * AppleScript script returns each record as:
 *   <id>\t<title>\t<folder>\t<isoModDate>\t<body-with-spaces-replacing-newlines>\n
 *
 * Newlines are replaced with U+2028 (line separator) before being sent so
 * we can safely split by \n on the JS side. Tabs in user content are
 * replaced with spaces for the same reason.
 */
function buildScript(limit: number): string {
  return `
on isoDate(d)
  set y to year of d
  set m to month of d as integer
  set dd to day of d
  set hh to hours of d
  set mm to minutes of d
  set ss to seconds of d
  set yStr to text -4 thru -1 of ("0000" & y)
  set mStr to text -2 thru -1 of ("00" & m)
  set dStr to text -2 thru -1 of ("00" & dd)
  set hStr to text -2 thru -1 of ("00" & hh)
  set minStr to text -2 thru -1 of ("00" & mm)
  set sStr to text -2 thru -1 of ("00" & ss)
  return yStr & "-" & mStr & "-" & dStr & "T" & hStr & ":" & minStr & ":" & sStr
end isoDate

on sanitize(t)
  set t to my replace(t, tab, " ")
  set t to my replace(t, return, " | ")
  set t to my replace(t, linefeed, " | ")
  return t
end sanitize

on replace(t, oldStr, newStr)
  set AppleScript's text item delimiters to oldStr
  set ti to text items of t
  set AppleScript's text item delimiters to newStr
  set out to ti as string
  set AppleScript's text item delimiters to ""
  return out
end replace

tell application "Notes"
  set out to ""
  set k to 0
  repeat with n in notes
    set k to k + 1
    if k > ${limit} then exit repeat
    try
      set nId to id of n
      set nTitle to name of n
      set nFolder to name of container of n
      set nMod to my isoDate(modification date of n)
      set nBody to plaintext of n
      if (length of nBody) > 240 then set nBody to text 1 thru 240 of nBody
      set out to out & nId & tab & my sanitize(nTitle) & tab & my sanitize(nFolder) & tab & nMod & tab & my sanitize(nBody) & linefeed
    end try
  end repeat
  return out
end tell
`;
}

function runOsa(script: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("osascript", ["-e", script], { env: augmentedEnv() });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("osascript timed out — is the Notes automation permission granted?"));
    }, timeoutMs);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", (e) => { clearTimeout(timer); reject(e); });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(err.trim() || `osascript exited ${code}`));
      else resolve(out);
    });
  });
}

export async function loadAppleNotes(limit = 10): Promise<AppleNote[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.notes;
  try {
    const raw = await runOsa(buildScript(limit), 15_000);
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const now = Date.now();
    const notes: AppleNote[] = [];
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 5) continue;
      const [id, title, folder, modIso, preview] = parts;
      const modMs = Date.parse(modIso);
      notes.push({
        id,
        title: title || "(untitled)",
        preview: (preview || "").trim(),
        folder: folder || "Notes",
        modifiedAt: modIso,
        ageMs: Number.isFinite(modMs) ? now - modMs : 0,
      });
    }
    cache = { notes, fetchedAt: now };
    return notes;
  } catch (e) {
    console.warn("[command-center] Apple Notes load failed:", e);
    return [];
  }
}

/** Open a specific note in Notes.app via its CoreData id. */
export async function showAppleNote(id: string): Promise<void> {
  const safeId = id.replace(/"/g, '\\"');
  const script = `
tell application "Notes"
  activate
  try
    show note id "${safeId}"
  end try
end tell
`;
  try {
    await runOsa(script, 5_000);
  } catch (e) {
    console.warn("[command-center] showAppleNote failed:", e);
  }
}

export function clearAppleNotesCache(): void {
  cache = null;
}

/** Compact age formatting consistent with other cards. */
export function notesAge(ms: number): string {
  if (ms < 60_000) return "now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  if (ms < 86_400_000 * 7) return `${Math.floor(ms / 86_400_000)}d`;
  if (ms < 86_400_000 * 30) return `${Math.floor(ms / 86_400_000 / 7)}w`;
  return `${Math.floor(ms / 86_400_000 / 30)}mo`;
}
