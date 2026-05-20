/**
 * Hacker News + AI news feed.
 *
 * Uses HN's Algolia search API — public, no auth, fast.
 *   https://hn.algolia.com/api/v1/search_by_date?tags=story&...
 *
 * We pull two slices and merge:
 *   1. Top recent stories (any topic) above a points floor
 *   2. AI-keyword filtered stories (Anthropic, OpenAI, LLM, Claude, etc.)
 * Deduped by objectID, ranked by recency × score.
 */

import { requestUrl } from "obsidian";

export type NewsItem = {
  rank: number;
  title: string;
  url: string;
  source: string;          // "HN" or hostname
  points: number;
  comments: number;
  ageMs: number;
  aiTagged: boolean;
};

const AI_KEYWORDS = [
  "anthropic", "openai", "claude", "gpt", "llm", "gemini",
  "agent", "agentic", "mcp", "rag", "deepmind", "mistral",
  "perplexity", "cursor", "copilot", "huggingface", "ollama",
  "groq", "stable diffusion", "midjourney", "diffusion",
];

function isAITagged(title: string): boolean {
  const t = title.toLowerCase();
  return AI_KEYWORDS.some((k) => t.includes(k));
}

function hostname(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "news.ycombinator.com";
  }
}

async function searchHN(params: Record<string, string>): Promise<any[]> {
  const qs = new URLSearchParams(params).toString();
  const url = `https://hn.algolia.com/api/v1/search_by_date?${qs}`;
  try {
    const res = await requestUrl({ url, throw: false });
    if (res.status >= 400) return [];
    return res.json?.hits ?? [];
  } catch {
    return [];
  }
}

function hitToItem(hit: any, rank: number, nowMs: number): NewsItem | null {
  if (!hit?.title) return null;
  const created = (hit.created_at_i || 0) * 1000;
  const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
  return {
    rank,
    title: hit.title,
    url,
    source: hit.url ? hostname(hit.url) : "HN",
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
    ageMs: Math.max(0, nowMs - created),
    aiTagged: isAITagged(hit.title),
  };
}

export async function loadHNStories(limit = 8): Promise<NewsItem[]> {
  // Two slices: top recent, and AI-filtered. Merge with dedup.
  const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const [hot, ai] = await Promise.all([
    searchHN({
      tags: "story",
      numericFilters: `points>30,created_at_i>${since}`,
      hitsPerPage: "20",
    }),
    searchHN({
      tags: "story",
      query: "AI OR LLM OR Claude OR Anthropic OR OpenAI OR agents",
      numericFilters: `points>10,created_at_i>${since}`,
      hitsPerPage: "20",
    }),
  ]);

  const nowMs = Date.now();
  const byId = new Map<string, NewsItem>();
  for (const h of [...hot, ...ai]) {
    if (!h?.objectID) continue;
    if (byId.has(h.objectID)) continue;
    const item = hitToItem(h, 0, nowMs);
    if (item) byId.set(h.objectID, item);
  }
  // Rank: AI-tagged float to the top, otherwise score × recency.
  const items = Array.from(byId.values());
  items.sort((a, b) => {
    if (a.aiTagged !== b.aiTagged) return a.aiTagged ? -1 : 1;
    // Cheap "hotness": points minus age-in-hours, like HN's own ranking.
    const ah = a.ageMs / 3600000;
    const bh = b.ageMs / 3600000;
    return (b.points - bh * 3) - (a.points - ah * 3);
  });
  return items.slice(0, limit).map((it, i) => ({ ...it, rank: i + 1 }));
}

export function ageStr(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
