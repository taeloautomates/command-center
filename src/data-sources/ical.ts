/**
 * Tiny iCal (RFC 5545) parser tailored to Google Calendar's "Secret address"
 * format. We don't expand RRULE recurrences in v1 — one-off events only.
 *
 * Setup: in Google Calendar → Settings → My calendars → click a calendar →
 * "Integrate calendar" → copy the URL under "Secret address in iCal format"
 * → paste into command-center/manual.md as `calendar.icsUrl`.
 */

import { requestUrl } from "obsidian";

export type ICSEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  calendar: string;
};

function parseICalDate(s: string): Date {
  // Strip TZ-like wrapping; accept basic forms YYYYMMDD or YYYYMMDDTHHMMSS[Z]
  const clean = s.replace(/[^\dTZ]/g, "");
  if (clean.length === 8) {
    return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T00:00:00`);
  }
  const y = clean.slice(0, 4);
  const mo = clean.slice(4, 6);
  const d = clean.slice(6, 8);
  const h = clean.slice(9, 11);
  const m = clean.slice(11, 13);
  const sec = clean.slice(13, 15);
  const z = clean.endsWith("Z") ? "Z" : "";
  return new Date(`${y}-${mo}-${d}T${h}:${m}:${sec}${z}`);
}

export function parseICal(text: string, calendarName: string): ICSEvent[] {
  // Unfold continuation lines (lines starting with space or tab).
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length) {
      lines[lines.length - 1] += raw.slice(1);
    } else {
      lines.push(raw);
    }
  }

  const events: ICSEvent[] = [];
  let cur: Partial<ICSEvent> | null = null;
  let isRecurring = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      isRecurring = false;
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && !isRecurring && cur.title && cur.start && cur.end) {
        events.push({
          uid: cur.uid || "",
          title: cur.title,
          start: cur.start,
          end: cur.end,
          calendar: calendarName,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const keyRaw = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = keyRaw.split(";")[0];

    switch (key) {
      case "UID":
        cur.uid = value;
        break;
      case "SUMMARY":
        cur.title = value.replace(/\\,/g, ",").replace(/\\n/g, " ");
        break;
      case "DTSTART":
        cur.start = parseICalDate(value);
        break;
      case "DTEND":
        cur.end = parseICalDate(value);
        break;
      case "RRULE":
        // Skip recurring-rule events for v1.
        isRecurring = true;
        break;
    }
  }

  return events;
}

export async function fetchICalEvents(url: string, name: string): Promise<ICSEvent[]> {
  if (!url) return [];
  try {
    const res = await requestUrl({ url, throw: false });
    if (res.status >= 400) return [];
    return parseICal(res.text, name);
  } catch {
    return [];
  }
}

/** Filter events to a given day range (inclusive start, exclusive end). */
export function filterByDay(events: ICSEvent[], dayStart: Date, dayEnd: Date): ICSEvent[] {
  return events.filter((e) => e.start >= dayStart && e.start < dayEnd);
}
