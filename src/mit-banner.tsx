import * as React from "react";
import { GlassCard, Row, Col, Label, Dot } from "./ui";
import { PauseIcon, PlayIcon, PlusIcon, CheckIcon } from "./icons";
import { Hourglass } from "./hourglass";
import { FrontSeat, ballLabel } from "./car";
import type { MIT } from "./types";

export function MITBanner({
  task, active, paused, progress, remaining, total,
  onTogglePause, onAdd5, onDone,
  seatRef, isDropTarget, onPointerDownSeat,
}: {
  task: MIT;
  active: boolean;
  paused: boolean;
  progress: number;
  remaining: number;
  total: number;
  onTogglePause: () => void;
  onAdd5: () => void;
  onDone: () => void;
  seatRef?: React.RefObject<HTMLDivElement | null>;
  isDropTarget?: boolean;
  onPointerDownSeat?: (e: React.PointerEvent) => void;
}) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = active
    ? `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : "—:—";

  const seatLabel = ballLabel({ title: task.title, project: task.project });

  return (
    <GlassCard strong focus={active && !paused} style={{ height: 220, padding: "16px 24px", display: "flex", alignItems: "stretch" }}>
      {/* Front seat — physical metaphor for "this is what's buckled in" */}
      <div style={{ flex: "0 0 180px", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 8 }}>
        <FrontSeat
          ballLabel={seatLabel}
          fullTitle={task.title}
          active={active}
          paused={paused}
          done={!active}
          isDropTarget={isDropTarget}
          slotRef={seatRef}
          onPointerDownBall={onPointerDownSeat}
        />
      </div>

      {/* Middle column — title, progress, meta */}
      <div style={{ flex: 1, paddingLeft: 16, paddingRight: 24, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Row gap={10}>
            <Label>Front Seat</Label>
            {active && !paused && (
              <Row gap={6}>
                <Dot />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.62)", letterSpacing: 0.14, textTransform: "uppercase", fontWeight: 500 }}>buckled in</span>
              </Row>
            )}
            {active && paused && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: 0.14, textTransform: "uppercase", fontWeight: 500 }}>belt slack · paused</span>
            )}
          </Row>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
            {progress}%
          </span>
        </Row>

        <div style={{
          fontSize: 24, fontWeight: 600, letterSpacing: -0.022, lineHeight: 1.2,
          color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.58)",
          marginBottom: 12, textWrap: "balance",
        }}>
          {task.title}
        </div>

        <div className={"energy-track" + (active && !paused ? "" : " paused")}>
          <div className="energy-fill" style={{ width: progress + "%" }} />
        </div>

        <Row gap={10} style={{ marginTop: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{task.project}</span>
          <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
          <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>est. {task.est} min</span>
          <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
          <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>started {task.startedAt}</span>
        </Row>
      </div>

      <div style={{ flex: "0 0 360px", paddingLeft: 24, display: "flex", alignItems: "center", gap: 18 }}>
        <Hourglass remaining={remaining} total={total} active={active} paused={paused} size={80} />

        <Col gap={8} style={{ flex: 1 }}>
          <Label>Focus Timer</Label>

          <div className="tabular" style={{
            fontSize: 36, fontWeight: 600, letterSpacing: -0.03, lineHeight: 1,
            color: active && !paused ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.38)",
          }}>
            {display}
          </div>

          <Row gap={6} style={{ marginTop: 2 }}>
            <button className="pill" onClick={onTogglePause} disabled={!active}>
              <Row gap={6}>
                {paused || !active ? <PlayIcon size={11} opacity={0.86} /> : <PauseIcon size={11} opacity={0.86} />}
                <span>{paused || !active ? "resume" : "pause"}</span>
              </Row>
            </button>
            <button className="pill" onClick={onAdd5} disabled={!active}>
              <Row gap={6}>
                <PlusIcon size={11} opacity={0.86} />
                <span>5m</span>
              </Row>
            </button>
            <button className="pill solid" onClick={onDone} disabled={!active}>
              <Row gap={6}>
                <CheckIcon size={11} opacity={1} stroke={1.6} />
                <span style={{ color: "#0A0A0B" }}>done</span>
              </Row>
            </button>
          </Row>
        </Col>
      </div>
    </GlassCard>
  );
}
