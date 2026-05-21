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
 *
 * macOS PATH gotcha: Obsidian launched from Finder/Spotlight gets a minimal
 * PATH that doesn't include ~/.local/bin or /opt/homebrew/bin, so plain
 * `spawn("claude", ...)` returns ENOENT. We resolve the binary the first
 * time we're called — checking common install paths, then falling back to
 * a login-shell `command -v claude` — and cache the result.
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/* ─── PATH resolution ─────────────────────────────────────────── */

function commonBinDirs(): string[] {
  const home = os.homedir();
  return [
    `${home}/.local/bin`,
    `${home}/.claude/local`,
    `${home}/.bun/bin`,
    `${home}/.npm-global/bin`,
    `${home}/.volta/bin`,
    `${home}/.nvm/current/bin`,
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
  ];
}

/** Augment PATH so subprocesses can find tools the user installed in their shell. */
export function augmentedEnv(): NodeJS.ProcessEnv {
  const existing = (process.env.PATH || "").split(":").filter(Boolean);
  const merged = Array.from(new Set([...commonBinDirs(), ...existing])).join(":");
  return { ...process.env, PATH: merged };
}

let cachedClaudePath: string | null = null;

/** Find an absolute path to `claude`. Cached after first success. */
export async function resolveClaudeBinary(): Promise<string> {
  if (cachedClaudePath) return cachedClaudePath;
  if (process.env.CLAUDE_BIN && fs.existsSync(process.env.CLAUDE_BIN)) {
    cachedClaudePath = process.env.CLAUDE_BIN;
    return cachedClaudePath;
  }
  // Fast path: try common install locations directly.
  for (const dir of commonBinDirs()) {
    const candidate = path.join(dir, "claude");
    try {
      if (fs.existsSync(candidate)) {
        cachedClaudePath = candidate;
        return candidate;
      }
    } catch {}
  }
  // Slow path: ask the user's login shell where claude is.
  const loginPath = await new Promise<string | null>((resolve) => {
    const sh = spawn("/bin/zsh", ["-lc", "command -v claude"], { env: augmentedEnv() });
    let out = "";
    sh.stdout.on("data", (d) => (out += d.toString()));
    sh.on("close", (code) => {
      const found = out.trim();
      resolve(code === 0 && found ? found : null);
    });
    sh.on("error", () => resolve(null));
  });
  if (loginPath) {
    cachedClaudePath = loginPath;
    return loginPath;
  }
  throw new Error(
    "Could not find the `claude` binary. Install Claude Code (https://docs.claude.com/en/docs/claude-code) " +
    "and sign in. If it's installed at a non-standard path, set CLAUDE_BIN in your environment."
  );
}

export type ClaudeCallOpts = {
  systemPrompt?: string;
  timeoutMs?: number;
  cwd?: string;
};

export async function askClaude(prompt: string, opts: ClaudeCallOpts = {}): Promise<string> {
  const bin = await resolveClaudeBinary();
  const args = ["-p", prompt, "--output-format", "text"];
  if (opts.systemPrompt) args.push("--append-system-prompt", opts.systemPrompt);

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, {
      cwd: opts.cwd,
      env: augmentedEnv(),
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Claude call timed out — is `claude` signed in? Try running it manually from the Terminal pane."));
    }, opts.timeoutMs ?? 60_000);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Could not spawn claude (${bin}): ${e.message}.`));
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
