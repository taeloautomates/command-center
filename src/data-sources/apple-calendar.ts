/**
 * Apple Calendar bridge via osascript (JXA).
 *
 * Reading events through JXA is *very* slow on calendars with many entries
 * (CalDAV-synced Google sub-calendars in particular), so reading happens via
 * the iCal subscription URL elsewhere. This module only handles writes —
 * which are quick (~3-5s) and reliable.
 *
 * Events created here land in Apple Calendar and propagate up to Google
 * Calendar via the macOS CalDAV bridge within a few seconds.
 */

import { spawn } from "child_process";

const SCRIPT_CREATE = `
function run(argv) {
  const [calName, title, startISO, endISO, notes] = argv;
  const cal = Application("Calendar");
  let target;
  try { target = cal.calendars.byName(calName); target.name(); }
  catch (e) { throw new Error("Calendar not found: " + calName); }
  const ev = cal.Event({
    summary: title,
    startDate: new Date(startISO),
    endDate: new Date(endISO),
    description: notes || ""
  });
  target.events.push(ev);
  return ev.uid();
}
`.trim();

const SCRIPT_DELETE = `
function run(argv) {
  const [calName, uid] = argv;
  const cal = Application("Calendar");
  const target = cal.calendars.byName(calName);
  const evs = target.events.whose({uid: uid})();
  let n = 0;
  for (let i = 0; i < evs.length; i++) { cal.delete(evs[i]); n++; }
  return String(n);
}
`.trim();

const SCRIPT_LIST_CALENDARS = `
function run() {
  const cal = Application("Calendar");
  const calendars = cal.calendars();
  const out = [];
  for (let i = 0; i < calendars.length; i++) {
    try {
      out.push({ name: calendars[i].name(), writable: calendars[i].writable() });
    } catch (e) {}
  }
  return JSON.stringify(out);
}
`.trim();

function osascript(script: string, args: string[] = [], timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("osascript", ["-l", "JavaScript", "-", ...args]);
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Calendar bridge timed out — has the Calendar permission been granted to Obsidian?"));
    }, timeoutMs);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(err.trim() || `osascript exited ${code}`));
      else resolve(out.trim());
    });
    proc.stdin.write(script);
    proc.stdin.end();
  });
}

export async function createAppleCalendarEvent(args: {
  calendar: string;
  title: string;
  start: Date;
  end: Date;
  notes?: string;
}): Promise<string> {
  return osascript(SCRIPT_CREATE, [
    args.calendar,
    args.title,
    args.start.toISOString(),
    args.end.toISOString(),
    args.notes ?? "",
  ]);
}

export async function deleteAppleCalendarEvent(calendar: string, uid: string): Promise<void> {
  await osascript(SCRIPT_DELETE, [calendar, uid]);
}

export async function listAppleCalendars(): Promise<{ name: string; writable: boolean }[]> {
  try {
    const json = await osascript(SCRIPT_LIST_CALENDARS, [], 10000);
    return JSON.parse(json);
  } catch {
    return [];
  }
}
