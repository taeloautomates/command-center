/**
 * Daily artwork feed — Creative Spark hero on the Inspired tab.
 *
 * Three rotating sources, all auth-free public-domain APIs:
 *   • The Metropolitan Museum of Art (metmuseum.github.io, CC0)
 *   • The Art Institute of Chicago (api.artic.edu, CC0)
 *   • The Cleveland Museum of Art (openaccess-api.clevelandart.org, CC0)
 *
 * Each museum has a curated short list of famous works. The daily index
 * decides which museum AND which piece in one deterministic pass — same
 * piece all day, different piece tomorrow.
 *
 * If the picked source fails (network, deprecated ID, image missing), we
 * walk forward through the union until something works.
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
  museum: "Met" | "Art Institute of Chicago" | "Cleveland Museum of Art";
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

const ARTIC_IDS = [
  16568,    // Seurat — A Sunday on La Grande Jatte
  28560,    // Hopper — Nighthawks
  111628,   // Wood — American Gothic
  20684,    // Caillebotte — Paris Street; Rainy Day
  28067,    // Degas — The Millinery Shop
  16571,    // Renoir — Two Sisters (On the Terrace)
  102611,   // Hokusai — Under the Wave (Artic also has it)
  4884,     // O'Keeffe — Sky Above Clouds IV
  64818,    // Picasso — The Old Guitarist
  111456,   // Magritte — Time Transfixed
  37833,    // Toulouse-Lautrec — At the Moulin Rouge
  16487,    // Cassatt — The Child's Bath
];

// Cleveland Museum of Art works (Open Access, CC0). Numeric "accession_id" used as path.
const CMA_IDS = [
  151662,   // Caravaggio — The Crucifixion of Saint Andrew
  93897,    // Monet — Water Lilies (Agapanthus)
  92938,    // Picasso — La Vie
  94979,    // Turner — The Burning of the Houses of Lords and Commons
  92246,    // van Gogh — The Large Plane Trees (Road Menders at Saint-Rémy)
  149860,   // Hokusai — A Tour of the Waterfalls of the Provinces
  118454,   // Rodin — The Thinker
  100997,   // Magritte — The Treachery of Images (variant)
  133987,   // Klimt — drawings
  124190,   // Whistler — Nocturne in Black and Gold
];

/* ─── Daily picker ──────────────────────────────────────────────── */

type SourceKey = "met" | "artic" | "cma";

const SOURCES: { key: SourceKey; ids: number[] }[] = [
  { key: "met",   ids: MET_IDS },
  { key: "artic", ids: ARTIC_IDS },
  { key: "cma",   ids: CMA_IDS },
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
  if (key === "artic") return fetchArtic(id);
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

async function fetchArtic(id: number): Promise<Artwork | null> {
  try {
    const fields = [
      "id", "title", "artist_display", "date_display", "medium_display",
      "image_id", "is_public_domain", "place_of_origin",
    ].join(",");
    const res = await requestUrl({
      url: `https://api.artic.edu/api/v1/artworks/${id}?fields=${fields}`,
      throw: false,
    });
    if (res.status >= 400) return null;
    const d = res.json?.data;
    if (!d?.image_id || d.is_public_domain === false) return null;
    const img = `https://www.artic.edu/iiif/2/${d.image_id}/full/843,/0/default.jpg`;
    const hi = `https://www.artic.edu/iiif/2/${d.image_id}/full/1686,/0/default.jpg`;
    return {
      id: `artic-${id}`,
      title: d.title || "(untitled)",
      artist: d.artist_display || "—",
      date: d.date_display || "—",
      medium: d.medium_display || "",
      imageUrl: img,
      imageUrlHighRes: hi,
      sourceUrl: `https://www.artic.edu/artworks/${id}`,
      culture: d.place_of_origin || undefined,
      museum: "Art Institute of Chicago",
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
