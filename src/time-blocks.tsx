import * as React from "react";
import type { Brick } from "./types";
import { GlassCard, Label, Row } from "./ui";

export const BRICK_TYPES: Brick[] = [
  { id: "instrument", name: "Instrument", dur: 60, glyph: "♪" },
  { id: "reading",    name: "Reading",    dur: 45, glyph: "▤" },
  { id: "run",        name: "Run",        dur: 45, glyph: "▶" },
  { id: "stretch",    name: "Stretch",    dur: 20, glyph: "~" },
  { id: "deepwork",   name: "Deep work",  dur: 90, glyph: "■" },
  { id: "walk",       name: "Walk",       dur: 30, glyph: "↗" },
];

export function fmtDur(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

export function fmtTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function StoneBrick({
  brick,
  isDragging,
  onPointerDown,
  ghost,
  className = "",
}: {
  brick: Brick;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  ghost?: boolean;
  className?: string;
}) {
  return (
    <div
      className={"stone-brick" + (isDragging ? " is-dragging" : "") + (ghost ? " ghost" : "") + " " + className}
      onPointerDown={onPointerDown}
      role="button"
      aria-label={`${brick.name} — ${fmtDur(brick.dur)}`}
    >
      <span className="glyph" aria-hidden="true">
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.86)", lineHeight: 1 }}>{brick.glyph}</span>
      </span>
      <span className="name">{brick.name}</span>
      <span className="dur">{fmtDur(brick.dur)}</span>
    </div>
  );
}

type DragState = { brick: Brick; x: number; y: number } | null;

export function useBrickDrag(onDrop: (brick: Brick, e: PointerEvent) => void) {
  const onDropRef = React.useRef(onDrop);
  onDropRef.current = onDrop;

  const [drag, setDrag] = React.useState<DragState>(null);

  const startDrag = React.useCallback((brick: Brick, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ brick, x: e.clientX, y: e.clientY });
  }, []);

  React.useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) =>
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
    const up = (e: PointerEvent) => {
      if (onDropRef.current) onDropRef.current(drag.brick, e);
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag?.brick.id]);

  return { drag, startDrag };
}

export function BrickGhost({ drag }: { drag: DragState }) {
  if (!drag) return null;
  return (
    <div style={{ position: "fixed", left: drag.x, top: drag.y, pointerEvents: "none", zIndex: 9999 }}>
      <StoneBrick brick={drag.brick} ghost />
    </div>
  );
}

export function TimeBlockPaletteCard({
  startDrag,
  draggingId,
}: {
  startDrag: (b: Brick, e: React.PointerEvent) => void;
  draggingId?: string;
}) {
  return (
    <GlassCard style={{ padding: 18, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 4 }}>
        <Label>Time Blocks</Label>
        <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>drag onto calendar →</span>
      </Row>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005, marginBottom: 12 }}>
        Block time before the day blocks you.
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {BRICK_TYPES.map((b) => (
          <StoneBrick
            key={b.id}
            brick={b}
            isDragging={draggingId === b.id}
            onPointerDown={(e) => startDrag(b, e)}
          />
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row justify="space-between" align="center">
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>snaps to 15 min</span>
          <button className="pill ghost" style={{ padding: "3px 10px", fontSize: 10 }}>+ custom</button>
        </Row>
      </div>
    </GlassCard>
  );
}
