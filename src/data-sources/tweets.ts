/**
 * Curated tweets feed.
 *
 * Real automated tweets via API now require a paid X subscription, and the
 * public mirrors (Nitter, syndication endpoints) are dead or rate-limited.
 * So this feed reads a hand-curated markdown file in the vault — the user
 * pastes tweets they want surfaced, the dashboard renders them.
 *
 * Format (one tweet per block, blank-line separated):
 *
 *   > Quoted tweet text goes here, can be multiple lines until the dash.
 *   — @author · 2h · https://x.com/author/status/123456
 */

import { App, normalizePath, TFile } from "obsidian";

export type Tweet = {
  text: string;
  author: string;
  age: string;
  url: string;
};

export const TWEETS_FILE = "command-center/tweets.md";

const SEED = `# Tweets

> Hand-curated tweet feed. Paste tweets you want pinned to the dashboard here.
> X's free API was killed and the public mirrors are unreliable — so this feed
> is markdown-backed instead. Edit this file, dashboard updates.

> Format below. Use a blockquote for the tweet text, then a dash-line with
> \`@handle · age · url\`. Newest at top.

---

> Real-time AI: it's not about the model, it's about the systems around it.
— @ID_AA_Carmack · 2h · https://x.com/ID_AA_Carmack/status/example1

> shipping is shipping. taste is taste.
— @sama · 6h · https://x.com/sama/status/example2

> Plot twist: the best agent framework was prompt engineering all along.
— @swyx · 1d · https://x.com/swyx/status/example3

> Daily reminder that "vibes" is a load-bearing technical term in 2026.
— @karpathy · 2d · https://x.com/karpathy/status/example4
`;

async function ensureFile(app: App): Promise<TFile> {
  const np = normalizePath(TWEETS_FILE);
  const existing = app.vault.getAbstractFileByPath(np);
  if (existing instanceof TFile) return existing;
  const folder = np.substring(0, np.lastIndexOf("/"));
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder).catch(() => {});
  }
  return await app.vault.create(np, SEED);
}

export function parseTweets(content: string): Tweet[] {
  const lines = content.split(/\r?\n/);
  const out: Tweet[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const quoteMatch = line.match(/^>\s+(.+?)\s*$/);
    if (!quoteMatch) { i++; continue; }
    // Collect continuing quote lines.
    let text = quoteMatch[1];
    let j = i + 1;
    while (j < lines.length) {
      const m = lines[j].match(/^>\s+(.+?)\s*$/);
      if (!m) break;
      text += " " + m[1];
      j++;
    }
    // Look for attribution line (dash-prefixed) within the next few lines.
    let attrIdx = -1;
    for (let k = j; k < Math.min(j + 4, lines.length); k++) {
      if (/^[—\-–]\s/.test(lines[k])) { attrIdx = k; break; }
      if (lines[k].trim() && !lines[k].trim().startsWith(">")) break;
    }
    if (attrIdx === -1) { i = j + 1; continue; }
    const attr = lines[attrIdx].replace(/^[—\-–]\s+/, "");
    const parts = attr.split(/\s*·\s*/);
    // Find URL part (starts with http)
    const urlPart = parts.find((p) => /^https?:\/\//.test(p.trim()));
    const ageParts = parts.filter((p) => p !== urlPart && !p.startsWith("@"));
    const authorPart = parts.find((p) => p.trim().startsWith("@"));
    out.push({
      text: text.replace(/^"|"$/g, ""),
      author: authorPart?.trim() ?? "@unknown",
      age: ageParts[0]?.trim() ?? "—",
      url: urlPart?.trim() ?? "#",
    });
    i = attrIdx + 1;
  }
  return out;
}

export async function loadTweets(app: App): Promise<Tweet[]> {
  const file = await ensureFile(app);
  const content = await app.vault.read(file);
  return parseTweets(content);
}
