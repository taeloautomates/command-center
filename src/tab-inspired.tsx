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
import type { AppleNote } from "./data-sources/apple-notes";
import { showAppleNote, notesAge } from "./data-sources/apple-notes";
import type { InspiringStory } from "./data-sources/inspiring-stories";
import type { LanguagesOfTheDay, Phrase } from "./data-sources/languages";

/**
 * Speak a phrase via the browser's Web Speech API. Free, offline, built
 * into Electron — no external service or API key.
 *
 * macOS ships native voices for both fr-FR (Thomas, Audrey) and zh-CN
 * (Tingting, Sinji), so the result sounds reasonable out of the box.
 */
function speak(text: string, lang: "fr-FR" | "zh-CN") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Cancel any in-flight utterance so rapid clicks don't queue up.
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;    // slower for learners
  u.pitch = 1.0;
  // Prefer a native voice for the language if one is installed.
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === lang)
             || voices.find((v) => v.lang?.startsWith(lang.split("-")[0]));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

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
                {artwork.museum} · {artwork.date}
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
              {artwork.museum === "Met" ? "metmuseum.org" : "clevelandart.org"} ↗
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

function AppleNotesCard({ notes }: { notes: AppleNote[] }) {
  return (
    <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Row gap={8} align="center">
          <Label>Apple Notes</Label>
          {notes.length > 0 && <Dot />}
        </Row>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>
          {notes.length} recent
        </span>
      </Row>
      <Col gap={0} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {notes.length === 0 ? (
          <div style={{ padding: "10px 10px", fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.5 }}>
            No notes yet. macOS may need Automation permission for Obsidian → Notes (System Settings → Privacy & Security → Automation).
          </div>
        ) : (
          notes.map((n, i) => (
            <div
              key={n.id || i}
              onClick={() => showAppleNote(n.id)}
              style={{
                padding: "8px 0",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
              title="Open in Notes.app"
            >
              <Row gap={8} align="center" style={{ marginBottom: 3 }}>
                <span style={{
                  flex: 1, fontSize: 12, fontWeight: 500, letterSpacing: -0.005,
                  color: "rgba(255,255,255,0.92)",
                  textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                }}>{n.title}</span>
                <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", flexShrink: 0 }}>
                  {notesAge(n.ageMs)}
                </span>
              </Row>
              <Row gap={6} align="center">
                <span className="mono" style={{ fontSize: 9, letterSpacing: 0.08, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", flexShrink: 0 }}>
                  {n.folder}
                </span>
                {n.preview && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>·</span>
                    <span style={{
                      flex: 1, fontSize: 11, color: "rgba(255,255,255,0.58)",
                      textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                    }}>{n.preview}</span>
                  </>
                )}
              </Row>
            </div>
          ))
        )}
      </Col>
    </GlassCard>
  );
}

function InspiringStoryCard({ story }: { story: InspiringStory | null }) {
  if (!story) {
    return (
      <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Label>Story · today</Label>
        <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.42)" }}>
          Add stories to <span className="mono">command-center/inspiring-stories.md</span>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard style={{ padding: 18, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Label>Story · today</Label>
        <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: 0.04 }}>
          edit · inspiring-stories.md
        </span>
      </Row>

      {/* Subject + hook */}
      <Col gap={4} style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.96)", letterSpacing: -0.012, lineHeight: 1.25 }}>
          {story.subject}
        </span>
        {story.hook && (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.74)", letterSpacing: -0.005, lineHeight: 1.4, fontStyle: "italic" }}>
            {story.hook}
          </span>
        )}
        {(story.field || story.era) && (
          <Row gap={8} style={{ marginTop: 2 }}>
            {story.field && (
              <span className="mono" style={{ fontSize: 9, letterSpacing: 0.14, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", fontWeight: 600 }}>
                {story.field}
              </span>
            )}
            {story.field && story.era && (
              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>·</span>
            )}
            {story.era && (
              <span className="mono" style={{ fontSize: 9, letterSpacing: 0.14, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", fontWeight: 600 }}>
                {story.era}
              </span>
            )}
          </Row>
        )}
      </Col>

      {/* Body — scrollable so a longer story doesn't overflow the card */}
      <Col gap={8} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {story.body.map((p, i) => (
          <p key={i} style={{
            margin: 0, fontSize: 12, color: "rgba(255,255,255,0.86)",
            lineHeight: 1.55, letterSpacing: -0.003,
          }}>{p}</p>
        ))}
      </Col>

      {/* Lesson — pull-quote, serif italic */}
      {story.lesson && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          borderLeft: "2px solid rgba(255,255,255,0.32)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 12, fontStyle: "italic",
          color: "rgba(255,255,255,0.86)", lineHeight: 1.5,
        }}>
          {story.lesson}
        </div>
      )}
    </GlassCard>
  );
}

function SpeakerIcon({ size = 14, opacity = 0.62 }: { size?: number; opacity?: number }) {
  // Simple monochrome speaker glyph — matches the rest of the icon set.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity, color: "rgba(255,255,255,1)" }}>
      <path d="M3 6h2l3.5-3v10L5 10H3z" />
      <path d="M11 5.5c1 .8 1.5 1.8 1.5 2.5s-.5 1.7-1.5 2.5" />
      <path d="M13 3.5c2 1.2 3 3 3 4.5s-1 3.3-3 4.5" opacity={0.5} />
    </svg>
  );
}

/** A single clickable, speakable phrase row used inside LanguagesCard. */
function PhraseRow({
  phrase, lang, kind, large,
}: {
  phrase: Phrase | null;
  lang: "fr-FR" | "zh-CN";
  kind: "word" | "phrase";
  large?: boolean;            // word rows render their text bigger
}) {
  const [active, setActive] = React.useState(false);
  if (!phrase) return null;

  const onClick = () => {
    setActive(true);
    speak(phrase.text, lang);
    setTimeout(() => setActive(false), 1500);
  };

  // Chinese characters look better at higher size; pinyin sits inline.
  const textSize = large
    ? (lang === "zh-CN" ? 22 : 18)
    : (lang === "zh-CN" ? 16 : 14);

  return (
    <div
      onClick={onClick}
      title="Click to hear pronunciation"
      style={{
        padding: "6px 8px", marginLeft: -8, marginRight: -8, borderRadius: 6,
        cursor: "pointer",
        background: active ? "rgba(255,255,255,0.05)" : "transparent",
        transition: "background 200ms",
      }}
    >
      <Row gap={6} align="center" style={{ marginBottom: 2 }}>
        <span className="mono" style={{ fontSize: 8, letterSpacing: 0.14, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", fontWeight: 600 }}>
          {kind}
        </span>
        <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
        <SpeakerIcon size={11} opacity={active ? 1 : 0.38} />
      </Row>
      <Row gap={8} align="baseline" style={{ flexWrap: "wrap" }}>
        <span style={{ fontSize: textSize, fontWeight: 600, color: "rgba(255,255,255,0.96)", letterSpacing: lang === "zh-CN" ? 0.02 : -0.008, lineHeight: 1.2 }}>
          {phrase.text}
        </span>
        {phrase.pronunciation && (
          <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", letterSpacing: 0.02 }}>
            {phrase.pronunciation}
          </span>
        )}
      </Row>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", letterSpacing: -0.003, lineHeight: 1.4, marginTop: 2 }}>
        {phrase.meaning}
      </div>
      {phrase.note && (
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", fontStyle: "italic", marginTop: 1 }}>
          {phrase.note}
        </div>
      )}
    </div>
  );
}

function LanguagesCard({ languages }: { languages: LanguagesOfTheDay }) {
  const empty = !languages.frenchWord && !languages.frenchPhrase && !languages.chineseWord && !languages.chinesePhrase;
  return (
    <GlassCard style={{ padding: 14, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Label>Learn · today</Label>
        <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: 0.04 }}>
          tap to hear · languages.md
        </span>
      </Row>
      {empty ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 8 }}>
          Add phrases to <span className="mono">command-center/languages.md</span> under the
          <span className="mono"> ## French Words</span>, <span className="mono">## French Phrases</span>,
          <span className="mono"> ## Chinese Words</span>, <span className="mono">## Chinese Phrases</span> sections.
        </div>
      ) : (
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          display: "grid", gridTemplateColumns: "1fr", gap: 10,
        }}>
          {/* French block — heading + word + phrase */}
          <div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.62)", textTransform: "uppercase", fontWeight: 700 }}>
              Français
            </span>
            <Col gap={4} style={{ marginTop: 4 }}>
              <PhraseRow phrase={languages.frenchWord}   lang="fr-FR" kind="word"   large />
              <PhraseRow phrase={languages.frenchPhrase} lang="fr-FR" kind="phrase" />
            </Col>
          </div>
          {/* Chinese block */}
          <div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.62)", textTransform: "uppercase", fontWeight: 700 }}>
              中文
            </span>
            <Col gap={4} style={{ marginTop: 4 }}>
              <PhraseRow phrase={languages.chineseWord}   lang="zh-CN" kind="word"   large />
              <PhraseRow phrase={languages.chinesePhrase} lang="zh-CN" kind="phrase" />
            </Col>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function TabInspired({
  quotes, brainDump, onBrainDump, artwork, songs, bookmarks, appleNotes, story, languages,
}: {
  quotes: Quote[];
  brainDump: BrainDumpEntry[];
  onBrainDump: (text: string) => Promise<void>;
  artwork: Artwork | null;
  songs: Song[];
  bookmarks: Bookmark[];
  appleNotes: AppleNote[];
  story: InspiringStory | null;
  languages: LanguagesOfTheDay;
}) {
  const dailyQuote = React.useMemo(() => pickDailyQuote(quotes), [quotes]);
  const feed = React.useMemo(
    () => (dailyQuote ? quotes.filter((q) => q.text !== dailyQuote.text) : quotes),
    [quotes, dailyQuote],
  );
  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hero — Creative Spark (rotating museums) with daily quote */}
      <div style={{ flex: "0 0 260px", display: "flex" }}>
        <CreativeSparkHero artwork={artwork} quote={dailyQuote} />
      </div>
      {/* 2-col × 3-row grid:
            Row 1: Today in history    | Learn (FR + ZH)
            Row 2: Apple Notes         | Music
            Row 3: Bookmark Revival    | Brain Dump
       */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        gap: 12,
      }}>
        <InspiringStoryCard story={story} />
        <LanguagesCard languages={languages} />
        <AppleNotesCard notes={appleNotes} />
        <MusicCard songs={songs} />
        <BookmarkRevivalCard bookmarks={bookmarks} />
        <BrainDumpCard entries={brainDump} onSubmit={onBrainDump} />
      </div>
    </div>
  );
}
