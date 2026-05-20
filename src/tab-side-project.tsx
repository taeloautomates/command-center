import * as React from "react";
import { GlassCard, Row, Col, Label, Check, Dot, ProgressBar } from "./ui";
import { YouTubeIcon } from "./icons";
import type { Todo } from "./types";
import type { TrendReport } from "./data-sources/trending";
import type { ManualState } from "./data-sources/manual";
import type { NewsItem } from "./data-sources/hn";
import { ageStr } from "./data-sources/hn";
import type { RedditPost } from "./data-sources/reddit";
import { ageStr as redditAge } from "./data-sources/reddit";
import type { Tweet } from "./data-sources/tweets";

function KPILine({ label, current, target }: { label: string; current: number; target: number }) {
  return (
    <Col gap={6}>
      <Row justify="space-between">
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{label}</span>
        <span className="mono tabular" style={{ fontSize: 12, color: "rgba(255,255,255,0.96)" }}>
          {current} <span style={{ color: "rgba(255,255,255,0.32)" }}>/ {target}</span>
        </span>
      </Row>
      <ProgressBar value={current} max={target} />
    </Col>
  );
}

function WeekStrip({ days }: { days: { label: string; filled: boolean }[] }) {
  return (
    <Row gap={6}>
      {days.map((d, i) => (
        <Col key={i} gap={6} style={{ alignItems: "center", flex: 1 }}>
          <div style={{
            width: "100%", aspectRatio: "1 / 1", borderRadius: 4,
            background: d.filled ? "rgba(255,255,255,0.86)" : "transparent",
            border: "1px solid rgba(255,255,255," + (d.filled ? 0 : 0.12) + ")",
          }} />
          <span style={{ fontSize: 9, letterSpacing: 0.12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>{d.label}</span>
        </Col>
      ))}
    </Row>
  );
}

function YouTubeCard({ manual }: { manual: ManualState }) {
  const days = [
    { label: "M", filled: true }, { label: "T", filled: false }, { label: "W", filled: true },
    { label: "T", filled: false }, { label: "F", filled: false }, { label: "S", filled: false },
    { label: "S", filled: false },
  ];
  const y = manual.youtube;
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8}>
          <YouTubeIcon size={12} opacity={0.5} />
          <Label>YouTube Ops</Label>
        </Row>
        <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{y.handle}</span>
      </Row>
      <div style={{ marginBottom: 18 }}><WeekStrip days={days} /></div>
      <Col gap={12}>
        <KPILine label="Scripts drafted" current={y.scriptsDrafted} target={y.scriptsTarget} />
        <KPILine label="Videos shot"     current={y.videosShot}     target={y.videosTarget} />
        <KPILine label="Videos shipped"  current={y.videosShipped}  target={y.videosShippedTarget} />
      </Col>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row justify="space-between" align="center">
          <Col gap={2}>
            <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>next upload</span>
            <span style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.64)", letterSpacing: -0.005 }}>
              "{y.nextUpload.title}"
            </span>
          </Col>
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{y.nextUpload.when}</span>
        </Row>
      </div>
    </GlassCard>
  );
}

function SaaSCard({ todos, toggleTodo }: { todos: Todo[]; toggleTodo: (id: string) => void }) {
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>Build</Label>
        <Row gap={6}>
          <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>vault-cli</span>
          <span style={{ color: "rgba(255,255,255,0.16)" }}>·</span>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>v0.4.2</span>
        </Row>
      </Row>
      <Col gap={9} style={{ marginBottom: 14 }}>
        {todos.map((t, i) => {
          const firstUndone = todos.findIndex((x) => !x.done);
          const isActive = !t.done && i === firstUndone;
          return (
            <Row key={t.id} gap={10} align="center">
              <Check on={t.done} onClick={() => toggleTodo(t.id)} />
              <span style={{
                fontSize: 13,
                color: t.done ? "rgba(255,255,255,0.38)" : isActive ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.74)",
                textDecoration: t.done ? "line-through" : "none",
                textDecorationColor: "rgba(255,255,255,0.24)",
                letterSpacing: -0.005, flex: 1,
              }}>{t.text}</span>
              {t.tag && (
                <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: 0.04 }}>{t.tag}</span>
              )}
            </Row>
          );
        })}
        {todos.length === 0 && (
          <div style={{
            padding: "10px 10px", border: "1px dashed rgba(255,255,255,0.06)",
            borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.28)", textAlign: "center",
          }}>No todos. Edit <span className="mono">command-center/todos/side-project.md</span></div>
        )}
      </Col>
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
            {todos.filter((t) => t.done).length} of {todos.length} done
          </span>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.96)" }}>
            {todos.length === 0 ? "0%" : Math.round((todos.filter((t) => t.done).length / todos.length) * 100) + "%"}
          </span>
        </Row>
        <ProgressBar value={todos.filter((t) => t.done).length} max={Math.max(todos.length, 1)} />
      </div>
    </GlassCard>
  );
}

function TodayCard() {
  const start = 6 * 60;
  const end = 22 * 60;
  const span = end - start;
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = ((nowMin - start) / span) * 100;

  const rawBlocks = [
    { title: "Standup",                  s: 9 * 60 + 15, e: 9 * 60 + 30 },
    { title: "Deep work — sprint",       s: 9 * 60 + 30, e: 11 * 60 + 30 },
    { title: "1:1 w/ Priya",             s: 11 * 60 + 30, e: 12 * 60 },
    { title: "Lunch",                    s: 12 * 60,      e: 12 * 60 + 45 },
    { title: "Edit /watch tutorial",     s: 13 * 60,      e: 14 * 60 + 30 },
    { title: "Design review",            s: 15 * 60,      e: 16 * 60 },
    { title: "Reply pass — comments",    s: 16 * 60 + 30, e: 17 * 60 + 15 },
    { title: "Dinner w/ J",              s: 19 * 60 + 30, e: 21 * 60 },
  ];
  const blocks = rawBlocks.map((b) => ({
    ...b,
    kind: nowMin >= b.e ? "past" : nowMin >= b.s ? "now" : "later",
  }));

  const toPct = (m: number) => ((m - start) / span) * 100;
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const dow = ["SUN","MON","TUE","WED","THU","FRI","SAT"][now.getDay()];
  const month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][now.getMonth()];

  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>Today</Label>
        <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{dow} · {month} {now.getDate()}</span>
      </Row>

      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", gap: 14 }}>
        <Col gap={0} style={{ width: 32, position: "relative" }}>
          {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
            <div key={h} style={{
              position: "absolute",
              top: ((h * 60 - start) / span) * 100 + "%",
              transform: "translateY(-50%)",
              fontSize: 9, color: "rgba(255,255,255,0.32)",
              fontVariantNumeric: "tabular-nums", letterSpacing: 0.04,
            }}>{String(h).padStart(2, "0")}:00</div>
          ))}
        </Col>

        <div style={{ position: "relative", flex: 1, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
            <div key={h} style={{
              position: "absolute", left: 0, right: 0,
              top: ((h * 60 - start) / span) * 100 + "%",
              borderTop: "1px dashed rgba(255,255,255,0.04)",
            }} />
          ))}
          <div style={{
            position: "absolute", left: -4, right: 0, top: nowPct + "%",
            height: 1, background: "rgba(255,255,255,0.86)",
            boxShadow: "0 0 8px rgba(255,255,255,0.35)", zIndex: 3,
          }}>
            <span style={{
              position: "absolute", left: -36, top: -7,
              fontSize: 9, letterSpacing: 0.12, textTransform: "uppercase",
              fontWeight: 600, color: "rgba(255,255,255,0.92)",
            }} className="tabular">now</span>
          </div>
          {blocks.map((b, i) => {
            const top = toPct(b.s);
            const height = toPct(b.e) - toPct(b.s);
            const opacity = b.kind === "now" ? 0.96 : b.kind === "later" ? 0.62 : 0.32;
            const bg = b.kind === "now" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
            return (
              <div key={i} style={{
                position: "absolute", left: 8, right: 6,
                top: top + "%", height: height + "%",
                minHeight: 30, overflow: "hidden",
                background: bg,
                border: "1px solid rgba(255,255,255," + (b.kind === "now" ? 0.16 : 0.06) + ")",
                borderRadius: 6, padding: "5px 8px",
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 1,
                boxShadow: b.kind === "now" ? "inset 0 1px 0 rgba(255,255,255,0.18)" : "none",
                zIndex: b.kind === "now" ? 2 : 1,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: -0.005,
                  color: `rgba(255,255,255,${opacity})`,
                  textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                }}>{b.title}</span>
                <span className="mono tabular" style={{ fontSize: 9, color: `rgba(255,255,255,${opacity * 0.55})` }}>
                  {fmt(b.s)} – {fmt(b.e)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

function CurrentEventsCard({ news }: { news: NewsItem[] }) {
  const aiCount = news.filter((n) => n.aiTagged).length;
  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8}>
          <Label>Current Events</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>HN · last 24h</span>
          {aiCount > 0 && (
            <>
              <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
              <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.62)", textTransform: "uppercase", fontWeight: 500 }}>{aiCount} AI</span>
            </>
          )}
        </Row>
        <Row gap={6}>
          <Dot idle={news.length === 0} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>live</span>
        </Row>
      </Row>
      <Col gap={0} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="scroll">
        {news.length === 0 && (
          <div style={{
            padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>
            Loading from Hacker News…
          </div>
        )}
        {news.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-row"
            style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
          >
            <span className="mono tabular" style={{ width: 14, fontSize: 11, color: n.aiTagged ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.32)", flexShrink: 0 }}>
              {n.aiTagged ? "★" : String(n.rank).padStart(2, "0")}
            </span>
            <span style={{
              flex: 1, fontSize: 13, color: "rgba(255,255,255,0.86)",
              letterSpacing: -0.005, lineHeight: 1.3,
              textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
            }}>{n.title}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", flexShrink: 0 }}>
              {n.source} <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>{" "}
              <span className="tabular">{n.points}↑</span> <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>{" "}
              <span className="tabular">{ageStr(n.ageMs)}</span>
            </span>
          </a>
        ))}
      </Col>
      <Row justify="space-between" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>★ = AI tagged</span>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>refresh · 60s</span>
      </Row>
    </GlassCard>
  );
}

function TweetsCard({ tweets }: { tweets: Tweet[] }) {
  return (
    <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Row gap={8}>
          <Label>Tweets</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>curated</span>
        </Row>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{tweets.length}</span>
      </Row>
      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {tweets.length === 0 ? (
          <div style={{
            padding: "10px 8px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 6, fontSize: 10, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>
            Paste tweets in <span className="mono">command-center/tweets.md</span>
          </div>
        ) : (
          <Col gap={0}>
            {tweets.slice(0, 6).map((t, i) => (
              <a
                key={i}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tweet-row"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="tweet-text">{t.text}</span>
                <Row gap={6} align="center" style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.78)", letterSpacing: 0.02 }}>{t.author}</span>
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                  <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{t.age}</span>
                </Row>
              </a>
            ))}
          </Col>
        )}
      </div>
    </GlassCard>
  );
}

function RedditCard({ posts }: { posts: RedditPost[] }) {
  return (
    <GlassCard style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Row gap={8}>
          <Label>Reddit</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>top today</span>
        </Row>
        <Row gap={6}>
          <Dot idle={posts.length === 0} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>live</span>
        </Row>
      </Row>
      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
        {posts.length === 0 ? (
          <div style={{
            padding: "10px 8px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 6, fontSize: 10, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>Loading…</div>
        ) : (
          <Col gap={0}>
            {posts.map((p, i) => (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reddit-row"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
              >
                <Row gap={8} align="center" style={{ marginBottom: 2 }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: 0.02, color: "rgba(255,255,255,0.62)" }}>r/{p.subreddit}</span>
                  <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 9 }}>·</span>
                  <span className="mono tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>{p.score}↑</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>{redditAge(p.ageMs)}</span>
                </Row>
                <span className="reddit-title">{p.title}</span>
              </a>
            ))}
          </Col>
        )}
      </div>
    </GlassCard>
  );
}

function TrendCard({ trending }: { trending: TrendReport | null }) {
  const items = trending?.items ?? [];
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8}>
          <Label>Trending</Label>
          <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>trendscout · {trending?.reportDate ?? "—"}</span>
        </Row>
        <Row gap={6}>
          <Dot idle />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>filesystem</span>
        </Row>
      </Row>
      <Col gap={0}>
        {items.length === 0 && (
          <div style={{
            padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center",
          }}>No /trendscout report found. Run <span className="mono">/trendscout</span> in Content engine first.</div>
        )}
        {items.map((it, i) => (
          <Row key={i} gap={12} align="center" style={{
            padding: "10px 0",
            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}>
            <span className="mono tabular" style={{ width: 14, fontSize: 11, color: it.pickOfTheWeek ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.32)", flexShrink: 0 }}>
              {it.pickOfTheWeek ? "★" : String(it.rank).padStart(2, "0")}
            </span>
            <span style={{
              flex: 1, fontSize: 13, color: "rgba(255,255,255,0.86)",
              letterSpacing: -0.005, lineHeight: 1.3,
              textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
            }}>{it.title}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", flexShrink: 0 }}>
              {it.source} <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span> <span className="tabular">{it.age}</span>
            </span>
          </Row>
        ))}
      </Col>
      <Row justify="space-between" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>pulled {trending?.pulledAgo ?? "—"} ago</span>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>refresh · 60s</span>
      </Row>
    </GlassCard>
  );
}

export function TabSideProject({
  todos, toggleTodo, trending, manual, news, reddit, tweets,
}: {
  todos: Todo[];
  toggleTodo: (id: string) => void;
  trending: TrendReport | null;
  manual: ManualState;
  news: NewsItem[];
  reddit: RedditPost[];
  tweets: Tweet[];
}) {
  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Col gap={12} style={{ minHeight: 0 }}>
        <YouTubeCard manual={manual} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <SaaSCard todos={todos} toggleTodo={toggleTodo} />
        </div>
      </Col>
      <Col gap={12} style={{ minHeight: 0 }}>
        <div style={{ flex: 1.1, minHeight: 0, display: "flex" }}>
          <CurrentEventsCard news={news} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <TweetsCard tweets={tweets} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <RedditCard posts={reddit} />
        </div>
      </Col>
    </div>
  );
}

// TrendCard remains in code for the future "Content Box" surface (per the brief).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _unusedTrendCardKeeperForLater(trending: TrendReport | null) {
  return TrendCard({ trending });
}
