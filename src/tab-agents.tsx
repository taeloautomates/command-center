import * as React from "react";
import { GlassCard, Row, Col, Label, Dot, ProgressBar } from "./ui";
import { AgentIcon, TerminalIcon } from "./icons";
import type { AgentSession } from "./data-sources/agents";
import { partitionSessions, fmtDuration, timeAgo } from "./data-sources/agents";
import type { ManualState } from "./data-sources/manual";

function TokenBurnCard({ manual }: { manual: ManualState }) {
  const totalCap = manual.tokenBurn.capUSD;
  const used = manual.tokenBurn.usedUSD;
  const pct = totalCap > 0 ? (used / totalCap) * 100 : 0;
  // Sparkline still illustrative until an Anthropic usage source lands.
  const series = [12, 18, 14, 22, 28, 31, used];
  const max = Math.max(...series);

  return (
    <GlassCard style={{ padding: 22 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Row gap={10}>
          <Label>Token Burn · this week</Label>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>Anthropic · all agents</span>
        </Row>
        <Row gap={6}>
          <Dot />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)" }}>live</span>
        </Row>
      </Row>

      <Row gap={28} align="flex-end" style={{ marginBottom: 14 }}>
        <Col gap={4}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: 0.06, textTransform: "uppercase", fontWeight: 500 }}>used</span>
          <div className="tabular" style={{ fontSize: 40, fontWeight: 600, letterSpacing: -0.025, lineHeight: 1, color: "rgba(255,255,255,0.96)" }}>
            ${used.toFixed(2)}
          </div>
          <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>of ${totalCap}.00 cap</span>
        </Col>

        {/* Sparkline */}
        <Row gap={4} align="flex-end" style={{ flex: 1, height: 56 }}>
          {series.map((v, i) => (
            <div key={i} style={{
              flex: 1,
              height: (v / max) * 100 + "%",
              background: i === series.length - 1 ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.18)",
              borderRadius: 2,
              boxShadow: i === series.length - 1 ? "0 0 8px rgba(255,255,255,0.32)" : "none",
            }} />
          ))}
        </Row>
      </Row>

      <ProgressBar value={pct} active />
      <Row justify="space-between" style={{ marginTop: 6 }}>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>MON</span>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)" }}>{Math.round(pct)}%</span>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>SUN</span>
      </Row>
    </GlassCard>
  );
}

function SessionRow({ s, mode }: { s: AgentSession; mode: "active" | "recent" | "session" }) {
  const isActive = s.isActive && mode !== "session";
  return (
    <Row gap={12} align="center" style={{
      padding: "10px 12px",
      background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
      border: "1px solid rgba(255,255,255," + (isActive ? 0.12 : 0) + ")",
      borderRadius: 8,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: 50, flexShrink: 0,
        background: isActive ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.32)",
        boxShadow: isActive ? "0 0 8px rgba(255,255,255,0.42)" : "none",
      }} />
      <span style={{
        flex: 1, fontSize: 12,
        color: isActive ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)",
        letterSpacing: -0.005,
        textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
      }}>{s.title}</span>
      <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>{s.id}</span>
      <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", minWidth: 60, textAlign: "right" }}>
        {s.durationMs > 0 ? fmtDuration(s.durationMs) : `${s.messageCount}msg`}
      </span>
      <span className="mono tabular" style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.42)", minWidth: 40, textAlign: "right" }}>
        {timeAgo(s.mtimeMs)}
      </span>
    </Row>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: "16px 12px", border: "1px dashed rgba(255,255,255,0.08)",
      borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.38)", textAlign: "center",
    }}>{msg}</div>
  );
}

function ActiveRunsCard({ active }: { active: AgentSession[] }) {
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={10}>
          <Label>Active sessions</Label>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.96)" }}>{active.length}</span>
        </Row>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>refresh · 60s</span>
      </Row>
      {active.length === 0
        ? <EmptyState msg="No active Claude Code sessions in the last 10 minutes." />
        : <Col gap={6}>{active.map((s) => <SessionRow key={s.id} s={s} mode="active" />)}</Col>
      }
    </GlassCard>
  );
}

function RecentRunsCard({ recent }: { recent: AgentSession[] }) {
  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>Recent sessions</Label>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>last 24h</span>
      </Row>
      <Col gap={4} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="scroll">
        {recent.length === 0
          ? <EmptyState msg="No sessions in the last 24h." />
          : recent.map((s) => <SessionRow key={s.id} s={s} mode="recent" />)
        }
      </Col>
    </GlassCard>
  );
}

function ScheduledCard() {
  const scheduled = [
    { name: "/trendscout",       cadence: "MON · 09:00",    next: "Mon 09:00" },
    { name: "daily-reporter",    cadence: "every day · 18:00", next: "today 18:00" },
    { name: "channel-analyst",   cadence: "WED · 11:00",    next: "Wed 11:00" },
  ];
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8}>
          <AgentIcon size={12} opacity={0.5} />
          <Label>Scheduled</Label>
        </Row>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{scheduled.length}</span>
      </Row>
      <Col gap={0}>
        {scheduled.map((s, i) => (
          <Row key={i} gap={12} align="center" style={{
            padding: "10px 0",
            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
          }}>
            <span className="mono" style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.86)" }}>{s.name}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{s.cadence}</span>
            <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", minWidth: 84, textAlign: "right" }}>{s.next}</span>
          </Row>
        ))}
      </Col>
    </GlassCard>
  );
}

function ClaudeSessionsCard({ sessions }: { sessions: AgentSession[] }) {
  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={8}>
          <TerminalIcon size={12} opacity={0.5} />
          <Label>Claude Code · all sessions</Label>
        </Row>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{sessions.length}</span>
      </Row>
      <Col gap={0} style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="scroll">
        {sessions.length === 0
          ? <EmptyState msg="No Claude Code sessions found under the Content engine project." />
          : sessions.map((s, i) => (
            <Row key={s.id} gap={12} align="center" style={{
              padding: "10px 0",
              borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
              opacity: s.isActive ? 1 : 0.86,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: 50, flexShrink: 0,
                background: s.isActive ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.18)",
                boxShadow: s.isActive ? "0 0 8px rgba(255,255,255,0.32)" : "none",
              }} />
              <span style={{ flex: 1, fontSize: 12, color: s.isActive ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)", letterSpacing: -0.005, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{s.title}</span>
              <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{s.cwd}</span>
              <span className="mono tabular" style={{ fontSize: 11, color: s.isActive ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.42)", minWidth: 48, textAlign: "right" }}>{timeAgo(s.mtimeMs)}</span>
            </Row>
          ))
        }
      </Col>
    </GlassCard>
  );
}

export function TabAgents({ sessions, manual }: { sessions: AgentSession[]; manual: ManualState }) {
  const { active, recent } = React.useMemo(() => partitionSessions(sessions), [sessions]);
  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <TokenBurnCard manual={manual} />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Col gap={12} style={{ minHeight: 0 }}>
          <ActiveRunsCard active={active} />
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            <RecentRunsCard recent={recent} />
          </div>
        </Col>
        <Col gap={12} style={{ minHeight: 0 }}>
          <ScheduledCard />
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            <ClaudeSessionsCard sessions={sessions} />
          </div>
        </Col>
      </div>
    </div>
  );
}
