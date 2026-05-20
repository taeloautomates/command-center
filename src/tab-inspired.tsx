import * as React from "react";
import { GlassCard, Row, Col, Label, Dot } from "./ui";
import type { Quote } from "./data-sources/quotes";
import { pickDailyQuote } from "./data-sources/quotes";
import { BrainDumpCard } from "./brain-dump";
import type { BrainDumpEntry } from "./persistence";
import type { Artwork } from "./data-sources/art";
import type { Song } from "./data-sources/music";
import { upscaleArtwork } from "./data-sources/music";
import type { Bookmark } from "./data-sources/bookmarks";
import { pickDailyBookmarks } from "./data-sources/bookmarks";

/* ── Hero: Creative Spark + Quote of the Day ─────────────────────
   The Inspired tab's centerpiece. Left half is a real artwork pulled from
   the Met Museum API. Right half is the daily quote + art metadata + a
   short observation. The combined hero replaces the previous separate
   HeroQuote and CreativeSpark cards. */

function CreativeSparkHero({ artwork, quote }: { artwork: Artwork | null; quote: Quote | null }) {
  return (
    <GlassCard style={{
      padding: 0, height: "100%",
      overflow: "hidden", display: "flex", flexDirection: "row",
    }} clickable>
      {/* Left half — artwork frame */}
      <div className="cc-art-frame">
        {artwork ? (
          <a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", height: "100%" }}>
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="cc-art-image"
              loading="lazy"
            />
            <div className="cc-art-caption">
              <span className="mono" style={{ fontSize: 9, letterSpacing: 0.16, textTransform: "uppercase", color: "rgba(255,255,255,0.62)" }}>
                Met · {artwork.date}
              </span>
            </div>
          </a>
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.32)", fontSize: 11,
            background: "rgba(255,255,255,0.02)",
          }}>
            Loading today's artwork…
          </div>
        )}
      </div>

      {/* Right half — quote + art meta + observation */}
      <div className="cc-art-side">
        <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Label>Creative Spark · today</Label>
          {artwork && (
            <a
              href={artwork.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mono"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", textDecoration: "none", letterSpacing: 0.04 }}
            >
              metmuseum.org ↗
            </a>
          )}
        </Row>

        {/* Quote of the day — italic serif, like a margin gloss */}
        {quote && (
          <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              fontSize: 18, fontWeight: 500, letterSpacing: -0.012, lineHeight: 1.3,
              color: "rgba(255,255,255,0.96)", textWrap: "balance",
              fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic",
              marginBottom: 8,
            }}>
              "{quote.text}"
            </div>
            <Row gap={8} align="center">
              <span style={{ width: 12, height: 1, background: "rgba(255,255,255,0.32)" }} />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.04, color: "rgba(255,255,255,0.78)" }}>
                {quote.author}
              </span>
              {quote.source && quote.source !== "—" && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>{quote.source}</span>
                </>
              )}
            </Row>
          </div>
        )}

        {/* Artwork meta */}
        {artwork && (
          <Col gap={4}>
            <span style={{
              fontSize: 18, fontWeight: 600, letterSpacing: -0.012, lineHeight: 1.2,
              color: "rgba(255,255,255,0.96)",
            }}>
              {artwork.title}
            </span>
            <Row gap={8} wrap-style="wrap" style={{ flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.62)" }}>{artwork.artist}</span>
              <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
              <span className="tabular" style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{artwork.date}</span>
              {artwork.medium && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontStyle: "italic" }}>{artwork.medium.slice(0, 64)}</span>
                </>
              )}
            </Row>
          </Col>
        )}
      </div>
    </GlassCard>
  );
}

function QuoteRow({ q }: { q: { text: string; author: string; source: string; tag: string } }) {
  return (
    <Col gap={6} style={{ padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{
        fontSize: 14, letterSpacing: -0.005, lineHeight: 1.45,
        color: "rgba(255,255,255,0.86)",
        fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic",
      }}>"{q.text}"</div>
      <Row gap={8} align="center">
        <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.62)", letterSpacing: 0.02 }}>{q.author}</span>
        <span style={{ color: "rgba(255,255,255,0.16)" }}>·</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>{q.source}</span>
        <span style={{ flex: 1 }} />
        {q.tag && (
          <span className="mono" style={{ fontSize: 9, letterSpacing: 0.12, textTransform: "uppercase", color: "rgba(255,255,255,0.32)", padding: "2px 6px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999 }}>{q.tag}</span>
        )}
      </Row>
    </Col>
  );
}

function QuotesFeedCard({ quotes }: { quotes: Quote[] }) {
  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Row gap={10}>
          <Label>Saved Highlights</Label>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>command-center/quotes.md</span>
        </Row>
        <Row gap={6}>
          <button className="pill ghost" style={{ padding: "3px 10px", fontSize: 10 }}>all</button>
          <button className="pill ghost" style={{ padding: "3px 10px", fontSize: 10 }}>books</button>
        </Row>
      </Row>
      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6 }}>
        <Col gap={0}>
          {quotes.length === 0 ? (
            <div style={{
              padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center", marginTop: 8,
            }}>
              No quotes yet. Edit <span className="mono">command-center/quotes.md</span> in the vault.
            </div>
          ) : (
            quotes.map((q, i) => <QuoteRow key={i} q={q} />)
          )}
        </Col>
      </div>
    </GlassCard>
  );
}

function MusicCard({ songs }: { songs: Song[] }) {
  return (
    <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Row gap={8}>
          <Label>Now Playing</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>iTunes · top US</span>
        </Row>
        <Row gap={6}>
          <Dot idle={songs.length === 0} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>live</span>
        </Row>
      </Row>
      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {songs.length === 0 ? (
          <div style={{
            padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>Loading top songs…</div>
        ) : (
          <Col gap={0}>
            {songs.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="song-row"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="mono tabular" style={{ width: 16, fontSize: 10, color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>
                  {String(s.rank).padStart(2, "0")}
                </span>
                <img
                  src={upscaleArtwork(s.artworkUrl, 80)}
                  alt=""
                  className="song-art"
                  loading="lazy"
                />
                <Col gap={1} style={{ flex: 1, minWidth: 0 }}>
                  <Row gap={6} align="center">
                    <span style={{
                      fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.92)",
                      letterSpacing: -0.005,
                      textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                    }}>{s.name}</span>
                    {s.explicit && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: 0.1,
                        color: "rgba(255,255,255,0.62)",
                        border: "1px solid rgba(255,255,255,0.18)", borderRadius: 2,
                        padding: "1px 3px", lineHeight: 1,
                      }}>E</span>
                    )}
                  </Row>
                  <Row gap={6} align="center">
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.62)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{s.artist}</span>
                    <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 9 }}>·</span>
                    <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", letterSpacing: 0.04, textTransform: "uppercase", flexShrink: 0 }}>{s.genre}</span>
                  </Row>
                </Col>
              </a>
            ))}
          </Col>
        )}
      </div>
    </GlassCard>
  );
}

function BookmarkRevivalCard({ bookmarks }: { bookmarks: Bookmark[] }) {
  const todays = React.useMemo(() => pickDailyBookmarks(bookmarks, 4), [bookmarks]);
  return (
    <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Row gap={8}>
          <Label>Revival</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>buried bookmarks</span>
        </Row>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{bookmarks.length} saved</span>
      </Row>
      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {todays.length === 0 ? (
          <div style={{
            padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>
            Paste links in <span className="mono">command-center/saved.md</span>
          </div>
        ) : (
          <Col gap={0}>
            {todays.map((b, i) => (
              <a
                key={i}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bookmark-row"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.86)", letterSpacing: -0.005, lineHeight: 1.35, display: "block", marginBottom: 3 }}>
                  {b.title}
                </span>
                <Row gap={6} align="center">
                  <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.42)", letterSpacing: 0.04, textTransform: "uppercase" }}>{b.source}</span>
                </Row>
              </a>
            ))}
          </Col>
        )}
      </div>
      <Row justify="space-between" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>rotates daily</span>
        <span className="tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>so nothing gets buried</span>
      </Row>
    </GlassCard>
  );
}

export function TabInspired({
  quotes, brainDump, onBrainDump, artwork, songs, bookmarks,
}: {
  quotes: Quote[];
  brainDump: BrainDumpEntry[];
  onBrainDump: (text: string) => Promise<void>;
  artwork: Artwork | null;
  songs: Song[];
  bookmarks: Bookmark[];
}) {
  const dailyQuote = React.useMemo(() => pickDailyQuote(quotes), [quotes]);
  const feed = React.useMemo(
    () => (dailyQuote ? quotes.filter((q) => q.text !== dailyQuote.text) : quotes),
    [quotes, dailyQuote],
  );
  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hero — Creative Spark with real art + quote */}
      <div style={{ flex: "0 0 320px", display: "flex" }}>
        <CreativeSparkHero artwork={artwork} quote={dailyQuote} />
      </div>
      {/* Row 2 — 2x2 grid: Saved Highlights | Music | Bookmark Revival | Brain Dump */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 12,
      }}>
        <QuotesFeedCard quotes={feed} />
        <MusicCard songs={songs} />
        <BookmarkRevivalCard bookmarks={bookmarks} />
        <BrainDumpCard entries={brainDump} onSubmit={onBrainDump} />
      </div>
    </div>
  );
}
