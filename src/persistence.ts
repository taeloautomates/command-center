/**
 * Persistence layer.
 *
 * Two tiers:
 * 1. Plugin data (loadData/saveData) → ephemeral UI state, timer, placed stones, current tab.
 * 2. Vault markdown files under `command-center/` → todos and MIT, so they're real notes the
 *    user can edit and link/search like any other Obsidian content.
 */

import { App, normalizePath, TFile } from "obsidian";
import type { Todo, MIT, TrunkItem } from "./types";

export const TODOS_SIDE_PROJECT = "command-center/todos/side-project.md";
export const TODOS_EOD = "command-center/todos/eod.md";
export const MIT_FILE = "command-center/mit.md";
export const TRUNK_FILE = "command-center/trunk.md";
export const BRAINDUMP_FILE = "command-center/braindump.md";

const SEED_SIDE_PROJECT_TODOS = `# Side Project — sprint todos

> Edited here syncs back into the Command Center dashboard.
> Drop \`#tag\` at the end of a line to tag it.

- [x] Wire refresh-token rotation #auth
- [x] Tag v0.4.2 release candidate #ops
- [ ] Draft CLI flag for --vault-path #core
- [ ] Write migration notes for v0.4 #docs
- [ ] Triage the 4 issues from yesterday #triage
`;

const SEED_EOD_TODOS = `# End-of-day checklist

- [x] Standup notes filed
- [x] PRs reviewed
- [ ] Calendar prepped for tomorrow
- [ ] Slack zeroed
`;

const SEED_MIT = `---
project: youtube · @taelo_kim
est: 45
startedAt: "11:02"
---

Edit /watch tutorial — final cut pass
`;

async function ensureFile(app: App, path: string, seed: string): Promise<TFile> {
  const np = normalizePath(path);
  let f = app.vault.getAbstractFileByPath(np);
  if (f instanceof TFile) return f;

  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return await app.vault.create(np, seed);
}

const CHECKBOX_RE = /^\s*[-*]\s+\[( |x|X)\]\s+(.*?)(?:\s+#([\w-]+))?\s*$/;

export function parseTodos(content: string): Todo[] {
  const out: Todo[] = [];
  let idx = 0;
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(CHECKBOX_RE);
    if (!m) continue;
    out.push({
      id: `t${idx++}`,
      done: m[1].toLowerCase() === "x",
      text: m[2].trim(),
      tag: m[3],
    });
  }
  return out;
}

export function serializeTodos(todos: Todo[], heading: string): string {
  const lines = [heading, ""];
  for (const t of todos) {
    const box = t.done ? "x" : " ";
    const tag = t.tag ? ` #${t.tag}` : "";
    lines.push(`- [${box}] ${t.text}${tag}`);
  }
  lines.push("");
  return lines.join("\n");
}

export async function loadTodos(app: App, path: string, seed: string): Promise<Todo[]> {
  const file = await ensureFile(app, path, seed);
  const content = await app.vault.read(file);
  return parseTodos(content);
}

export async function saveTodos(app: App, path: string, todos: Todo[]): Promise<void> {
  const np = normalizePath(path);
  const file = app.vault.getAbstractFileByPath(np);
  if (!(file instanceof TFile)) return;

  const content = await app.vault.read(file);
  const lines = content.split(/\r?\n/);
  const preamble: string[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    if (CHECKBOX_RE.test(lines[i])) break;
    preamble.push(lines[i]);
  }

  const todoLines = todos.map((t) => {
    const box = t.done ? "x" : " ";
    const tag = t.tag ? ` #${t.tag}` : "";
    return `- [${box}] ${t.text}${tag}`;
  });

  let trailing: string[] = [];
  let j = lines.length - 1;
  while (j >= i && !CHECKBOX_RE.test(lines[j])) {
    trailing.unshift(lines[j]);
    j--;
  }

  const next = [...preamble, ...todoLines, ...trailing].join("\n");
  if (next !== content) {
    await app.vault.modify(file, next);
  }
}

export async function loadSideProjectTodos(app: App): Promise<Todo[]> {
  return loadTodos(app, TODOS_SIDE_PROJECT, SEED_SIDE_PROJECT_TODOS);
}
export async function loadEODTodos(app: App): Promise<Todo[]> {
  return loadTodos(app, TODOS_EOD, SEED_EOD_TODOS);
}
export async function saveSideProjectTodos(app: App, todos: Todo[]) {
  return saveTodos(app, TODOS_SIDE_PROJECT, todos);
}
export async function saveEODTodos(app: App, todos: Todo[]) {
  return saveTodos(app, TODOS_EOD, todos);
}

export async function loadMIT(app: App): Promise<MIT> {
  const file = await ensureFile(app, MIT_FILE, SEED_MIT);
  const content = await app.vault.read(file);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let project = "side project";
  let est = 45;
  let startedAt = "—";
  let body = content;
  if (fmMatch) {
    body = fmMatch[2];
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (!kv) continue;
      if (kv[1] === "project") project = kv[2];
      else if (kv[1] === "est") est = parseInt(kv[2], 10) || 45;
      else if (kv[1] === "startedAt") startedAt = kv[2];
    }
  }
  const title = body.trim().split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? "Your next task";
  return { title, project, est, startedAt };
}

export function isCommandCenterPath(path: string): boolean {
  return (
    path === TODOS_SIDE_PROJECT ||
    path === TODOS_EOD ||
    path === MIT_FILE ||
    path === TRUNK_FILE ||
    path === BRAINDUMP_FILE
  );
}

/* ─── Trunk ─────────────────────────────────────────────────────
   The deferred-task tray that sits below the MIT banner.
   Format (one per line):  - title · project · 45m
   Project and estimate are optional. Estimate accepts `45m`, `1h`, `1h30`. */

const SEED_TRUNK = `# Trunk

> Deferred tasks waiting their turn at the Front Seat.
> Click a trunk card on the dashboard to promote it — the current MIT
> slides back here. Format below: \`- title · project · estimate\` (project
> and estimate optional).

- Tag v0.4.2 release candidate · vault-cli · 30m
- Draft CLI flag for --vault-path · vault-cli · 45m
- Write migration notes for v0.4 · docs · 1h
- Triage the 4 issues from yesterday · ops · 20m
`;

const TRUNK_LINE_RE = /^\s*[-*]\s+(.+)$/;

function parseEst(raw: string): number | undefined {
  const m = raw.match(/^(\d+)h(\d+)?$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2] || "0", 10);
  const mm = raw.match(/^(\d+)m$/);
  if (mm) return parseInt(mm[1], 10);
  return undefined;
}

function fmtEst(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h}h` : `${h}h${rem}`;
}

export function parseTrunk(content: string): TrunkItem[] {
  const out: TrunkItem[] = [];
  let idx = 0;
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(TRUNK_LINE_RE);
    if (!m) continue;
    if (raw.trim().startsWith("- [")) continue; // skip checkbox lines (those are todos)
    const parts = m[1].split(/\s*·\s*/);
    const title = (parts[0] ?? "").trim();
    if (!title) continue;
    const item: TrunkItem = { id: `tr${idx++}`, title };
    for (const p of parts.slice(1)) {
      const e = parseEst(p.trim());
      if (e !== undefined) item.estMin = e;
      else if (!item.project) item.project = p.trim();
    }
    out.push(item);
  }
  return out;
}

export function serializeTrunk(items: TrunkItem[]): string {
  const head = `# Trunk

> Deferred tasks waiting their turn at the Front Seat.
> Click a trunk card on the dashboard to promote it — the current MIT
> slides back here.

`;
  const lines = items.map((it) => {
    const bits = [it.title];
    if (it.project) bits.push(it.project);
    if (it.estMin) bits.push(fmtEst(it.estMin));
    return `- ${bits.join(" · ")}`;
  });
  return head + lines.join("\n") + "\n";
}

export async function loadTrunk(app: App): Promise<TrunkItem[]> {
  const file = await ensureFile(app, TRUNK_FILE, SEED_TRUNK);
  const content = await app.vault.read(file);
  return parseTrunk(content);
}

export async function saveTrunk(app: App, items: TrunkItem[]): Promise<void> {
  const np = normalizePath(TRUNK_FILE);
  const file = app.vault.getAbstractFileByPath(np);
  if (!(file instanceof TFile)) return;
  await app.vault.modify(file, serializeTrunk(items));
}

/* ─── Brain dump ────────────────────────────────────────────────
   Quick-capture surface. Each entry is one bullet, newest at top:
     - 2026-05-20 14:32 · idea text here */

export type BrainDumpEntry = { ts: string; text: string };

const SEED_BRAINDUMP = `# Brain dump

> Frictionless idea capture. Add lines from the dashboard with Cmd-Enter,
> or edit this file directly. Newest entries on top.

`;

const BRAINDUMP_LINE_RE = /^\s*[-*]\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*·\s*(.+)$/;

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseBrainDump(content: string): BrainDumpEntry[] {
  const out: BrainDumpEntry[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(BRAINDUMP_LINE_RE);
    if (m) out.push({ ts: m[1], text: m[2].trim() });
  }
  return out;
}

export async function loadBrainDump(app: App): Promise<BrainDumpEntry[]> {
  const file = await ensureFile(app, BRAINDUMP_FILE, SEED_BRAINDUMP);
  const content = await app.vault.read(file);
  return parseBrainDump(content);
}

export async function appendBrainDump(app: App, text: string): Promise<void> {
  const t = text.trim();
  if (!t) return;
  const file = await ensureFile(app, BRAINDUMP_FILE, SEED_BRAINDUMP);
  const content = await app.vault.read(file);
  // Insert the new line right after the header block (above any existing entries).
  const lines = content.split(/\r?\n/);
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (BRAINDUMP_LINE_RE.test(lines[i])) { insertAt = i; break; }
    insertAt = i + 1;
  }
  const newLine = `- ${nowStamp()} · ${t}`;
  lines.splice(insertAt, 0, newLine);
  await app.vault.modify(file, lines.join("\n"));
}

/** Write a new MIT to mit.md, preserving the existing frontmatter shape. */
export async function saveMIT(app: App, mit: MIT): Promise<void> {
  const np = normalizePath(MIT_FILE);
  const file = app.vault.getAbstractFileByPath(np);
  const body = `---
project: ${mit.project}
est: ${mit.est}
startedAt: "${mit.startedAt}"
---

${mit.title}
`;
  if (file instanceof TFile) await app.vault.modify(file, body);
  else {
    const folder = np.substring(0, np.lastIndexOf("/"));
    if (folder && !app.vault.getAbstractFileByPath(folder)) {
      await app.vault.createFolder(folder).catch(() => {});
    }
    await app.vault.create(np, body);
  }
}
