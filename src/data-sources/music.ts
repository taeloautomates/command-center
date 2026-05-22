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

// Apple migrated the host from rss.applemarketingtools.com → rss.marketingtools.apple.com.
// The old host still 301-redirects today but will eventually drop. Use the new host directly.
// We pull the top 100 (not 20) so a single album drop can't monopolize the card after dedupe.
const FEED_URL = "https://rss.marketingtools.apple.com/api/v2/us/music/most-played/100/songs.json";

const MAX_PER_ARTIST = 2;

/** Extract the lead artist so collabs ("Drake & X", "Drake, Y & Z") count toward Drake's cap. */
function primaryArtist(name: string): string {
  if (!name) return "";
  // Split on the first separator — "&", ",", "feat.", "ft.", "with".
  const m = name.split(/\s*(?:&|,|feat\.?|ft\.?|with)\s+/i)[0];
  return m.trim().toLowerCase();
}

export async function loadTopSongs(limit = 8): Promise<Song[]> {
  try {
    const res = await requestUrl({ url: FEED_URL, throw: false });
    if (res.status >= 400) return [];
    const results = res.json?.feed?.results ?? [];

    // Dedupe by lead artist so one album drop (Drake at 30/100 right now) can't take over.
    const perArtist = new Map<string, number>();
    const picked: Song[] = [];
    for (let i = 0; i < results.length && picked.length < limit; i++) {
      const r = results[i];
      const key = primaryArtist(r.artistName || "");
      const count = perArtist.get(key) ?? 0;
      if (count >= MAX_PER_ARTIST) continue;
      perArtist.set(key, count + 1);
      picked.push({
        rank: picked.length + 1,
        name: r.name || "(untitled)",
        artist: r.artistName || "—",
        artistUrl: r.artistUrl,
        genre: r.genres?.[0]?.name || "Music",
        releaseDate: r.releaseDate || "",
        artworkUrl: r.artworkUrl100 || "",
        url: r.url || "#",
        explicit: r.contentAdvisoryRating === "Explict" || r.contentAdvisoryRating === "Explicit",
      });
    }
    return picked;
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
