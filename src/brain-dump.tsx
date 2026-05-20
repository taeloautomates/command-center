import * as React from "react";
import { GlassCard, Row, Col, Label } from "./ui";
import type { BrainDumpEntry } from "./persistence";

/**
 * Frictionless idea capture. Type, hit Cmd-Enter, line appears at the top
 * with a timestamp and persists to command-center/braindump.md.
 *
 * Lives on the Inspired tab — fits the "raw thought" semantic.
 */
export function BrainDumpCard({
  entries, onSubmit,
}: {
  entries: BrainDumpEntry[];
  onSubmit: (text: string) => Promise<void> | void;
}) {
  const [draft, setDraft] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  const submit = async () => {
    const t = draft.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(t);
      setDraft("");
      taRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <GlassCard style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Row gap={10}>
          <Label>Brain Dump</Label>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>command-center/braindump.md</span>
        </Row>
        <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
          {entries.length} captured
        </span>
      </Row>

      <textarea
        ref={taRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        placeholder="Drop a thought. Cmd-Enter to save."
        className="braindump-input"
        rows={2}
      />

      <Row justify="space-between" align="center" style={{ marginTop: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
          {draft.trim().length > 0 ? `${draft.trim().length} chars` : "newest entry pinned to top"}
        </span>
        <button
          className={"pill" + (draft.trim() ? " solid" : "")}
          onClick={submit}
          disabled={!draft.trim() || submitting}
          style={{ padding: "4px 12px", fontSize: 10 }}
        >
          {submitting ? "saving…" : "⌘↵ capture"}
        </button>
      </Row>

      <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {entries.length === 0 ? (
          <div style={{
            padding: "16px 12px", fontSize: 11, color: "rgba(255,255,255,0.38)",
            textAlign: "center", letterSpacing: -0.005,
          }}>
            Nothing captured yet. Drop a thought above ↑
          </div>
        ) : (
          <Col gap={0}>
            {entries.slice(0, 20).map((e, i) => (
              <Col key={i} gap={2} style={{
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{
                  fontSize: 12, color: "rgba(255,255,255,0.86)",
                  letterSpacing: -0.005, lineHeight: 1.4,
                }}>{e.text}</span>
                <span className="mono tabular" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>
                  {e.ts}
                </span>
              </Col>
            ))}
          </Col>
        )}
      </div>
    </GlassCard>
  );
}
