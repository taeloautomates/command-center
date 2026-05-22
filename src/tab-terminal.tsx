import * as React from "react";
import { GlassCard, Row, Col, Label } from "./ui";
import { TerminalIcon } from "./icons";
import { Terminal as XTerm, ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { augmentedEnv } from "./data-sources/ai-bridge";

/**
 * Terminal tab — embeds a real interactive PTY-backed shell inside the
 * dashboard. Uses xterm.js for rendering and node-pty for the PTY
 * (loaded at runtime to keep it out of the esbuild bundle).
 *
 * Default command on launch: `claude` (Claude Code). User can switch to
 * `codex`, plain shell, or anything else from the launcher row.
 */

// node-pty is loaded at runtime so a missing/incompatible native binary
// doesn't take down the whole plugin. We capture the real load error so
// the UI can surface it — most failures are ABI mismatches between the
// installed prebuilt and Obsidian's Electron version.
let lastLoadError: string | null = null;

function loadNodePty(): any | null {
  lastLoadError = null;
  const req = (window as any).require;
  if (!req) {
    lastLoadError = "window.require unavailable — running outside Electron?";
    return null;
  }

  // Obsidian's `window.require` resolves from renderer_init, NOT from the
  // plugin dir. A bare require("node-pty") will throw "Cannot find module".
  // We need the absolute path — main.ts stashes it on window.__ccPluginRoot.
  const pluginRoot = (window as any).__ccPluginRoot as string | undefined;
  const attempts: { label: string; path: string }[] = [];
  if (pluginRoot) {
    attempts.push({ label: "plugin node_modules", path: `${pluginRoot}/node_modules/node-pty` });
  }
  attempts.push({ label: "bare module name", path: "node-pty" });

  const errors: string[] = [];
  for (const a of attempts) {
    try {
      const m = req(a.path);
      if (m) return m;
      errors.push(`${a.label}: returned falsy`);
    } catch (e: any) {
      errors.push(`${a.label} (${a.path}): ${e?.message || String(e)}`);
    }
  }

  lastLoadError = errors.join("\n");
  console.warn("[command-center] node-pty failed to load:", lastLoadError);
  return null;
}

function diagnoseLoadFailure(): string {
  const electron = (process as any).versions?.electron;
  const modules = (process as any).versions?.modules;
  const arch = (process as any).arch;
  const platform = (process as any).platform;
  return [
    `Real error: ${lastLoadError || "(none captured)"}`,
    "",
    `Obsidian: Electron ${electron || "?"} · Node ABI ${modules || "?"} · ${platform}/${arch}`,
    "",
    "Most common cause: ABI mismatch — the prebuilt node-pty binary doesn't match Obsidian's Electron version.",
    "",
    "Rebuild against Obsidian's Electron (run in the plugin directory):",
    `  cd ~/Desktop/second-brain/.obsidian/plugins/command-center`,
    `  npx electron-rebuild -v ${electron || "<electron-version>"} -m . -w node-pty`,
    "",
    "If that doesn't work, the spawn-helper might lack +x. Run:",
    "  chmod +x node_modules/node-pty/prebuilds/*/spawn-helper",
  ].join("\n");
}

type Launcher = { id: string; label: string; cmd: string; args: string[] };

const LAUNCHERS: Launcher[] = [
  { id: "claude", label: "Claude Code",  cmd: "claude", args: [] },
  { id: "codex",  label: "Codex",        cmd: "codex",  args: [] },
  { id: "shell",  label: "Shell",        cmd: process.env.SHELL || "/bin/zsh", args: ["-l"] },
];

const XTERM_OPTIONS: ITerminalOptions = {
  fontFamily: "'JetBrains Mono', SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  lineHeight: 1.2,
  cursorBlink: true,
  cursorStyle: "block",
  scrollback: 5000,
  allowProposedApi: true,
  theme: {
    background: "#0A0A0B",
    foreground: "rgba(255,255,255,0.92)",
    cursor: "rgba(255,255,255,0.92)",
    cursorAccent: "#0A0A0B",
    selectionBackground: "rgba(255,255,255,0.18)",
    black: "#0A0A0B",
    brightBlack: "#404048",
    red: "#E0828C",
    brightRed: "#FF9DA8",
    green: "#9DD49C",
    brightGreen: "#B6E6B5",
    yellow: "#E0C982",
    brightYellow: "#FFE39E",
    blue: "#8FB4F0",
    brightBlue: "#A8C6FF",
    magenta: "#C39FE0",
    brightMagenta: "#D9B7F0",
    cyan: "#8FD2E8",
    brightCyan: "#A8E0F0",
    white: "rgba(255,255,255,0.92)",
    brightWhite: "#FFFFFF",
  },
};

export function TabTerminal({ cwd }: { cwd: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const termRef = React.useRef<XTerm | null>(null);
  const fitRef = React.useRef<FitAddon | null>(null);
  const ptyRef = React.useRef<any>(null);
  const [launcher, setLauncher] = React.useState<Launcher>(LAUNCHERS[0]);
  const [status, setStatus] = React.useState<"idle" | "running" | "exited" | "error">("idle");
  const [errMsg, setErrMsg] = React.useState<string>("");
  const [restartKey, setRestartKey] = React.useState(0);

  // Mount xterm and wire it to a fresh PTY on every (launcher, restart) change.
  React.useEffect(() => {
    if (!containerRef.current) return;
    const nodePty = loadNodePty();
    if (!nodePty) {
      setStatus("error");
      setErrMsg(diagnoseLoadFailure());
      return;
    }

    const term = new XTerm(XTERM_OPTIONS);
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    // Spawn PTY with the chosen launcher.
    let pty: any;
    try {
      pty = nodePty.spawn(launcher.cmd, launcher.args, {
        name: "xterm-256color",
        cols: term.cols,
        rows: term.rows,
        cwd,
        env: { ...augmentedEnv(), TERM: "xterm-256color", FORCE_COLOR: "1" },
      });
      ptyRef.current = pty;
      setStatus("running");
      setErrMsg("");
    } catch (e: any) {
      setStatus("error");
      setErrMsg(`Failed to spawn ${launcher.cmd}: ${e?.message ?? e}`);
      term.writeln(`\x1b[31mFailed to spawn ${launcher.cmd}\x1b[0m`);
      term.writeln(`${e?.message ?? e}`);
      term.writeln("");
      term.writeln("Common fixes:");
      term.writeln("  • make sure `claude` is on your PATH (which claude)");
      term.writeln("  • or pick Shell from the launchers above and run claude manually");
      return;
    }

    // Two-way pipe.
    const dataDisposable = term.onData((d) => pty.write(d));
    pty.onData((d: string) => term.write(d));
    pty.onExit(({ exitCode }: { exitCode: number }) => {
      setStatus("exited");
      term.writeln("");
      term.writeln(`\x1b[2m[exited with code ${exitCode}] — click ↻ to restart\x1b[0m`);
    });

    // Resize handling.
    const resize = () => {
      try {
        fit.fit();
        pty.resize(term.cols, term.rows);
      } catch {}
    };
    const ro = new ResizeObserver(resize);
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      dataDisposable.dispose();
      try { pty.kill(); } catch {}
      try { term.dispose(); } catch {}
      termRef.current = null;
      ptyRef.current = null;
      fitRef.current = null;
    };
  }, [launcher, restartKey, cwd]);

  const restart = () => setRestartKey((k) => k + 1);
  const focusTerm = () => termRef.current?.focus();

  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <GlassCard style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* Header row — launcher buttons + status */}
        <Row justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Row gap={10}>
            <TerminalIcon size={14} opacity={0.7} />
            <Label>Terminal</Label>
            <span style={{ color: "rgba(255,255,255,0.16)", fontSize: 10 }}>·</span>
            <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", letterSpacing: 0.04 }}>{cwd}</span>
          </Row>
          <Row gap={6}>
            <div className="seg" role="tablist" style={{ padding: 2 }}>
              {LAUNCHERS.map((l) => (
                <button
                  key={l.id}
                  role="tab"
                  aria-selected={launcher.id === l.id}
                  className={launcher.id === l.id ? "on" : ""}
                  onClick={() => setLauncher(l)}
                  style={{ padding: "4px 12px", fontSize: 10, letterSpacing: 0.04, textTransform: "uppercase", fontWeight: 600 }}
                >{l.label}</button>
              ))}
            </div>
            <button
              className="pill"
              onClick={restart}
              style={{ padding: "4px 10px", fontSize: 10 }}
              title="Restart the current launcher"
            >↻ restart</button>
          </Row>
        </Row>

        {/* Terminal canvas */}
        <div
          ref={containerRef}
          className="cc-terminal"
          onClick={focusTerm}
          style={{ flex: 1, minHeight: 0, background: "#0A0A0B", borderRadius: 8, padding: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}
        />

        {/* Status row */}
        <Row justify="space-between" align="center" style={{ marginTop: 8 }}>
          <Row gap={6} align="center">
            <span style={{
              width: 7, height: 7, borderRadius: 50,
              background: status === "running" ? "rgba(155,210,150,0.86)"
                        : status === "exited" ? "rgba(255,255,255,0.32)"
                        : status === "error"  ? "rgba(224,130,140,0.86)"
                        : "rgba(255,255,255,0.18)",
              boxShadow: status === "running" ? "0 0 8px rgba(155,210,150,0.5)" : "none",
            }} />
            <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)", letterSpacing: 0.06, textTransform: "uppercase" }}>
              {status === "running" ? `${launcher.cmd} · live` : status}
            </span>
          </Row>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
            click to focus · keys go straight to {launcher.cmd}
          </span>
        </Row>
        {errMsg && (
          <div style={{
            marginTop: 8, padding: "8px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 6, fontSize: 11,
            color: "rgba(255,255,255,0.78)", lineHeight: 1.5,
          }}>{errMsg}</div>
        )}
      </GlassCard>
    </div>
  );
}
