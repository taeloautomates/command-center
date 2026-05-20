import { Plugin, WorkspaceLeaf } from "obsidian";
import { CommandCenterView, COMMAND_CENTER_VIEW } from "./src/view";
import { CommandCenterTerminalView, COMMAND_CENTER_TERMINAL_VIEW } from "./src/terminal-view";
// xterm CSS injected once when either view opens — kept here so both views
// share the same single <style> element.
// @ts-ignore  text-loader returns a string
import xtermCss from "xterm/css/xterm.css";

function ensureXtermStyles() {
  if (document.getElementById("cc-xterm-styles")) return;
  const el = document.createElement("style");
  el.id = "cc-xterm-styles";
  el.textContent = xtermCss as string;
  document.head.appendChild(el);
}

export default class CommandCenterPlugin extends Plugin {
  async onload() {
    ensureXtermStyles();

    // Dashboard view
    this.registerView(COMMAND_CENTER_VIEW, (leaf) => new CommandCenterView(leaf, this));
    // Terminal view — separate pane, splittable, pinnable
    this.registerView(COMMAND_CENTER_TERMINAL_VIEW, (leaf) => new CommandCenterTerminalView(leaf, this));

    // Ribbon icons
    this.addRibbonIcon("layout-dashboard", "Open Command Center", () => {
      this.activateDashboard();
    });
    this.addRibbonIcon("terminal-square", "Open Command Center · Terminal", () => {
      this.activateTerminal();
    });

    // Command palette
    this.addCommand({
      id: "open-command-center",
      name: "Open Command Center",
      callback: () => this.activateDashboard(),
    });
    this.addCommand({
      id: "open-command-center-terminal",
      name: "Open Command Center · Terminal (Claude Code)",
      callback: () => this.activateTerminal(),
    });
  }

  async onunload() {
    // Obsidian handles leaf cleanup; views unmount React in their onClose.
  }

  async activateDashboard() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(COMMAND_CENTER_VIEW);
    let leaf: WorkspaceLeaf | null;
    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: COMMAND_CENTER_VIEW, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  /**
   * Open the terminal in its own pane. If the dashboard is already open,
   * split horizontally below it so both are visible. Otherwise just open
   * in a new tab. If a terminal pane already exists, reveal it.
   */
  async activateTerminal() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(COMMAND_CENTER_TERMINAL_VIEW);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    let leaf: WorkspaceLeaf;
    const dashboards = workspace.getLeavesOfType(COMMAND_CENTER_VIEW);
    if (dashboards.length > 0) {
      // Split horizontally so terminal sits below the dashboard
      // (Chase-AI / Cursor docked-terminal pattern).
      leaf = workspace.createLeafBySplit(dashboards[0], "horizontal", false);
    } else {
      leaf = workspace.getLeaf("tab");
    }
    await leaf.setViewState({ type: COMMAND_CENTER_TERMINAL_VIEW, active: true });
    workspace.revealLeaf(leaf);
  }
}
