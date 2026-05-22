import * as React from "react";
import { Row, Col, Label } from "./ui";
import { CheckIcon, PlusIcon } from "./icons";
import type { CloseDaySummary, CarryItem } from "./data-sources/close-day";

/**
 * Modal shown after "Close day" fires. Renders Claude's synthesis of the
 * day plus a list of carry-over items the user can move to tomorrow's trunk.
 * Nothing moves automatically — every carry-over button is explicit.
 */
export function CloseDayModal({
  state, summary, error, onCarryItem, onCarryAll, onClose,
}: {
  state: "loading" | "ready" | "error";
  summary: CloseDaySummary | null;
  error?: string;
  onCarryItem: (item: CarryItem) => void;
  onCarryAll: (items: CarryItem[]) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [carried, setCarried] = React.useState<Set<number>>(new Set());

  const handleCarryAll = () => {
    if (!summary) return;
    const remaining = summary.carryOver.filter((_, i) => !carried.has(i));
    if (remaining.length === 0) return;
    onCarryAll(remaining);
    setCarried(new Set(summary.carryOver.map((_, i) => i)));
  };

  return (
    <div className="cc-modal-backdrop" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Row gap={10}>
            <span className="cc-sun-glyph" aria-hidden="true">●</span>
            <Col gap={2}>
              <Label>Close day · Claude</Label>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005 }}>
                Reading today's log and open work.
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
              Claude is reviewing your day…
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
          </Col>
        )}

        {state === "ready" && summary && (
          <>
            {/* Headline */}
            <div style={{
              padding: "10px 14px", marginBottom: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 13, fontStyle: "italic", letterSpacing: -0.005,
              color: "rgba(255,255,255,0.92)",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              "{summary.headline}"
            </div>

            {/* Done */}
            {summary.done.length > 0 && (
              <Col gap={6} style={{ marginBottom: 14 }}>
                <Label>Done ({summary.done.length})</Label>
                <Col gap={4}>
                  {summary.done.map((d, i) => (
                    <Row key={i} gap={8} align="start" style={{ fontSize: 12, color: "rgba(255,255,255,0.86)", lineHeight: 1.5 }}>
                      <span style={{ color: "rgba(155,210,150,0.86)", flexShrink: 0 }}>✓</span>
                      <span style={{ flex: 1 }}>{d}</span>
                    </Row>
                  ))}
                </Col>
              </Col>
            )}

            {/* Undone */}
            {summary.undone.length > 0 && (
              <Col gap={6} style={{ marginBottom: 14 }}>
                <Label>Still open ({summary.undone.length})</Label>
                <Col gap={4}>
                  {summary.undone.map((u, i) => (
                    <Row key={i} gap={8} align="start" style={{ fontSize: 12, color: "rgba(255,255,255,0.74)", lineHeight: 1.5 }}>
                      <span style={{ color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>○</span>
                      <span style={{ flex: 1 }}>{u}</span>
                    </Row>
                  ))}
                </Col>
              </Col>
            )}

            {/* Carry over */}
            {summary.carryOver.length > 0 && (
              <Col gap={6} style={{ marginBottom: 14 }}>
                <Label>Carry to tomorrow's trunk</Label>
                <Col gap={6}>
                  {summary.carryOver.map((c, i) => {
                    const isCarried = carried.has(i);
                    return (
                      <Row key={i} gap={10} align="center" style={{
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                      }}>
                        <Col gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
                            {c.title}
                          </span>
                          <Row gap={8}>
                            {c.project && (
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>{c.project}</span>
                            )}
                            {c.estMin && (
                              <>
                                {c.project && <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>·</span>}
                                <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.42)" }}>{c.estMin}m</span>
                              </>
                            )}
                          </Row>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", letterSpacing: -0.005, lineHeight: 1.4, marginTop: 2 }}>
                            {c.why}
                          </span>
                        </Col>
                        <button
                          className={"pill" + (isCarried ? " ghost" : "")}
                          onClick={() => {
                            if (isCarried) return;
                            onCarryItem(c);
                            setCarried((s) => new Set([...s, i]));
                          }}
                          disabled={isCarried}
                          style={{ padding: "3px 9px", fontSize: 9, flexShrink: 0 }}
                        >
                          {isCarried
                            ? <Row gap={3}><CheckIcon size={9} opacity={0.78} /> <span>carried</span></Row>
                            : <Row gap={3}><PlusIcon size={9} opacity={0.78} /> <span>trunk</span></Row>}
                        </button>
                      </Row>
                    );
                  })}
                </Col>
              </Col>
            )}

            {/* Reflection */}
            {summary.reflection && (
              <Col gap={6} style={{ marginBottom: 14 }}>
                <Label>Reflection</Label>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.5, letterSpacing: -0.005 }}>
                  {summary.reflection}
                </span>
              </Col>
            )}

            <Row justify="space-between" style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button className="pill ghost" onClick={onClose} style={{ padding: "5px 14px" }}>
                Dismiss
              </button>
              {summary.carryOver.length > 0 && (
                <button className="pill solid" onClick={handleCarryAll} style={{ padding: "5px 14px" }}>
                  Carry all to trunk
                </button>
              )}
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
