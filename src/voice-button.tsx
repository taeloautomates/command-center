import * as React from "react";
import { startRecording, transcribe, readWhisperKey, WhisperKey } from "./data-sources/voice";

/**
 * Push-to-talk voice button. Lives in the topbar.
 *
 *   • Click (or press Cmd-Shift-Space) → start recording
 *   • Click again (or press hotkey again) → stop, transcribe, dispatch
 *   • Pulses while recording, spins while transcribing
 *
 * Surfaces what Whisper heard + what the dashboard did. If parsing failed,
 * shows the raw transcript so the user can see why.
 */
export function VoiceButton({
  onTranscript,
}: {
  onTranscript: (text: string) => Promise<{ ok: boolean; summary: string }>;
}) {
  const [state, setState] = React.useState<"idle" | "recording" | "transcribing">("idle");
  const [feedback, setFeedback] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [key, setKey] = React.useState<WhisperKey>(null);
  const recRef = React.useRef<{ stop: () => Promise<Blob>; cancel: () => void } | null>(null);

  React.useEffect(() => {
    readWhisperKey().then(setKey);
  }, []);

  const start = React.useCallback(async () => {
    if (!key) {
      setFeedback({ ok: false, text: "No Whisper key found in ~/.config/watch/.env" });
      return;
    }
    try {
      const rec = await startRecording();
      recRef.current = rec;
      setState("recording");
      setFeedback(null);
    } catch (e: any) {
      setFeedback({ ok: false, text: `Mic failed: ${e?.message ?? e}` });
    }
  }, [key]);

  const stop = React.useCallback(async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setState("transcribing");
    try {
      const blob = await rec.stop();
      const transcript = await transcribe(blob, key);
      if (!transcript) {
        setFeedback({ ok: false, text: "Heard nothing — try again" });
        setState("idle");
        return;
      }
      const result = await onTranscript(transcript);
      setFeedback({ ok: result.ok, text: result.summary });
    } catch (e: any) {
      setFeedback({ ok: false, text: `Transcribe failed: ${e?.message ?? e}` });
    } finally {
      setState("idle");
    }
  }, [key, onTranscript]);

  const toggle = React.useCallback(() => {
    if (state === "idle") start();
    else if (state === "recording") stop();
  }, [state, start, stop]);

  // Hotkey: Cmd-Shift-Space
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  // Auto-dismiss feedback after a moment.
  React.useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [feedback]);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        aria-label="Voice command (Cmd-Shift-Space)"
        onClick={toggle}
        disabled={state === "transcribing"}
        title={key ? "Push to talk · Cmd-Shift-Space" : "Add GROQ_API_KEY to ~/.config/watch/.env"}
        className={"cc-voice-btn" +
          (state === "recording" ? " recording" : "") +
          (state === "transcribing" ? " transcribing" : "") +
          (!key ? " disabled" : "")
        }
      >
        <MicGlyph state={state} />
        <span className="cc-voice-label">
          {state === "recording" ? "listening…" : state === "transcribing" ? "transcribing…" : "voice"}
        </span>
      </button>
      {feedback && (
        <div className={"cc-voice-feedback" + (feedback.ok ? " ok" : " err")} role="status">
          {feedback.text}
        </div>
      )}
    </div>
  );
}

function MicGlyph({ state }: { state: "idle" | "recording" | "transcribing" }) {
  if (state === "transcribing") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="cc-voice-spin">
        <path d="M8 1 a7 7 0 0 1 7 7" stroke="rgba(255,255,255,0.92)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="6" y="2" width="4" height="8" rx="2" fill={state === "recording" ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)"} />
      <path d="M3.5 7.5 A4.5 4.5 0 0 0 12.5 7.5" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <line x1="8" y1="12" x2="8" y2="14" stroke="rgba(255,255,255,0.78)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
