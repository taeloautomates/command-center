/**
 * Today's Story — one inspiring history beat per day.
 *
 * Source: Wikipedia's REST "On this day · selected" endpoint.
 *   https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/MM/DD
 *
 * Wikipedia editors curate the most important historical events for each
 * calendar day. Each entry has a year, a one-paragraph event description,
 * and a linked subject page (with thumbnail + extract). We pick one per
 * day via deterministic hash so the surface shows the same story all day.
 *
 * Why not "tfa" (today's featured article): tfa quality is hit-or-miss
 * (today it was an intestinal worm). "selected" is curated highlights and
 * reliably contains figures, inventions, creative works, treaties — the
 * kind of thing you'd actually read for 30 seconds and feel something.
 */

import { requestUrl } from "obsidian";

export type TodaysStory = {
  year: string;
  /** The event description (what happened that year). */
  text: string;
  /** The linked subject — usually a person, place, or work. */
  subject: string;
  /** Extract of the subject's Wikipedia page. */
  extract: string;
  thumbnail?: string;
  url: string;            // desktop Wikipedia URL
};

const CACHE_TTL_MS = 60 * 60 * 1000;     // 1h — content is per-day anyway
let cache: { story: TodaysStory | null; fetchedAt: number; dateKey: string } | null = null;

function dailyHash(date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function loadTodaysStory(): Promise<TodaysStory | null> {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  if (cache && cache.dateKey === dateKey && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.story;
  }

  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  try {
    const res = await requestUrl({
      url: `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${mm}/${dd}`,
      throw: false,
    });
    if (res.status >= 400) {
      cache = { story: null, fetchedAt: Date.now(), dateKey };
      return null;
    }
    const events: any[] = res.json?.selected ?? [];
    // Only entries with a thumbnail-bearing linked page — better UI.
    const eligible: { event: any; page: any }[] = [];
    for (const e of events) {
      const pages: any[] = e.pages ?? [];
      const withThumb = pages.find((p) => p.thumbnail?.source);
      if (withThumb && withThumb.extract) {
        eligible.push({ event: e, page: withThumb });
      }
    }
    if (eligible.length === 0) {
      cache = { story: null, fetchedAt: Date.now(), dateKey };
      return null;
    }
    const picked = eligible[dailyHash(now) % eligible.length];
    const story: TodaysStory = {
      year: String(picked.event.year ?? ""),
      text: stripParenPictured(String(picked.event.text ?? "")).trim(),
      subject: picked.page.titles?.normalized || picked.page.title || "",
      extract: String(picked.page.extract ?? "").trim(),
      thumbnail: picked.page.thumbnail?.source,
      url: picked.page.content_urls?.desktop?.page
        || `https://en.wikipedia.org/wiki/${encodeURIComponent(picked.page.title || "")}`,
    };
    cache = { story, fetchedAt: Date.now(), dateKey };
    return story;
  } catch (e) {
    console.warn("[command-center] today-story load failed:", e);
    return null;
  }
}

/** Wikipedia event text sometimes contains "(pictured)" — strip it for cleaner UI. */
function stripParenPictured(s: string): string {
  return s.replace(/\s*\(pictured\)\s*/gi, " ").replace(/\s{2,}/g, " ");
}

/** Upscale Wikipedia thumbnail URL to a larger size (they accept px-width path swaps). */
export function upscaleWikiThumb(url: string, px = 600): string {
  if (!url) return url;
  return url.replace(/\/(\d+)px-/, `/${px}px-`);
}
