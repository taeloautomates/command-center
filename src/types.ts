export type Todo = { id: string; text: string; done: boolean; tag?: string };

export type MIT = {
  title: string;
  project: string;
  est: number;
  startedAt: string;
};

export type Brick = { id: string; name: string; dur: number; glyph: string };

export type PlacedBlock = {
  id: string;
  brick: Brick;
  startMin: number;
  durMin: number;
  surface: string;
  appleUid?: string;        // Apple Calendar event uid once sync lands
  syncState?: "pending" | "synced" | "failed";
};

export type TrunkItem = {
  id: string;
  title: string;
  project?: string;
  estMin?: number;
};

export type TabId =
  | "9-to-5"
  | "Side Project"
  | "Terminal"
  | "Agents"
  | "Health"
  | "Inspired"
  | "Social";

export type HealthMode = "Resistance" | "MMA";

export type PluginState = {
  currentTab: TabId;
  focusMode: boolean;
  mit: MIT;
  timer: { totalSec: number; remainingSec: number; active: boolean; paused: boolean };
  placedBlocks: PlacedBlock[];
  healthMode: HealthMode;
};

export const DEFAULT_STATE: PluginState = {
  currentTab: "Side Project",
  focusMode: false,
  mit: {
    title: "Edit /watch tutorial — final cut pass",
    project: "youtube · @taelo_kim",
    est: 45,
    startedAt: "11:02",
  },
  timer: { totalSec: 45 * 60, remainingSec: 23 * 60 + 14, active: true, paused: false },
  placedBlocks: [],
  healthMode: "Resistance",
};
