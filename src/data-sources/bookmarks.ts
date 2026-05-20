/**
 * Bookmark revival.
 *
 * Things saved/bookmarked but never revisited. The dashboard surfaces a
 * rotating slice each day so they don't get buried forever.
 *
 * Source: command-center/saved.md — one bookmark per `- ` bullet.
 * Format: `- title · source · url`   (source optional)
 *
 * Rotation: deterministic by date — picks N consecutive items from the list
 * starting at index = dayHash() mod len, wrapping. Different items surface
 * each day; everything cycles back around.
 */

import { App, normalizePath, TFile } from "obsidian";

export type Bookmark = {
  title: string;
  source: string;
  url: string;
};

export const SAVED_FILE = "command-center/saved.md";

const SEED = `# Saved bookmarks

> Things you bookmarked but haven't revisited. The dashboard surfaces a few
> daily on the Inspired tab so they don't get buried.

> Format below — one bookmark per bullet:
> \`- title · source (optional) · https://url\`

- @karpathy on tokenization being the biggest hack in LLMs · X · https://x.com/karpathy/status/example1
- "The Bitter Lesson" by Rich Sutton · essay · http://incompleteideas.net/IncIdeas/BitterLesson.html
- Hokusai's late period — the woodblock master at 70 · YouTube · https://www.youtube.com/watch?v=example2
- @sama "shipping is shipping. taste is taste." · X · https://x.com/sama/status/example3
- Anthropic's "Building Effective Agents" · Anthropic blog · https://www.anthropic.com/research/building-effective-agents
- @swyx on the agent-engineer career arc · X · https://x.com/swyx/status/example4
- Annie Dillard — The Writing Life (chapter 1 highlights) · book · https://example.com/dillard-writing-life
- Joscha Bach on consciousness and substrate independence · podcast · https://example.com/bach-podcast
`;

const LINE_RE = /^\s*[-*]\s+(.+)$/;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(SAVED_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

export function parseBookmarks(content: string): Bookmark[] {
  const out: Bookmark[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(LINE_RE);
    if (!m) continue;
    if (raw.trim().startsWith("- [")) continue; // ignore checkbox lines
    const parts = m[1].split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
    const urlIdx = parts.findIndex((p) => /^https?:\/\//.test(p));
    if (urlIdx < 0) continue;
    const url = parts[urlIdx];
    const before = parts.slice(0, urlIdx);
    if (before.length === 0) continue;
    const title = before[0];
    const source = before.slice(1).join(" · ") || hostname(url);
    out.push({ title, source, url });
  }
  return out;
}

function hostname(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

/** Daily index — deterministic, same all day. */
function dailyOffset(len: number, date = new Date()): number {
  if (len === 0) return 0;
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

/** Pick N bookmarks for today by rotating through the list. */
export function pickDailyBookmarks(all: Bookmark[], n = 3, date = new Date()): Bookmark[] {
  if (all.length === 0) return [];
  const offset = dailyOffset(all.length, date);
  const out: Bookmark[] = [];
  for (let i = 0; i < Math.min(n, all.length); i++) {
    out.push(all[(offset + i) % all.length]);
  }
  return out;
}

export async function loadBookmarks(app: App): Promise<Bookmark[]> {
  const file = await ensureFile(app);
  const content = await app.vault.read(file);
  return parseBookmarks(content);
}
