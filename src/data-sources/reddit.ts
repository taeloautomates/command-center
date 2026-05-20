/**
 * Reddit feed — top posts from a list of AI/tech subreddits.
 * Uses the public reddit.com/r/<sub>/top.json endpoint (no auth required).
 * Reddit requires a non-default User-Agent or rate-limits aggressively, so
 * we pass a custom one via requestUrl headers.
 */

import { requestUrl } from "obsidian";

export type RedditPost = {
  rank: number;
  title: string;
  url: string;            // permalink to discussion
  externalUrl?: string;   // if the post links to an external site
  subreddit: string;
  score: number;
  comments: number;
  ageMs: number;
  flair?: string;
};

const SUBS = ["LocalLLaMA", "MachineLearning", "singularity", "ChatGPT", "OpenAI"];
const UA = "obsidian-command-center/0.1 (by u/anonymous)";

async function fetchSub(sub: string, limit = 5): Promise<any[]> {
  const url = `https://www.reddit.com/r/${sub}/top.json?limit=${limit}&t=day`;
  try {
    const res = await requestUrl({
      url,
      throw: false,
      headers: { "User-Agent": UA },
    });
    if (res.status >= 400) return [];
    return res.json?.data?.children ?? [];
  } catch {
    return [];
  }
}

export async function loadRedditPosts(limit = 8): Promise<RedditPost[]> {
  const all = await Promise.all(SUBS.map((s) => fetchSub(s, 5)));
  const nowMs = Date.now();
  const items: RedditPost[] = [];
  for (let i = 0; i < all.length; i++) {
    const sub = SUBS[i];
    for (const child of all[i]) {
      const d = child?.data;
      if (!d || !d.title) continue;
      if (d.over_18) continue; // skip NSFW
      const created = (d.created_utc || 0) * 1000;
      const isSelf = !!d.is_self;
      items.push({
        rank: 0,
        title: d.title,
        url: `https://www.reddit.com${d.permalink}`,
        externalUrl: isSelf ? undefined : d.url,
        subreddit: sub,
        score: d.score ?? 0,
        comments: d.num_comments ?? 0,
        ageMs: Math.max(0, nowMs - created),
        flair: d.link_flair_text || undefined,
      });
    }
  }
  // Rank: hot-ish (score / age in hours), score floor 30 to filter noise.
  const filtered = items.filter((it) => it.score >= 30);
  filtered.sort((a, b) => {
    const ah = a.ageMs / 3600000;
    const bh = b.ageMs / 3600000;
    return (b.score - bh * 6) - (a.score - ah * 6);
  });
  return filtered.slice(0, limit).map((it, i) => ({ ...it, rank: i + 1 }));
}

export function ageStr(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
