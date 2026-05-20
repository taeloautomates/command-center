import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { CommandCenterApp } from "./app";
import type { PluginState } from "./types";
import type CommandCenterPlugin from "../main";

export const COMMAND_CENTER_VIEW = "command-center-view";

export class CommandCenterView extends ItemView {
  plugin: CommandCenterPlugin;
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: CommandCenterPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return COMMAND_CENTER_VIEW; }
  getDisplayText() { return "Command Center"; }
  getIcon() { return "layout-dashboard"; }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("cc-root");

    this.root = createRoot(container);
    this.root.render(
      <React.StrictMode>
        <CommandCenterApp bridge={{
          app: this.app,
          loadPluginData: async () => (await this.plugin.loadData()) as Partial<PluginState> ?? {},
          savePluginData: async (s: PluginState) => { await this.plugin.saveData(s); },
        }} />
      </React.StrictMode>
    );
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
}
