import * as React from "react";
import { GlassCard, Row, Col, Label, ProgressBar } from "./ui";
import { YouTubeIcon, IGIcon, TTIcon, LIIcon } from "./icons";
import type { ManualState } from "./data-sources/manual";
import { type YouTubeStats, fmtCount, relativeAge } from "./data-sources/youtube";

function KPITile({ platform, value, label, delta, positive, icon, live }: {
  platform: string; value: string; label: string; delta: string; positive: boolean; icon: React.ReactNode; live?: boolean;
}) {
  return (
    <GlassCard style={{ padding: 18, flex: 1 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Row gap={8} align="center">
          {icon}
          <Label>{platform}</Label>
          {live && (
            <span title="Live from YouTube Data API" style={{
              width: 6, height: 6, borderRadius: 50,
              background: "rgba(155,210,150,0.86)",
              boxShadow: "0 0 6px rgba(155,210,150,0.5)",
            }} />
          )}
        </Row>
        <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", fontWeight: 500 }}>{label}</span>
      </Row>
      <div className="tabular" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.025, lineHeight: 1.1, color: "rgba(255,255,255,0.96)", marginBottom: 8 }}>{value}</div>
      <Row gap={6} align="center">
        <span style={{ fontSize: 11, fontWeight: 500, color: positive ? "rgba(255,255,255,0.64)" : "rgba(255,255,255,0.38)" }} className="tabular">{delta}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>· {live ? "lifetime" : "7d"}</span>
      </Row>
    </GlassCard>
  );
}

function LatestUploads({ yt }: { yt: YouTubeStats }) {
  const items = yt.recentUploads.slice(0, 5);
  if (items.length === 0) {
    return (
      <GlassCard style={{ padding: 20 }}>
        <Label>Latest uploads</Label>
        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.42)" }}>No uploads yet.</div>
      </GlassCard>
    );
  }
  return (
    <GlassCard style={{ padding: 20, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8} align="center">
          <YouTubeIcon size={12} opacity={0.6} />
          <Label>Latest uploads</Label>
          <span title="Live from YouTube Data API" style={{
            width: 6, height: 6, borderRadius: 50,
            background: "rgba(155,210,150,0.86)",
            boxShadow: "0 0 6px rgba(155,210,150,0.5)",
          }} />
        </Row>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
          {fmtCount(yt.totalVideos)} <span style={{ color: "rgba(255,255,255,0.32)" }}>uploads · {fmtCount(yt.totalViews)} views</span>
        </span>
      </Row>
      <Col gap={0} style={{ flex: 1 }}>
        {items.map((u, i) => (
          <a key={u.videoId} href={u.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Row gap={12} align="center" style={{
              padding: "10px 0",
              borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
            }}>
              {u.thumbnail && (
                <img src={u.thumbnail} alt="" style={{ width: 56, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
              )}
              <span style={{
                flex: 1, fontSize: 12, letterSpacing: -0.005,
                color: "rgba(255,255,255,0.92)",
                textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
              }}>{u.title}</span>
              <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", minWidth: 60, textAlign: "right" }}>
                {u.views !== undefined ? fmtCount(u.views) : "—"}
              </span>
              <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", minWidth: 30, textAlign: "right" }}>
                {relativeAge(u.publishedAt)}
              </span>
            </Row>
          </a>
        ))}
      </Col>
    </GlassCard>
  );
}

function CadenceGrid() {
  const platforms = [
    { key: "YT", icon: <YouTubeIcon size={12} opacity={0.6} />, days: [1, 0, 1, 0, 0, 0, 0] },
    { key: "IG", icon: <IGIcon      size={12} opacity={0.6} />, days: [1, 1, 1, 1, 0, 1, 0] },
    { key: "TT", icon: <TTIcon      size={12} opacity={0.6} />, days: [1, 0, 1, 0, 1, 0, 0] },
    { key: "LI", icon: <LIIcon      size={12} opacity={0.6} />, days: [1, 1, 0, 1, 1, 0, 0] },
  ];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const today = 4;
  const hits = platforms.reduce((acc, p) => acc + p.days.filter(Boolean).length, 0);
  const target = 4 * 7;

  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Label>Posting cadence · this week</Label>
        <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
          {hits} <span style={{ color: "rgba(255,255,255,0.32)" }}>/ {target} posts</span>
        </span>
      </Row>
      <div style={{ display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)", gap: 6, alignItems: "center" }}>
        <div />
        {dayLabels.map((d, i) => (
          <div key={i} style={{
            fontSize: 9, letterSpacing: 0.12, textTransform: "uppercase", fontWeight: 500,
            color: i === today ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.32)", textAlign: "center",
          }}>{d}</div>
        ))}
        {platforms.map((p) => (
          <React.Fragment key={p.key}>
            <Row gap={6} style={{ paddingRight: 8 }}>{p.icon}<span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)" }}>{p.key}</span></Row>
            {p.days.map((on, i) => (
              <div key={i} style={{
                aspectRatio: "1 / 1", borderRadius: 4,
                background: on ? "rgba(255,255,255,0.86)" : "transparent",
                border: "1px solid rgba(255,255,255," + (on ? 0 : 0.10) + ")",
                outline: i === today ? "1px solid rgba(255,255,255,0.28)" : "none",
                outlineOffset: 1,
              }} />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>4 of 7 days hit target</span>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.96)" }}>57%</span>
        </Row>
        <ProgressBar value={4} max={7} />
      </div>
    </GlassCard>
  );
}

function RepliesQueue() {
  const replies = [
    { platform: "YT", icon: <YouTubeIcon size={11} opacity={0.62} />, handle: "@mira.codes",      text: "The part about scoped tools at 4:12 — is that in the SDK?", age: "14m", active: true },
    { platform: "IG", icon: <IGIcon      size={11} opacity={0.62} />, handle: "@jenny.builds",    text: "Wait, you're using the same setup I am — did you fix the latency issue?", age: "42m" },
    { platform: "LI", icon: <LIIcon      size={11} opacity={0.62} />, handle: "rohan kapoor",     text: "Would love to see a follow-up on the cost analysis.", age: "1h" },
    { platform: "TT", icon: <TTIcon      size={11} opacity={0.62} />, handle: "@buildwithk",      text: "POV: this is the actual workflow I've been searching for", age: "2h" },
    { platform: "YT", icon: <YouTubeIcon size={11} opacity={0.62} />, handle: "@deepak.s",        text: "Drop the dotfiles?? Begging.", age: "3h" },
    { platform: "IG", icon: <IGIcon      size={11} opacity={0.62} />, handle: "@alex.afterhours", text: "the obsidian-as-IDE thing is actually wild, send a guide", age: "5h" },
  ];

  return (
    <GlassCard style={{ padding: 20, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>Replies queue</Label>
        <Row gap={8}>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{replies.length} waiting</span>
          <button className="pill ghost" style={{ padding: "3px 10px", fontSize: 10 }}>clear oldest</button>
        </Row>
      </Row>
      <Col gap={0} style={{ flex: 1 }}>
        {replies.map((r, i) => (
          <Row key={i} gap={12} align="center" style={{
            padding: "10px 0",
            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
            opacity: r.active ? 1 : 0.78,
          }}>
            {r.icon}
            <span style={{
              fontSize: 12, color: "rgba(255,255,255,0.62)",
              minWidth: 110, maxWidth: 110,
              textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
            }}>{r.handle}</span>
            <span style={{
              flex: 1, fontSize: 12, letterSpacing: -0.005,
              color: r.active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.74)",
              textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
            }}>{r.text}</span>
            <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{r.age}</span>
          </Row>
        ))}
      </Col>
    </GlassCard>
  );
}

function SocialLifeStrip() {
  return (
    <GlassCard soft style={{ height: 80, padding: "16px 24px", display: "flex", alignItems: "center" }}>
      <Row gap={48} style={{ width: "100%" }}>
        <Col gap={3}>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", fontWeight: 500 }}>Social Life</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005 }}>
            Next: dinner w/ J <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span> Fri 19:30
          </span>
        </Col>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.05)" }} />
        <Col gap={3}>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", fontWeight: 500 }}>Check-ins overdue</span>
          <Row gap={8} align="center">
            <span className="tabular" style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005 }}>3 friends overdue for a check-in</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.32)" }}>→</span>
          </Row>
        </Col>
        <div style={{ flex: 1 }} />
        <Col gap={3} style={{ alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, letterSpacing: 0.14, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", fontWeight: 500 }}>This isn't a metric</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontStyle: "italic", letterSpacing: -0.005 }}>be a friend, not an operator.</span>
        </Col>
      </Row>
    </GlassCard>
  );
}

export function TabSocial({ manual, youtube }: { manual: ManualState; youtube: YouTubeStats | null }) {
  const s = manual.social;

  // YouTube tile flips to live data when the API key is set and the call succeeded.
  // The other three platforms stay manual (IG/TT/LI public APIs are paid or blocked).
  const ytTile = youtube
    ? { value: fmtCount(youtube.subs), delta: `${fmtCount(youtube.totalVideos)} videos`, positive: true, live: true as const }
    : { value: s.youtube.value, delta: s.youtube.delta, positive: s.youtube.positive, live: false as const };

  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <Row gap={12} align="stretch">
        <KPITile platform="YouTube"   label="subs"      value={ytTile.value}      delta={ytTile.delta}      positive={ytTile.positive}      live={ytTile.live} icon={<YouTubeIcon size={12} opacity={0.6} />} />
        <KPITile platform="Instagram" label="followers" value={s.instagram.value} delta={s.instagram.delta} positive={s.instagram.positive} icon={<IGIcon size={12} opacity={0.6} />} />
        <KPITile platform="TikTok"    label="followers" value={s.tiktok.value}    delta={s.tiktok.delta}    positive={s.tiktok.positive}    icon={<TTIcon size={12} opacity={0.6} />} />
        <KPITile platform="LinkedIn"  label="followers" value={s.linkedin.value}  delta={s.linkedin.delta}  positive={s.linkedin.positive}  icon={<LIIcon size={12} opacity={0.6} />} />
      </Row>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
        {youtube ? <LatestUploads yt={youtube} /> : <CadenceGrid />}
        <RepliesQueue />
      </div>
      <SocialLifeStrip />
    </div>
  );
}
