/**
 * Quotes feed for the Inspired tab.
 *
 * Source: command-center/quotes.md inside the vault.
 * Format (one block per quote, blank line separated):
 *
 *   > Make good art.
 *   — Neil Gaiman · UArts commencement · 2012 · #speech
 *
 * The `>` marks the quote body. The attribution line uses ` · ` separators;
 * a trailing `#tag` is optional.
 */

import { App, normalizePath, TFile } from "obsidian";

export type Quote = {
  text: string;
  author: string;
  source: string;
  tag: string;
};

export const QUOTES_FILE = "command-center/quotes.md";

const SEED = `# Quotes

> Drop quotes here, one block per quote. Blockquote line for the text, then a dash-prefixed line for attribution. Tags are optional. The Inspired tab rotates the "Quote of the Day" deterministically from the date, and lists the rest as Saved Highlights.

---

> How we spend our days is, of course, how we spend our lives.
— Annie Dillard · The Writing Life · 1989 · #craft

> Make good art.
— Neil Gaiman · UArts commencement · 2012 · #speech

> Discipline equals freedom.
— Jocko Willink · Discipline Equals Freedom · #book

> The cave you fear to enter holds the treasure you seek.
— Joseph Campbell · lecture notes · #book

> Comparison is the thief of joy.
— Theodore Roosevelt · attributed · #saying

> Be water, my friend.
— Bruce Lee · interview · 1971 · #interview

> Whatever you can do, or dream you can, begin it.
— Goethe · Faust · 1808 · #verse

> The obstacle is the way.
— Marcus Aurelius · Meditations · book V · #stoic

> Talent is cheaper than table salt.
— Stephen King · On Writing · 2000 · #craft
`;

export function parseQuotes(content: string): Quote[] {
  const lines = content.split(/\r?\n/);
  const quotes: Quote[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^>\s*(.+?)\s*$/);
    if (!m) continue;
    // Look at next non-empty line for attribution
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    const attr = lines[j];
    const attrMatch = attr.match(/^[—\-–]\s*(.+)$/);
    if (!attrMatch) continue;
    const parts = attrMatch[1].split(/\s*·\s*/);
    let tag = "";
    const last = parts[parts.length - 1];
    if (last && last.startsWith("#")) {
      tag = last.slice(1);
      parts.pop();
    }
    const author = parts[0]?.trim() ?? "—";
    const source = parts.slice(1).join(" · ").trim() || "—";
    quotes.push({ text: m[1].replace(/^"|"$/g, ""), author, source, tag });
    i = j;
  }
  return quotes;
}

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(QUOTES_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return app.vault.create(np, SEED);
}

export async function loadQuotes(app: App): Promise<Quote[]> {
  const file = await ensureFile(app);
  const content = await app.vault.read(file);
  return parseQuotes(content);
}

/** Pick a deterministic "quote of the day" from a quote list. */
export function pickDailyQuote(quotes: Quote[], date = new Date()): Quote | null {
  if (quotes.length === 0) return null;
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % quotes.length;
  return quotes[idx];
}
