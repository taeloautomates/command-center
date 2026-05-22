/**
 * YouTube Data API v3 — channel stats + recent uploads.
 *
 * Why a plain API key (not OAuth): we only read public data (subscriber
 * count, view count, video metadata). No analytics, no private data.
 * A free key from Google Cloud Console works — 10,000 quota units/day.
 *
 * Cost per refresh:
 *   - channels (snippet,statistics,contentDetails)  =  1 unit
 *   - playlistItems (snippet,contentDetails)        =  1 unit
 *   - videos (statistics)                           =  1 unit
 *   Total: 3 units per refresh. With a 10-min cache that's ~432 units/day,
 *   well under quota.
 *
 * Cache strategy: 10-min in-memory cache. Subs don't move every minute,
 * and the dashboard auto-refresh runs every 60s — caching here means we
 * don't burn quota on every tick.
 *
 * Graceful failure: missing apiKey, missing handle, or any HTTP error
 * returns null. The Social tab falls back to the manual values in that case.
 */

import { requestUrl } from "obsidian";

export type YouTubeUpload = {
  videoId: string;
  title: string;
  publishedAt: string;     // ISO 8601
  thumbnail: string;
  views?: number;
  likes?: number;
  url: string;
};

export type YouTubeStats = {
  subs: number;
  totalViews: number;
  totalVideos: number;
  channelTitle: string;
  channelThumb?: string;
  recentUploads: YouTubeUpload[];
  fetchedAt: number;        // ms epoch
};

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: YouTubeStats | null = null;

/** Normalize a handle to the API format. Accepts "@taelo_kim", "taelo_kim", or a channel ID. */
function normalizeHandle(input: string): { handle?: string; channelId?: string } {
  const s = input.trim();
  if (!s) return {};
  // UC... channel IDs are 24 chars starting with UC
  if (/^UC[A-Za-z0-9_-]{22}$/.test(s)) return { channelId: s };
  return { handle: s.startsWith("@") ? s : "@" + s };
}

async function fetchJSON(url: string): Promise<any | null> {
  try {
    const res = await requestUrl({ url, throw: false });
    if (res.status >= 400) {
      console.warn("[command-center] YouTube API error", res.status, res.text?.slice(0, 200));
      return null;
    }
    return res.json;
  } catch (e) {
    console.warn("[command-center] YouTube fetch failed:", e);
    return null;
  }
}

export async function loadYouTubeChannel(
  apiKey: string,
  handleOrId: string,
): Promise<YouTubeStats | null> {
  if (!apiKey || !handleOrId) return null;
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache;

  const { handle, channelId } = normalizeHandle(handleOrId);
  const idParam = channelId
    ? `id=${encodeURIComponent(channelId)}`
    : `forHandle=${encodeURIComponent(handle!)}`;

  // 1. Channel info: stats + uploads playlist ID.
  const chData = await fetchJSON(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${idParam}&key=${apiKey}`,
  );
  const item = chData?.items?.[0];
  if (!item) return null;

  const uploadsPlaylistId: string | undefined = item.contentDetails?.relatedPlaylists?.uploads;

  // 2. Recent uploads from the uploads playlist (cheaper than search).
  let uploads: YouTubeUpload[] = [];
  if (uploadsPlaylistId) {
    const pl = await fetchJSON(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=5&key=${apiKey}`,
    );
    const plItems: any[] = pl?.items ?? [];
    const videoIds = plItems
      .map((i) => i.contentDetails?.videoId)
      .filter(Boolean)
      .join(",");

    // 3. Per-video statistics (views, likes) for the 5 most recent.
    const viewMap: Record<string, { views: number; likes: number }> = {};
    if (videoIds) {
      const vids = await fetchJSON(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`,
      );
      for (const v of vids?.items ?? []) {
        viewMap[v.id] = {
          views: parseInt(v.statistics?.viewCount ?? "0", 10),
          likes: parseInt(v.statistics?.likeCount ?? "0", 10),
        };
      }
    }

    uploads = plItems.map((i): YouTubeUpload => {
      const vid = i.contentDetails?.videoId;
      const thumbs = i.snippet?.thumbnails ?? {};
      return {
        videoId: vid,
        title: i.snippet?.title || "(untitled)",
        publishedAt: i.contentDetails?.videoPublishedAt || i.snippet?.publishedAt || "",
        thumbnail: thumbs.medium?.url || thumbs.high?.url || thumbs.default?.url || "",
        views: viewMap[vid]?.views,
        likes: viewMap[vid]?.likes,
        url: `https://www.youtube.com/watch?v=${vid}`,
      };
    });
  }

  cache = {
    subs: parseInt(item.statistics?.subscriberCount ?? "0", 10),
    totalViews: parseInt(item.statistics?.viewCount ?? "0", 10),
    totalVideos: parseInt(item.statistics?.videoCount ?? "0", 10),
    channelTitle: item.snippet?.title || "",
    channelThumb: item.snippet?.thumbnails?.default?.url,
    recentUploads: uploads,
    fetchedAt: Date.now(),
  };
  return cache;
}

/** Force-bust the cache (e.g. on manual refresh button). */
export function clearYouTubeCache(): void {
  cache = null;
}

/** "12,408" style formatting for the KPI tile. */
export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

/** "3d", "2w", "1mo" — relative age for upload timestamps. */
export function relativeAge(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const sec = Math.max(0, (Date.now() - then) / 1000);
  if (sec < 60) return `${Math.floor(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400 / 7)}w`;
  if (sec < 86400 * 365) return `${Math.floor(sec / 86400 / 30)}mo`;
  return `${Math.floor(sec / 86400 / 365)}y`;
}
