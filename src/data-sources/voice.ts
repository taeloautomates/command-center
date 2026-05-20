/**
 * Voice control — Whisper STT.
 *
 * Records mic audio via the browser MediaRecorder, posts to Groq's Whisper
 * endpoint (preferred — cheaper/faster), falls back to OpenAI if only that
 * key is present. The key is read from ~/.config/watch/.env so users who
 * already set up the /watch skill don't have to configure twice.
 *
 * If no key is available, the voice button surfaces a clear setup hint.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const KEY_FILE = path.join(os.homedir(), ".config", "watch", ".env");

export type WhisperBackend = "groq" | "openai";

export type WhisperKey = {
  backend: WhisperBackend;
  apiKey: string;
} | null;

export async function readWhisperKey(): Promise<WhisperKey> {
  try {
    const content = await fs.readFile(KEY_FILE, "utf8");
    const groq = content.match(/^GROQ_API_KEY=(.+)$/m)?.[1]?.trim();
    if (groq && groq.length > 10) return { backend: "groq", apiKey: groq };
    const openai = content.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
    if (openai && openai.length > 10) return { backend: "openai", apiKey: openai };
    return null;
  } catch {
    return null;
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_URL = "https://api.openai.com/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3";
const OPENAI_MODEL = "whisper-1";

export async function transcribe(blob: Blob, key: WhisperKey): Promise<string> {
  if (!key) throw new Error("No Whisper key configured");
  const url = key.backend === "groq" ? GROQ_URL : OPENAI_URL;
  const model = key.backend === "groq" ? GROQ_MODEL : OPENAI_MODEL;
  const form = new FormData();
  form.append("file", blob, "audio.webm");
  form.append("model", model);
  form.append("response_format", "json");
  form.append("language", "en");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Whisper ${key.backend} ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.text || "").trim();
}

/* ─── Audio capture ──────────────────────────────────────────── */

export type Recorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  // Pick a mimeType the host supports. Electron usually has webm/opus.
  const mimeType =
    MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
    : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
    : "";

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  let cancelled = false;

  const stop = (): Promise<Blob> => new Promise((resolve, reject) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (cancelled) { reject(new Error("cancelled")); return; }
      const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
      resolve(blob);
    };
    if (recorder.state !== "inactive") recorder.stop();
  });

  const cancel = () => {
    cancelled = true;
    stream.getTracks().forEach((t) => t.stop());
    if (recorder.state !== "inactive") recorder.stop();
  };

  return { stop, cancel };
}
