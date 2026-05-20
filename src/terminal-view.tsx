import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { TabTerminal } from "./tab-terminal";
import { loadManual } from "./data-sources/manual";
import type CommandCenterPlugin from "../main";

export const COMMAND_CENTER_TERMINAL_VIEW = "command-center-terminal-view";

/**
 * Standalone Obsidian view that hosts the Terminal (xterm + node-pty).
 * Lives in its own pane — open it via the ribbon icon or command palette,
 * then split / move / pin like any other Obsidian view. The dashboard pane
 * stays independent, so the user can see both at once.
 */
export class CommandCenterTerminalView extends ItemView {
  plugin: CommandCenterPlugin;
  root: Root | null = null;
  cwd: string = "";

  constructor(leaf: WorkspaceLeaf, plugin: CommandCenterPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return COMMAND_CENTER_TERMINAL_VIEW; }
  getDisplayText() { return "Claude Code"; }
  getIcon() { return "terminal-square"; }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("cc-root");
    container.addClass("cc-terminal-standalone");

    // Pull the cwd from manual.md frontmatter (terminal.cwd). Falls back
    // gracefully to home dir if unset.
    let cwd = "";
    try {
      const manual = await loadManual(this.app);
      cwd = manual.terminal?.cwd ?? "";
    } catch {}
    if (!cwd) cwd = "~/Desktop/Content engine";
    // Expand ~/ relative paths.
    if (cwd.startsWith("~/")) cwd = (process.env.HOME || "") + cwd.slice(1);
    else if (cwd === "~") cwd = process.env.HOME || "/";
    this.cwd = cwd;

    this.root = createRoot(container);
    this.root.render(
      <React.StrictMode>
        <TabTerminal cwd={this.cwd} />
      </React.StrictMode>
    );
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
}
