import * as React from "react";
import { GlassCard, Row, Col, Dot } from "./ui";
import { FocusIcon, SyncIcon } from "./icons";
import type { TabId } from "./types";
import { timeAgo } from "./data-sources/fs-helpers";

const TABS: TabId[] = ["9-to-5", "Side Project", "Health", "Inspired", "Social"];

function LiveClock() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  return (
    <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", letterSpacing: 0.2 }}>
      {hh}:{mm}:{ss}
    </span>
  );
}

function LiveDateChip() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const dow = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][t.getDay()];
  const month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][t.getMonth()];
  const day = t.getDate();
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 10px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.06,
      color: "rgba(255,255,255,0.7)",
    }} className="tabular">
      <span style={{ color: "rgba(255,255,255,0.38)" }}>{dow}</span>
      <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.10)" }} />
      <span>{month} {day}</span>
    </div>
  );
}

function Monogram() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 9,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
      color: "rgba(255,255,255,0.86)",
    }}>TK</div>
  );
}

export function TopBar({
  tab, setTab, focusMode, setFocusMode, onRefresh, refreshing, loadedAt,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  focusMode: boolean;
  setFocusMode: (b: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loadedAt?: number;
}) {
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(() => tick(), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  const ago = loadedAt ? timeAgo(loadedAt) : "—";
  return (
    <GlassCard strong style={{ height: 56, display: "flex", alignItems: "center", padding: "0 16px" }}>
      <Row gap={12} style={{ width: 280 }}>
        <Monogram />
        <Col gap={2}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.01, color: "rgba(255,255,255,0.94)" }}>Command Center</div>
          <LiveClock />
        </Col>
      </Row>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div className="seg" role="tablist">
          {TABS.map((t) => (
            <button key={t}
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "on" : ""}
              onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Row gap={10} justify="flex-end" style={{ width: 280 }}>
        <LiveDateChip />
        <button
          aria-label="Focus mode"
          onClick={() => setFocusMode(!focusMode)}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: focusMode ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255," + (focusMode ? 0.18 : 0.07) + ")",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 200ms cubic-bezier(.22,.61,.36,1)",
          }}>
          <FocusIcon size={14} opacity={focusMode ? 0.96 : 0.62} />
        </button>
        <button
          aria-label="Refresh data"
          onClick={onRefresh}
          disabled={refreshing}
          title={loadedAt ? `Loaded ${ago} ago` : "Loading…"}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.62)",
            cursor: refreshing ? "wait" : "pointer",
            fontFamily: "inherit",
            transition: "all 200ms cubic-bezier(.22,.61,.36,1)",
          }}>
          <span style={{
            display: "inline-flex",
            animation: refreshing ? "cc-spin 1s linear infinite" : "none",
          }}>
            <SyncIcon size={11} opacity={refreshing ? 0.96 : 0.62} />
          </span>
          <span style={{ fontSize: 11, letterSpacing: -0.005 }}>
            {refreshing ? "syncing" : loadedAt ? ago : "—"}
          </span>
        </button>
      </Row>
    </GlassCard>
  );
}
