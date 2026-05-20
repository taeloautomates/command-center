/**
 * iTunes RSS music feed — top songs in the US.
 *
 * Source: rss.applemarketingtools.com (public, no auth, official Apple).
 * Returns name, artist, genre, release date, artwork, and Apple Music URL.
 *
 * Used on the Inspired tab as a "what's hot" feed.
 */

import { requestUrl } from "obsidian";

export type Song = {
  rank: number;
  name: string;
  artist: string;
  artistUrl?: string;
  genre: string;
  releaseDate: string;       // YYYY-MM-DD
  artworkUrl: string;        // 100x100 thumbnail
  url: string;               // Apple Music URL for the song
  explicit?: boolean;
};

const FEED_URL = "https://rss.applemarketingtools.com/api/v2/us/music/most-played/20/songs.json";

export async function loadTopSongs(limit = 8): Promise<Song[]> {
  try {
    const res = await requestUrl({ url: FEED_URL, throw: false });
    if (res.status >= 400) return [];
    const results = res.json?.feed?.results ?? [];
    return results.slice(0, limit).map((r: any, i: number): Song => ({
      rank: i + 1,
      name: r.name || "(untitled)",
      artist: r.artistName || "—",
      artistUrl: r.artistUrl,
      genre: r.genres?.[0]?.name || "Music",
      releaseDate: r.releaseDate || "",
      artworkUrl: r.artworkUrl100 || "",
      url: r.url || "#",
      explicit: r.contentAdvisoryRating === "Explict" || r.contentAdvisoryRating === "Explicit",
    }));
  } catch {
    return [];
  }
}

/** Bump the artwork URL from 100x100 to a higher resolution. */
export function upscaleArtwork(url: string, size = 200): string {
  if (!url) return url;
  return url.replace(/\/\d+x\d+bb\.jpg$/, `/${size}x${size}bb.jpg`);
}

/** "5/15" style relative release date. */
export function fmtReleaseDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}
