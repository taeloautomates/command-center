/**
 * Read the latest /trendscout report from the content-system outputs/trends/ directory.
 * Trend reports follow a known format:
 *   #### 1. ⭐ **Title text** (May 14, 2026)
 *   - Sources: [foo](url) · [bar](url)
 *   ...
 *
 * We extract the top N numbered items from "News & viral signals — Tier 1".
 */

import { listDir, readFileSafe, timeAgo } from "./fs-helpers";

export type TrendItem = {
  rank: number;
  title: string;
  source: string;     // first source name
  age: string;        // pulled-X-ago style; falls back to date in title
  pickOfTheWeek?: boolean;
};

export type TrendReport = {
  items: TrendItem[];
  reportDate: string;
  pulledAgo: string;
  pickOfTheWeek?: string;
};

const TRENDS_DIR = "~/Desktop/taelokim-website/taelo-content-system/outputs/trends/";

const HEADING_RE = /^####\s+(\d+)\.\s*(⭐\s*)?\*\*(.+?)\*\*(?:\s*\((.+?)\))?\s*$/;
const SOURCES_RE = /^\s*-\s*\*\*Sources?:\*\*\s*(.+)$/i;
const PICK_RE = /^\*\*🏆?\s*Pick of the week.*?:\s*"(.+?)"\*\*/i;

function parseFirstSource(line: string): string {
  // pull the first [name](url) link's name
  const m = line.match(/\[([^\]]+)\]\(/);
  if (m) return m[1].replace(/^https?:\/\//, "").split("/")[0];
  // otherwise first comma-or-dot-separated token
  return line.split(/[·,]/)[0].trim().slice(0, 24);
}

export function parseTrendReport(md: string): { items: TrendItem[]; pick?: string } {
  const lines = md.split(/\r?\n/);
  const items: TrendItem[] = [];
  let pick: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!pick) {
      const pm = line.match(PICK_RE);
      if (pm) pick = pm[1];
    }
    const hm = line.match(HEADING_RE);
    if (!hm) continue;

    const rank = parseInt(hm[1], 10);
    const title = hm[3].trim();
    const datePart = hm[4]?.trim() ?? "";

    // Look ahead a few lines for the Sources line
    let source = "trend report";
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const sm = lines[j].match(SOURCES_RE);
      if (sm) {
        source = parseFirstSource(sm[1]);
        break;
      }
    }

    items.push({
      rank,
      title,
      source,
      age: datePart || "—",
    });
  }

  // Mark item 1 as pick if we have one
  if (items[0] && pick) items[0].pickOfTheWeek = true;

  return { items, pick };
}

export async function loadTrendReport(): Promise<TrendReport | null> {
  const entries = await listDir(TRENDS_DIR);
  const reports = entries.filter((e) => /^\d{4}-\d{2}-\d{2}-trend-report\.md$/.test(e.name));
  if (reports.length === 0) return null;
  reports.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const latest = reports[0];
  const content = await readFileSafe(latest.path);
  if (!content) return null;

  const { items, pick } = parseTrendReport(content);
  return {
    items: items.slice(0, 5),
    reportDate: latest.name.slice(0, 10),
    pulledAgo: timeAgo(latest.mtimeMs),
    pickOfTheWeek: pick,
  };
}
