/**
 * Daily artwork feed — Creative Spark hero on the Inspired tab.
 *
 * Two rotating sources, both auth-free public-domain APIs with hotlinkable
 * images (verified working from Electron renderer):
 *   • The Metropolitan Museum of Art (metmuseum.github.io, CC0)
 *   • The Cleveland Museum of Art (openaccess-api.clevelandart.org, CC0)
 *
 * (Art Institute of Chicago has a great open API but their IIIF image
 *  endpoint sits behind Cloudflare's bot protection and returns 403 to
 *  hotlinks from non-browser clients. Skipped until they whitelist
 *  direct embeds.)
 *
 * Each museum has a curated short list of famous works. The daily hash
 * picks one piece across the unioned pool — same piece all day, different
 * piece tomorrow. Falls forward if any single piece's API/image fails.
 */

import { requestUrl } from "obsidian";

export type Artwork = {
  id: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  imageUrl: string;
  imageUrlHighRes?: string;
  sourceUrl: string;
  culture?: string;
  museum: "Met" | "Cleveland Museum of Art";
};

/* ─── Curated pools ─────────────────────────────────────────────── */

const MET_IDS = [
  // Hokusai
  45434,    // Under the Wave off Kanagawa (Great Wave)
  37362,    // Boy Viewing Mount Fuji
  // Van Gogh
  436532,   // Self-Portrait with a Straw Hat (1887)
  436535,   // Cypresses (1889)
  436528,   // Wheat Field with Cypresses
  436529,   // Sunflowers (1887)
  // Monet
  437133,   // Bridge over a Pond of Water Lilies
  438008,   // Garden at Sainte-Adresse
  437127,   // Camille Monet on a Garden Bench
  // Cézanne
  435868, 435882,
  // Vermeer
  437881, 437879,
  // Renoir / Degas
  437429, 438821, 438013,
  // Klimt
  436821,
  // Caravaggio
  436577,
  // Sargent
  11788,    // Madame X
];

// Cleveland Museum of Art works (Open Access, CC0). All IDs verified via
// the search API; images served by openaccess-cdn.clevelandart.org hotlink
// fine into Obsidian.
const CMA_IDS = [
  135382,   // Monet — The Red Kerchief
  136510,   // Monet — Water Lilies (Agapanthus)
  95272,    // Monet — Gardener's House at Antibes
  125249,   // Van Gogh — The Large Plane Trees (Road Menders at Saint-Rémy)
  135299,   // Van Gogh — Adeline Ravoux
  111385,   // Picasso — The Frugal Meal
  98627,    // Rodin — The Age of Bronze
  122351,   // Turner — The Burning of the Houses of Lords and Commons
  131338,   // Turner — Flüelen, from the Lake of Lucerne
  111654,   // Hokusai — South Wind, Clear Sky (Red Fuji)
  146909,   // Klimt — Hermine Gallia
  121188,   // Renoir — Romaine Lacaux
  101646,   // Cassatt — After the Bath
  121035,   // Cassatt — In the Omnibus
];

/* ─── Daily picker ──────────────────────────────────────────────── */

type SourceKey = "met" | "cma";

const SOURCES: { key: SourceKey; ids: number[] }[] = [
  { key: "met", ids: MET_IDS },
  { key: "cma", ids: CMA_IDS },
];

const TOTAL_POOL = SOURCES.reduce((n, s) => n + s.ids.length, 0);

function dailyHash(date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Returns a list of (source, id) pairs starting from today's pick. */
function rotationOrder(): { key: SourceKey; id: number }[] {
  const flat: { key: SourceKey; id: number }[] = [];
  for (const s of SOURCES) for (const id of s.ids) flat.push({ key: s.key, id });
  const start = dailyHash() % flat.length;
  return [...flat.slice(start), ...flat.slice(0, start)];
}

export async function loadDailyArtwork(): Promise<Artwork | null> {
  const order = rotationOrder();
  for (const entry of order) {
    const art = await fetchOne(entry.key, entry.id);
    if (art) return art;
  }
  return null;
}

async function fetchOne(key: SourceKey, id: number): Promise<Artwork | null> {
  if (key === "met") return fetchMet(id);
  if (key === "cma") return fetchCMA(id);
  return null;
}

/* ─── Per-source fetchers ───────────────────────────────────────── */

async function fetchMet(id: number): Promise<Artwork | null> {
  try {
    const res = await requestUrl({
      url: `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      throw: false,
    });
    if (res.status >= 400) return null;
    const d = res.json;
    const img = d.primaryImageSmall || d.primaryImage;
    if (!img) return null;
    return {
      id: `met-${id}`,
      title: d.title || "(untitled)",
      artist: d.artistDisplayName || d.culture || "—",
      date: d.objectDate || "—",
      medium: d.medium || d.classification || "",
      imageUrl: img,
      imageUrlHighRes: d.primaryImage || undefined,
      sourceUrl: d.objectURL || `https://www.metmuseum.org/art/collection/search/${id}`,
      culture: d.culture || undefined,
      museum: "Met",
    };
  } catch { return null; }
}

async function fetchCMA(id: number): Promise<Artwork | null> {
  try {
    const res = await requestUrl({
      url: `https://openaccess-api.clevelandart.org/api/artworks/${id}`,
      throw: false,
    });
    if (res.status >= 400) return null;
    const d = res.json?.data;
    if (!d) return null;
    // CMA returns images at d.images.web.url / .print.url / .full.url.
    const img = d.images?.web?.url || d.images?.print?.url || d.images?.full?.url;
    if (!img) return null;
    const hi = d.images?.print?.url || d.images?.full?.url || img;
    return {
      id: `cma-${id}`,
      title: d.title || "(untitled)",
      artist: d.creators?.[0]?.description || d.culture?.[0] || "—",
      date: d.creation_date || "—",
      medium: d.technique || d.type || "",
      imageUrl: img,
      imageUrlHighRes: hi,
      sourceUrl: d.url || `https://www.clevelandart.org/art/${id}`,
      culture: d.culture?.[0] || undefined,
      museum: "Cleveland Museum of Art",
    };
  } catch { return null; }
}
