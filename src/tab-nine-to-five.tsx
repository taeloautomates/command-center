import * as React from "react";
import { GlassCard, Row, Col, Label, Check, ProgressBar } from "./ui";
import { BRICK_TYPES, fmtTime, useBrickDrag, BrickGhost, TimeBlockPaletteCard } from "./time-blocks";
import type { Brick, PlacedBlock, Todo } from "./types";
import type { ManualState } from "./data-sources/manual";
import type { ICSEvent } from "./data-sources/ical";

function SwimlaneChip({ id, title, kind }: { id: string; title: string; kind: string }) {
  const active = kind === "doing";
  return (
    <div style={{
      padding: "8px 10px",
      background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255," + (active ? 0.14 : 0.05) + ")",
      borderRadius: 8,
      boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.14)" : "none",
      transition: "all 200ms",
    }}>
      <Row gap={8} align="center">
        <span className="mono" style={{ fontSize: 10, letterSpacing: 0.04, color: active ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.32)", flexShrink: 0 }}>{id}</span>
        <span style={{ fontSize: 12, letterSpacing: -0.005, color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.66)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{title}</span>
      </Row>
    </div>
  );
}

function SwimColumn({ title, count, kind, items }: {
  title: string; count: number; kind: string; items: { id: string; title: string }[];
}) {
  return (
    <Col gap={10} style={{ flex: 1, minWidth: 0 }}>
      <Row justify="space-between" align="center">
        <Label>{title}</Label>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{String(count).padStart(2, "0")}</span>
      </Row>
      <Col gap={6}>
        {items.map((it) => <SwimlaneChip key={it.id} {...it} kind={kind} />)}
        {items.length === 0 && (
          <div style={{ padding: "10px 10px", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>—</div>
        )}
      </Col>
    </Col>
  );
}

function WorkCard({ manual }: { manual: ManualState }) {
  const w = manual.work;
  const total = w.doing.length + w.next.length + w.blocked.length;
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={10}>
          <Label>Today's Work</Label>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{w.sprint} · {w.day}</span>
        </Row>
        <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{total} active</span>
      </Row>
      <Row gap={14} align="flex-start">
        <SwimColumn title="Doing"   count={w.doing.length}   kind="doing"   items={w.doing} />
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.05)" }} />
        <SwimColumn title="Next"    count={w.next.length}    kind="next"    items={w.next} />
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.05)" }} />
        <SwimColumn title="Blocked" count={w.blocked.length} kind="blocked" items={w.blocked} />
      </Row>
    </GlassCard>
  );
}

function CalendarTimeline({
  placedBlocks, hoverMin, hoverBrick, timelineInnerRef, onRemoveBlock, calendarEvents,
}: {
  placedBlocks: PlacedBlock[];
  hoverMin: number | null;
  hoverBrick: Brick | null;
  timelineInnerRef: React.MutableRefObject<HTMLDivElement | null>;
  onRemoveBlock: (id: string) => void;
  calendarEvents: ICSEvent[];
}) {
  const start = 9 * 60;
  const end = 18 * 60;
  const span = end - start;
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = ((nowMin - start) / span) * 100;

  // Convert real calendar events to in-view meetings. Filter to today only,
  // hide ones that don't overlap the visible 9–18 window.
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const todays = calendarEvents.filter((e) => e.start >= dayStart && e.start < dayEnd);
  const meetings = todays
    .map((e) => {
      const s = e.start.getHours() * 60 + e.start.getMinutes();
      const en = e.end.getHours() * 60 + e.end.getMinutes();
      return {
        title: e.title,
        s, e: en,
        attendees: 0,
        calendar: e.calendar,
        kind: nowMin >= en ? "past" : nowMin >= s ? "now" : "later",
      };
    })
    .filter((m) => m.e > start && m.s < end);
  const blockedTotal = todays.length;

  const toPct = (m: number) => ((m - start) / span) * 100;
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Row gap={10}>
          <Label>Calendar</Label>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
            {meetings.length === 0
              ? (calendarEvents.length === 0 ? "drop a time-block to schedule" : "no meetings today")
              : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"}`}
            {placedBlocks.length > 0 && ` · ${placedBlocks.length} block${placedBlocks.length === 1 ? "" : "s"}`}
          </span>
        </Row>
        <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>09:00 – 18:00</span>
      </Row>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", gap: 14 }}>
        <Col gap={0} style={{ width: 32, position: "relative" }}>
          {[9, 11, 13, 15, 17].map((h) => (
            <div key={h} style={{
              position: "absolute", top: ((h * 60 - start) / span) * 100 + "%",
              transform: "translateY(-50%)", fontSize: 9, color: "rgba(255,255,255,0.32)",
              fontVariantNumeric: "tabular-nums", letterSpacing: 0.04,
            }}>{String(h).padStart(2, "0")}:00</div>
          ))}
        </Col>
        <div ref={timelineInnerRef as React.RefObject<HTMLDivElement>} style={{ position: "relative", flex: 1, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          {[9, 11, 13, 15, 17].map((h) => (
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
          }} />
          {meetings.map((m, i) => {
            const top = toPct(m.s);
            const height = Math.max(toPct(m.e) - toPct(m.s), 3);
            const opacity = m.kind === "now" ? 0.96 : m.kind === "later" ? 0.62 : 0.32;
            const bg = m.kind === "now" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
            return (
              <div key={i} style={{
                position: "absolute", left: 8, right: 6, top: top + "%", height: height + "%",
                minHeight: 30, overflow: "hidden",
                background: bg, border: "1px solid rgba(255,255,255," + (m.kind === "now" ? 0.16 : 0.06) + ")",
                borderRadius: 6, padding: "5px 8px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                boxShadow: m.kind === "now" ? "inset 0 1px 0 rgba(255,255,255,0.18)" : "none",
                zIndex: m.kind === "now" ? 2 : 1,
              }}>
                <Col gap={1} style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.005, color: `rgba(255,255,255,${opacity})`, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{m.title}</span>
                  <span className="mono tabular" style={{ fontSize: 9, color: `rgba(255,255,255,${opacity * 0.55})` }}>{fmt(m.s)} – {fmt(m.e)}</span>
                </Col>
                {m.attendees > 0 && (
                  <span className="mono tabular" style={{ fontSize: 10, color: `rgba(255,255,255,${opacity * 0.6})`, padding: "2px 6px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, flexShrink: 0 }}>{m.attendees}</span>
                )}
              </div>
            );
          })}
          {placedBlocks.map((b) => {
            const top = toPct(b.startMin);
            const height = Math.max(toPct(b.startMin + b.durMin) - toPct(b.startMin), 3);
            const syncCls = b.syncState === "pending" ? " syncing"
                          : b.syncState === "failed"  ? " sync-failed"
                          : b.syncState === "synced"  ? " synced"
                          : "";
            return (
              <div key={b.id} className={"placed-block" + syncCls} style={{ left: 8, right: 6, top: top + "%", height: height + "%", minHeight: 30 }}>
                <span className="blocked-badge" aria-hidden="true">{b.brick.glyph}</span>
                <Col gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Row gap={6} align="center">
                    <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.04, color: "rgba(255,255,255,0.86)", textTransform: "uppercase", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{b.brick.name}</span>
                    {b.syncState === "pending" && <span className="sync-indicator" title="syncing to Google Calendar…">↻</span>}
                    {b.syncState === "synced"  && <span className="sync-indicator synced" title="synced to Google Calendar">●</span>}
                    {b.syncState === "failed"  && <span className="sync-indicator failed" title="sync failed">!</span>}
                  </Row>
                  <span className="mono tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.42)" }}>
                    BLOCKED · {fmtTime(b.startMin)} – {fmtTime(b.startMin + b.durMin)}
                  </span>
                </Col>
                <span className="remove" onClick={() => onRemoveBlock(b.id)} aria-label="remove block">×</span>
              </div>
            );
          })}
          {hoverMin !== null && hoverBrick && (
            <div className="drop-preview" style={{
              left: 8, right: 6,
              top: toPct(hoverMin) + "%",
              height: Math.max(toPct(hoverMin + hoverBrick.dur) - toPct(hoverMin), 3) + "%",
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px dashed rgba(255,255,255,0.35)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "rgba(255,255,255,0.86)",
              }}>{hoverBrick.glyph}</span>
              <Col gap={0} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.96)" }}>{hoverBrick.name}</span>
                <span className="mono tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.66)" }}>{fmtTime(hoverMin)} – {fmtTime(hoverMin + hoverBrick.dur)} · drop to place</span>
              </Col>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function EODChecklist({ items, toggle }: { items: Todo[]; toggle: (id: string) => void }) {
  return (
    <GlassCard style={{ padding: 20 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>End of Day</Label>
        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
          {items.filter((i) => i.done).length} <span style={{ color: "rgba(255,255,255,0.32)" }}>/ {items.length}</span>
        </span>
      </Row>
      <Col gap={10}>
        {items.map((it) => (
          <Row key={it.id} gap={10} align="center">
            <Check on={it.done} onClick={() => toggle(it.id)} />
            <span style={{
              fontSize: 13,
              color: it.done ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.78)",
              textDecoration: it.done ? "line-through" : "none",
              textDecorationColor: "rgba(255,255,255,0.24)",
              letterSpacing: -0.005,
            }}>{it.text}</span>
          </Row>
        ))}
        {items.length === 0 && (
          <div style={{ padding: "10px 10px", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
            Edit <span className="mono">command-center/todos/eod.md</span>
          </div>
        )}
      </Col>
    </GlassCard>
  );
}

function BoundaryClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(now);
  target.setHours(17, 30, 0, 0);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const dayStart = new Date(now); dayStart.setHours(9, 0, 0, 0);
  const dayEnd = new Date(now); dayEnd.setHours(17, 30, 0, 0);
  const pct = Math.max(0, Math.min(100, ((now.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100));

  return (
    <GlassCard style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }} clickable>
      <Label>Boundary Clock</Label>
      <Col gap={6} style={{ marginTop: 18, marginBottom: 18 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>until 17:30</span>
        <div className="tabular" style={{
          fontSize: 56, fontWeight: 600, letterSpacing: -0.04, lineHeight: 1,
          color: "rgba(255,255,255,0.96)",
        }}>{display}</div>
      </Col>
      <div style={{ marginBottom: 6 }}>
        <ProgressBar value={pct} />
      </div>
      <Row justify="space-between">
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>09:00</span>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)" }}>{Math.round(pct)}%</span>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>17:30</span>
      </Row>
      <div style={{ flex: 1 }} />
      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Col gap={8}>
          <Label>The second shift</Label>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", letterSpacing: -0.005, lineHeight: 1.4 }}>
            Protect 18:00–22:00 for <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.92)" }}>vault-cli</em> and the next upload.
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>No meetings accepted after 17:30.</span>
        </Col>
      </div>
    </GlassCard>
  );
}

export function TabNineToFive({
  eod, toggleEod, placedBlocks, onAddBlock, onRemoveBlock, manual, calendarEvents,
}: {
  eod: Todo[];
  toggleEod: (id: string) => void;
  placedBlocks: PlacedBlock[];
  onAddBlock: (b: PlacedBlock) => void;
  onRemoveBlock: (id: string) => void;
  manual: ManualState;
  calendarEvents: ICSEvent[];
}) {
  const surfaceKey = "9to5";
  const surfaceBlocks = placedBlocks.filter((b) => b.surface === surfaceKey);
  const [hoverMin, setHoverMin] = React.useState<number | null>(null);
  const [hoverBrick, setHoverBrick] = React.useState<Brick | null>(null);
  const timelineInnerRef = React.useRef<HTMLDivElement | null>(null);

  const N5_START = 9 * 60;
  const N5_END = 18 * 60;
  const N5_SPAN = N5_END - N5_START;

  const computeDrop = (e: { clientX: number; clientY: number }, brick: Brick): number | null => {
    const r = timelineInnerRef.current?.getBoundingClientRect();
    if (!r) return null;
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    const pct = (e.clientY - r.top) / r.height;
    let m = N5_START + pct * N5_SPAN;
    m = Math.round(m / 15) * 15;
    m = Math.max(N5_START, Math.min(N5_END - brick.dur, m));
    return m;
  };

  const { drag, startDrag } = useBrickDrag((brick, e) => {
    const m = computeDrop(e, brick);
    setHoverMin(null);
    setHoverBrick(null);
    if (m === null) return;
    onAddBlock({
      id: "b" + Math.random().toString(36).slice(2, 9),
      brick, startMin: m, durMin: brick.dur, surface: surfaceKey,
    });
  });

  React.useEffect(() => {
    if (!drag) { setHoverMin(null); setHoverBrick(null); return; }
    const move = (e: PointerEvent) => {
      const m = computeDrop(e, drag.brick);
      setHoverMin(m);
      setHoverBrick(m === null ? null : drag.brick);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [drag?.brick.id]);

  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 380px", gap: 12 }}>
      <Col gap={12} style={{ minHeight: 0 }}>
        <WorkCard manual={manual} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <CalendarTimeline
            placedBlocks={surfaceBlocks}
            hoverMin={hoverMin}
            hoverBrick={hoverBrick}
            timelineInnerRef={timelineInnerRef}
            onRemoveBlock={onRemoveBlock}
            calendarEvents={calendarEvents}
          />
        </div>
        <EODChecklist items={eod} toggle={toggleEod} />
      </Col>
      <Col gap={12} style={{ minHeight: 0 }}>
        <TimeBlockPaletteCard startDrag={startDrag} draggingId={drag?.brick.id} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <BoundaryClock />
        </div>
      </Col>
      <BrickGhost drag={drag} />
    </div>
  );
}
