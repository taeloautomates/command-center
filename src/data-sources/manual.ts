/**
 * Manual overrides for surfaces I can't auto-pull yet (YouTube KPIs, Social, Health, Work kanban).
 *
 * Single file: command-center/manual.md.
 * YAML frontmatter holds all hand-edited numbers. Body is free-form notes.
 *
 * Format aims to be human-editable in Obsidian — open the note, change a number,
 * dashboard reflects on next refresh.
 */

import { App, normalizePath, TFile } from "obsidian";

export type ManualState = {
  youtube: {
    handle: string;
    apiKey: string;          // YouTube Data API v3 key — leave blank to fall back to manual values
    scriptsDrafted: number; scriptsTarget: number;
    videosShot: number;     videosTarget: number;
    videosShipped: number;  videosShippedTarget: number;
    nextUpload: { title: string; when: string };
  };
  social: {
    youtube:   { value: string; delta: string; positive: boolean };
    instagram: { value: string; delta: string; positive: boolean };
    tiktok:    { value: string; delta: string; positive: boolean };
    linkedin:  { value: string; delta: string; positive: boolean };
  };
  work: {
    sprint: string;
    day: string;
    doing:   { id: string; title: string }[];
    next:    { id: string; title: string }[];
    blocked: { id: string; title: string }[];
  };
  tokenBurn: { usedUSD: number; capUSD: number };
  calendar: {
    targetCalendar: string;   // Apple Calendar name where time-blocks land
    icsUrl: string;           // optional Google "secret iCal" URL for reads
  };
  terminal: {
    cwd: string;              // where claude/codex/shell starts
  };
  slack: {
    token: string;            // User OAuth token (xoxp-...). Blank = card hidden.
    channels: string[];       // channel IDs to monitor, e.g. ["C01ABCDEF"]
    lookbackHours: number;    // how far back to scan
  };
};

export const MANUAL_FILE = "command-center/manual.md";

export const DEFAULT_MANUAL: ManualState = {
  youtube: {
    handle: "@taelo_kim",
    apiKey: "",
    scriptsDrafted: 3, scriptsTarget: 5,
    videosShot: 2,     videosTarget: 3,
    videosShipped: 1,  videosShippedTarget: 2,
    nextUpload: { title: "Anthropic's 50% limit cut — the unspoken cost", when: "SAT · 09:00" },
  },
  social: {
    youtube:   { value: "12,408", delta: "+ 0.7%", positive: true },
    instagram: { value: "8,214",  delta: "+ 0.2%", positive: true },
    tiktok:    { value: "34,902", delta: "+ 1.4%", positive: true },
    linkedin:  { value: "3,107",  delta: "±  0.0%", positive: false },
  },
  work: {
    sprint: "sprint 47",
    day: "day 3 of 10",
    doing:   [{ id: "PLT-412", title: "Migrate auth to JWT refresh-rotation" }],
    next:    [
      { id: "PLT-419", title: "Audit log retention policy" },
      { id: "PLT-423", title: "Spec — admin role split" },
    ],
    blocked: [{ id: "PLT-401", title: "SSO rollout — waiting on IT" }],
  },
  tokenBurn: { usedUSD: 38, capUSD: 100 },
  calendar: {
    targetCalendar: "Calendar",
    icsUrl: "",
  },
  terminal: {
    cwd: "~/Desktop/Content engine",
  },
  slack: {
    token: "",
    channels: [],
    lookbackHours: 24,
  },
};

const SEED = `---
youtube:
  handle: "@taelo_kim"
  apiKey: ""
  scriptsDrafted: 3
  scriptsTarget: 5
  videosShot: 2
  videosTarget: 3
  videosShipped: 1
  videosShippedTarget: 2
  nextUpload:
    title: "Anthropic's 50% limit cut — the unspoken cost"
    when: "SAT · 09:00"
social:
  youtube:   { value: "12,408", delta: "+ 0.7%", positive: true }
  instagram: { value: "8,214",  delta: "+ 0.2%", positive: true }
  tiktok:    { value: "34,902", delta: "+ 1.4%", positive: true }
  linkedin:  { value: "3,107",  delta: "±  0.0%", positive: false }
work:
  sprint: "sprint 47"
  day: "day 3 of 10"
  doing:
    - { id: "PLT-412", title: "Migrate auth to JWT refresh-rotation" }
  next:
    - { id: "PLT-419", title: "Audit log retention policy" }
    - { id: "PLT-423", title: "Spec — admin role split" }
  blocked:
    - { id: "PLT-401", title: "SSO rollout — waiting on IT" }
tokenBurn:
  usedUSD: 38
  capUSD: 100
calendar:
  targetCalendar: "Calendar"
  icsUrl: ""
terminal:
  cwd: "~/Desktop/Content engine"
slack:
  token: ""
  channels: []
  lookbackHours: 24
---

# Manual overrides

These numbers feed the dashboard surfaces that don't have an automated source wired up yet:
YouTube KPIs, Social KPIs, work kanban, and the Token Burn cap.

Edit the frontmatter above and the dashboard will pick up changes on next refresh.
When a real source is wired for any of these, the override here is ignored.

## Calendar setup

- **targetCalendar** — name of the Apple Calendar where dropped time-blocks land.
  This calendar must be writable and is typically a sub-calendar of your Google account.
  Events created here propagate to Google Calendar via CalDAV within a few seconds.
- **icsUrl** — paste the Google Calendar "Secret address in iCal format" URL here to
  display your real meetings on the 9-to-5 timeline. Get it from
  Google Calendar → Settings → My calendars → click a calendar → Integrate calendar →
  Secret address in iCal format.

## YouTube API setup

- **handle** — your channel handle, e.g. \`@taelo_kim\`.
- **apiKey** — YouTube Data API v3 key. Leave blank to keep manual values. To get one:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create a project (free).
  3. APIs & Services → Enable APIs → search "YouTube Data API v3" → Enable.
  4. Credentials → Create Credentials → API key. Paste the key here.
  5. Optional but recommended: restrict the key to "YouTube Data API v3" only.

  Quota: 10,000 units/day free. This plugin uses ~3 units per refresh with a
  10-minute cache, well under the limit.

## Slack briefings setup

Leave \`token\` blank to hide the Slack card.

- **token** — User OAuth Token (\`xoxp-...\`). To get one:
  1. Go to https://api.slack.com/apps → Create New App → From scratch.
  2. Pick a name ("Command Center"), pick your workspace.
  3. **OAuth & Permissions** → scroll to **User Token Scopes** → add:
     - \`channels:history\`, \`channels:read\`
     - \`groups:history\`, \`groups:read\` (private channels — optional)
     - \`im:history\`, \`im:read\` (DMs — optional)
     - \`users:read\`
  4. Top of the same page: **Install to Workspace** → approve.
  5. Copy the **User OAuth Token** (starts with \`xoxp-\`). Paste here.
- **channels** — list of channel IDs to monitor. Find one in Slack: right-click
  the channel → View channel details → bottom of the modal. Format: \`["C01ABCDEF"]\`.
- **lookbackHours** — how far back to scan (default 24).
`;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(MANUAL_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

/**
 * Very small YAML parser tailored to the fields we use.
 * Not a full YAML implementation — just enough to read the seed format.
 */
function parseManualYAML(text: string): ManualState {
  const out: any = JSON.parse(JSON.stringify(DEFAULT_MANUAL));
  const lines = text.split(/\r?\n/);
  let section: string[] = [];
  const indentOf = (l: string) => l.match(/^(\s*)/)?.[1].length ?? 0;

  // Tracks the path stack: e.g. ["youtube"] → ["youtube","nextUpload"]
  const stack: { key: string; indent: number }[] = [];
  // Tracks which list-keys have started populating from YAML.
  // Without this, the parser would append YAML items on top of the
  // DEFAULT_MANUAL clone's array, doubling everything.
  const startedLists = new Set<string>();
  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const ind = indentOf(line);
    // Pop stack to current indent
    while (stack.length && stack[stack.length - 1].indent >= ind) stack.pop();

    // Detect inline object like:  youtube: { value: "12,408", ... }
    const inlineObj = line.match(/^\s*(\w+):\s*\{(.+)\}\s*$/);
    if (inlineObj) {
      const key = inlineObj[1];
      const objBody = inlineObj[2];
      const parent = stack.map((s) => s.key);
      const target = parent.reduce((a, k) => (a[k] ??= {}), out);
      target[key] = parseInlineObj(objBody);
      continue;
    }

    // Detect "key:" (parent)
    const parentMatch = line.match(/^\s*(\w+):\s*$/);
    if (parentMatch) {
      stack.push({ key: parentMatch[1], indent: ind });
      const parent = stack.slice(0, -1).map((s) => s.key);
      const target = parent.reduce((a, k) => (a[k] ??= {}), out);
      if (target[parentMatch[1]] === undefined) target[parentMatch[1]] = {};
      continue;
    }

    // Detect "key: value" (scalar)
    const scalarMatch = line.match(/^\s*(\w+):\s*(.+?)\s*$/);
    if (scalarMatch) {
      const key = scalarMatch[1];
      const val = parseScalar(scalarMatch[2]);
      const parent = stack.map((s) => s.key);
      const target = parent.reduce((a, k) => (a[k] ??= {}), out);
      target[key] = val;
      continue;
    }

    // Detect list item under current section: "- { id: ..., title: ... }"
    const listObjMatch = line.match(/^\s*-\s*\{(.+)\}\s*$/);
    if (listObjMatch) {
      const parent = stack.map((s) => s.key);
      const key = parent[parent.length - 1];
      const grand = parent.slice(0, -1).reduce((a, k) => (a[k] ??= {}), out);
      const pathKey = parent.join(".");
      if (!startedLists.has(pathKey)) {
        // First list item we've seen for this key in THIS parse — wipe the
        // default array so we replace it (not append on top of it).
        grand[key] = [];
        startedLists.add(pathKey);
      }
      grand[key].push(parseInlineObj(listObjMatch[1]));
      continue;
    }
  }
  return out as ManualState;
}

function parseInlineObj(body: string): any {
  // Split on commas at top level (no nesting in our schema).
  const pairs: string[] = [];
  let buf = "";
  let quote = "";
  for (const ch of body) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === "," ) { pairs.push(buf); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) pairs.push(buf);
  const obj: any = {};
  for (const p of pairs) {
    const m = p.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    obj[m[1]] = parseScalar(m[2]);
  }
  return obj;
}

function parseScalar(v: string): string | number | boolean | string[] {
  v = v.trim().replace(/,$/, "").trim();
  // Inline array: [] or ["a", "b", 'c']
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((p) => {
      let s = p.trim();
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
      return s;
    });
  }
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return parseFloat(v);
  return v;
}

export async function loadManual(app: App): Promise<ManualState> {
  const file = await ensureFile(app);
  const content = await app.vault.read(file);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return DEFAULT_MANUAL;
  try {
    return parseManualYAML(fmMatch[1]);
  } catch {
    return DEFAULT_MANUAL;
  }
}
