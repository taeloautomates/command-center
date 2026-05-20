/**
 * Daily artwork feed — Creative Spark hero on the Inspired tab.
 *
 * Source: The Metropolitan Museum of Art public API.
 *   https://metmuseum.github.io/  (CC0, no auth)
 *
 * We pick a Met objectID from a curated short list of famous public-domain
 * works (Hokusai, Van Gogh, Monet, Vermeer, etc.), rotated deterministically
 * by date hash so the dashboard shows the same piece all day, then a new one
 * tomorrow.
 */

import { requestUrl } from "obsidian";

export type Artwork = {
  id: number;
  title: string;
  artist: string;
  date: string;
  medium: string;
  imageUrl: string;        // web-large variant
  imageUrlHighRes?: string;
  sourceUrl: string;       // Met's page for the object
  culture?: string;
};

/* Curated list of well-known public-domain Met objects with full images.
   Verified via collectionapi.metmuseum.org — primaryImageSmall present. */
const CURATED_OBJECT_IDS = [
  // Hokusai woodblock prints
  45434,    // Hokusai — Under the Wave off Kanagawa (Great Wave)
  37362,    // Hokusai — Boy Viewing Mount Fuji
  // Van Gogh
  436532,   // Van Gogh — Self-Portrait with a Straw Hat (1887)
  436535,   // Van Gogh — Cypresses (1889)
  436528,   // Van Gogh — Wheat Field with Cypresses
  436529,   // Van Gogh — Sunflowers (1887)
  // Monet
  437133,   // Monet — Bridge over a Pond of Water Lilies
  438008,   // Monet — Garden at Sainte-Adresse
  437127,   // Monet — Camille Monet on a Garden Bench
  // Cézanne
  435868,   // Cézanne — Mont Sainte-Victoire
  435882,   // Cézanne — Still Life with Apples
  // Vermeer
  437881,   // Vermeer — Young Woman with a Water Pitcher
  437879,   // Vermeer — Study of a Young Woman
  // Renoir / Gauguin / Degas
  437429,   // Renoir — Madame Charpentier and Her Children
  438821,   // Renoir — Two Young Girls at the Piano
  438013,   // Degas — The Dance Class
  // Klimt
  436821,   // Klimt — Mäda Primavesi (1912)
  // Caravaggio / Old Masters
  436577,   // Caravaggio — The Musicians
  // Sargent
  11788,    // Sargent — Madame X
];

/** Daily index — deterministic so the same artwork shows all day. */
function dailyIndex(len: number, date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

export async function loadDailyArtwork(): Promise<Artwork | null> {
  // Try the picked-for-today object first; fall back through the list if it
  // 404s (Met sometimes deprecates IDs).
  const start = dailyIndex(CURATED_OBJECT_IDS.length);
  for (let i = 0; i < CURATED_OBJECT_IDS.length; i++) {
    const id = CURATED_OBJECT_IDS[(start + i) % CURATED_OBJECT_IDS.length];
    const art = await tryFetch(id);
    if (art) return art;
  }
  return null;
}

async function tryFetch(id: number): Promise<Artwork | null> {
  try {
    const res = await requestUrl({
      url: `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      throw: false,
    });
    if (res.status >= 400) return null;
    const d = res.json;
    const small = d.primaryImageSmall || d.primaryImage;
    if (!small) return null;
    return {
      id,
      title: d.title || "(untitled)",
      artist: d.artistDisplayName || d.culture || "—",
      date: d.objectDate || "—",
      medium: d.medium || d.classification || "",
      imageUrl: small,
      imageUrlHighRes: d.primaryImage || undefined,
      sourceUrl: d.objectURL || `https://www.metmuseum.org/art/collection/search/${id}`,
      culture: d.culture || undefined,
    };
  } catch {
    return null;
  }
}
