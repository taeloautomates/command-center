import * as React from "react";
import { GlassCard, Row, Col, Label } from "./ui";
import { CheckIcon, PlusIcon } from "./icons";
import type { DayPlan, PlannedBlock } from "./data-sources/plan-today";
import { brickForKey } from "./data-sources/plan-today";

/**
 * Modal shown after "Plan today" fires. Renders Claude's proposed MIT +
 * suggested time blocks + reasoning. User can apply all, apply selectively,
 * or dismiss.
 */
export function PlanTodayModal({
  state, plan, error, onApplyMIT, onApplyBlock, onClose,
}: {
  state: "loading" | "ready" | "error";
  plan: DayPlan | null;
  error?: string;
  onApplyMIT: () => void;
  onApplyBlock: (b: PlannedBlock) => void;
  onClose: () => void;
}) {
  // Lock body scroll while modal is open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [appliedMIT, setAppliedMIT] = React.useState(false);
  const [appliedBlocks, setAppliedBlocks] = React.useState<Set<number>>(new Set());

  const handleApplyAll = () => {
    if (!plan) return;
    if (!appliedMIT) { onApplyMIT(); setAppliedMIT(true); }
    plan.blocks.forEach((b, i) => {
      if (!appliedBlocks.has(i)) onApplyBlock(b);
    });
    setAppliedBlocks(new Set(plan.blocks.map((_, i) => i)));
  };

  return (
    <div className="cc-modal-backdrop" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Row gap={10}>
            <span className="cc-sun-glyph" aria-hidden="true">☀</span>
            <Col gap={2}>
              <Label>Plan today · Claude</Label>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005 }}>
                Reading your calendar, trunk, and brain dump.
              </span>
            </Col>
          </Row>
          <button className="cc-modal-close" onClick={onClose} aria-label="Close">×</button>
        </Row>

        {state === "loading" && (
          <Col gap={14} style={{ alignItems: "center", padding: "32px 12px" }}>
            <div className="cc-think-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", letterSpacing: -0.005 }}>
              Claude is thinking through your day…
            </span>
            <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
              this can take 5–15 seconds
            </span>
          </Col>
        )}

        {state === "error" && (
          <Col gap={10} style={{ padding: "20px 8px" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.86)", lineHeight: 1.45 }}>
              Couldn't reach Claude.
            </span>
            <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
              {error}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 6 }}>
              Make sure <span className="mono">claude</span> is on your PATH and signed in. Try opening the Terminal tab and running <span className="mono">claude</span> manually.
            </span>
          </Col>
        )}

        {state === "ready" && plan && (
          <>
            {plan.framing && (
              <div style={{
                padding: "10px 14px", marginBottom: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 13, fontStyle: "italic", letterSpacing: -0.005,
                color: "rgba(255,255,255,0.86)",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                "{plan.framing}"
              </div>
            )}

            {/* MIT block */}
            <Col gap={6} style={{ marginBottom: 16 }}>
              <Label>Front Seat</Label>
              <div style={{
                padding: "14px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
              }}>
                <Row justify="space-between" align="flex-start">
                  <Col gap={4} style={{ flex: 1 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.96)", letterSpacing: -0.012, lineHeight: 1.3 }}>
                      {plan.mit}
                    </span>
                    <Row gap={8}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>{plan.project}</span>
                      <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                      <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{plan.estMin}m</span>
                    </Row>
                  </Col>
                  <button
                    className={"pill" + (appliedMIT ? " ghost" : " solid")}
                    onClick={() => { if (!appliedMIT) { onApplyMIT(); setAppliedMIT(true); } }}
                    disabled={appliedMIT}
                    style={{ padding: "4px 12px", fontSize: 10, flexShrink: 0 }}
                  >
                    {appliedMIT ? <Row gap={4}><CheckIcon size={10} opacity={0.78} /> <span>buckled in</span></Row> : "Buckle in"}
                  </button>
                </Row>
              </div>
            </Col>

            {/* Blocks list */}
            {plan.blocks.length > 0 && (
              <Col gap={6} style={{ marginBottom: 16 }}>
                <Label>Suggested time blocks</Label>
                <Col gap={6}>
                  {plan.blocks.map((b, i) => {
                    const brick = brickForKey(b.brick);
                    const dur = b.durationMin ?? brick?.dur ?? 45;
                    const startH = Math.floor(b.startHour);
                    const startM = Math.round((b.startHour - startH) * 60);
                    const isApplied = appliedBlocks.has(i);
                    return (
                      <Row key={i} gap={10} align="center" style={{
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                      }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                          background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.30))",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, color: "rgba(255,255,255,0.92)",
                        }}>{brick?.glyph ?? "·"}</span>
                        <Col gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
                            {brick?.name ?? b.brick} · {dur}m
                          </span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005, lineHeight: 1.4 }}>
                            {b.why}
                          </span>
                        </Col>
                        <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", minWidth: 48, textAlign: "right" }}>
                          {String(startH).padStart(2, "0")}:{String(startM).padStart(2, "0")}
                        </span>
                        <button
                          className={"pill" + (isApplied ? " ghost" : "")}
                          onClick={() => {
                            if (isApplied) return;
                            onApplyBlock(b);
                            setAppliedBlocks((s) => new Set([...s, i]));
                          }}
                          disabled={isApplied || !brick}
                          style={{ padding: "3px 9px", fontSize: 9, flexShrink: 0 }}
                          title={!brick ? `Unknown brick "${b.brick}"` : ""}
                        >
                          {isApplied ? "placed" : <Row gap={3}><PlusIcon size={9} opacity={0.78} /> <span>place</span></Row>}
                        </button>
                      </Row>
                    );
                  })}
                </Col>
              </Col>
            )}

            {/* Reasoning */}
            {plan.reasoning && (
              <Col gap={6} style={{ marginBottom: 14 }}>
                <Label>Why</Label>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.5, letterSpacing: -0.005 }}>
                  {plan.reasoning}
                </span>
              </Col>
            )}

            {/* Action row */}
            <Row justify="space-between" style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="pill ghost" onClick={onClose} style={{ padding: "5px 14px" }}>
                Dismiss
              </button>
              <button className="pill solid" onClick={handleApplyAll} style={{ padding: "5px 14px" }}>
                Apply all
              </button>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
