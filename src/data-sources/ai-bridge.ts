/**
 * Claude bridge — non-interactive shell-out to the user's installed
 * `claude` CLI (Claude Code).
 *
 * Why shell-out: no new auth. The user already has Claude Max wired up
 * through Claude Code's OAuth, so calling `claude -p "..."` just works.
 * No Anthropic API key required.
 *
 * Latency: ~4-12s per call depending on prompt + output size. Acceptable
 * for ritual buttons ("Plan today", "Close day") that fire on demand.
 * Not acceptable for snappy voice commands.
 */

import { spawn } from "child_process";

function findClaudeBinary(): string {
  // Prefer the user's installed claude; falls back to PATH lookup at spawn time.
  return process.env.CLAUDE_BIN || "claude";
}

export type ClaudeCallOpts = {
  systemPrompt?: string;
  timeoutMs?: number;
  cwd?: string;
};

export async function askClaude(prompt: string, opts: ClaudeCallOpts = {}): Promise<string> {
  const args = ["-p", prompt, "--output-format", "text"];
  if (opts.systemPrompt) args.push("--append-system-prompt", opts.systemPrompt);

  return new Promise((resolve, reject) => {
    const proc = spawn(findClaudeBinary(), args, {
      cwd: opts.cwd,
      env: { ...process.env },
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Claude call timed out — is `claude` on the PATH and signed in?"));
    }, opts.timeoutMs ?? 60_000);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Could not spawn claude: ${e.message}. Install Claude Code and sign in.`));
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(err.trim() || `claude exited ${code}`));
      else resolve(out.trim());
    });
  });
}

/**
 * Ask Claude to respond in JSON. Strips common wrappers (code fences,
 * leading prose) and parses. Throws if it can't recover JSON.
 */
export async function askClaudeJSON<T = unknown>(
  prompt: string,
  opts: ClaudeCallOpts = {},
): Promise<T> {
  const full =
    prompt +
    "\n\nReply with ONLY a single JSON object. No prose, no markdown, no code fence.";
  const text = await askClaude(full, opts);
  return parseLooseJSON<T>(text);
}

export function parseLooseJSON<T = unknown>(text: string): T {
  let s = text.trim();
  // Strip markdown code fence if present.
  const fence = s.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fence) s = fence[1].trim();
  // Find first { ... } block.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}
