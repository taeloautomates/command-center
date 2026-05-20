import * as React from "react";
import type { App as ObsidianApp } from "obsidian";
import { TopBar } from "./topbar";
import { MITBanner } from "./mit-banner";
import { TabSideProject } from "./tab-side-project";
import { TabNineToFive } from "./tab-nine-to-five";
// TabAgents kept in source but no longer routed (user removed from tabs).
// import { TabAgents } from "./tab-agents";
// Terminal now lives in its own Obsidian view (see src/terminal-view.tsx),
// not inside the dashboard's tab row.
import { TabHealth } from "./tab-health";
import { TabInspired } from "./tab-inspired";
import { TabSocial } from "./tab-social";
import type { PluginState, TabId, HealthMode, Todo, PlacedBlock } from "./types";
import { DEFAULT_STATE } from "./types";
import {
  loadSideProjectTodos, loadEODTodos, loadMIT,
  saveSideProjectTodos, saveEODTodos, saveMIT,
  loadTrunk, saveTrunk,
  loadBrainDump, appendBrainDump,
  isCommandCenterPath, TODOS_SIDE_PROJECT, TODOS_EOD, TRUNK_FILE, BRAINDUMP_FILE,
  BrainDumpEntry,
} from "./persistence";
import { TrunkStrip } from "./trunk";
import { useBallDrag, BallGhost, ballLabel } from "./car";
import type { TrunkItem } from "./types";
import { parseIntent } from "./voice-intent";

/** Expand `~/` paths so the Terminal tab spawns in the right cwd. */
function resolveCwd(p: string): string {
  if (!p) return process.env.HOME || "/";
  if (p.startsWith("~/")) return (process.env.HOME || "") + p.slice(1);
  if (p === "~") return process.env.HOME || "/";
  return p;
}
import { loadAgentSessions, AgentSession } from "./data-sources/agents";
import { loadTrendReport, TrendReport } from "./data-sources/trending";
import { loadQuotes, Quote } from "./data-sources/quotes";
import { loadManual, ManualState, DEFAULT_MANUAL } from "./data-sources/manual";
import { fetchICalEvents, filterByDay, ICSEvent } from "./data-sources/ical";
import { createAppleCalendarEvent, deleteAppleCalendarEvent } from "./data-sources/apple-calendar";
import { loadHNStories, NewsItem } from "./data-sources/hn";
import { loadRedditPosts, RedditPost } from "./data-sources/reddit";
import { loadTweets, Tweet } from "./data-sources/tweets";
import { loadDailyArtwork, Artwork } from "./data-sources/art";
import { loadTopSongs, Song } from "./data-sources/music";
import { loadBookmarks, Bookmark } from "./data-sources/bookmarks";

export type LiveData = {
  sessions: AgentSession[];
  trending: TrendReport | null;
  quotes: Quote[];
  manual: ManualState;
  calendarEvents: ICSEvent[];
  news: NewsItem[];
  reddit: RedditPost[];
  tweets: Tweet[];
  artwork: Artwork | null;
  songs: Song[];
  bookmarks: Bookmark[];
  loadedAt: number;
};

const EMPTY_LIVE: LiveData = {
  sessions: [], trending: null, quotes: [], manual: DEFAULT_MANUAL,
  calendarEvents: [], news: [], reddit: [], tweets: [], artwork: null,
  songs: [], bookmarks: [], loadedAt: 0,
};

type Bridge = {
  app: ObsidianApp;
  loadPluginData: () => Promise<Partial<PluginState>>;
  savePluginData: (s: PluginState) => Promise<void>;
};

export function CommandCenterApp({ bridge }: { bridge: Bridge }) {
  const [state, setState] = React.useState<PluginState>(DEFAULT_STATE);
  const [sideTodos, setSideTodos] = React.useState<Todo[]>([]);
  const [eodTodos, setEodTodos] = React.useState<Todo[]>([]);
  const [trunk, setTrunk] = React.useState<TrunkItem[]>([]);
  const [brainDump, setBrainDump] = React.useState<BrainDumpEntry[]>([]);
  const [live, setLive] = React.useState<LiveData>(EMPTY_LIVE);
  const [refreshing, setRefreshing] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  const refreshLive = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [sessions, trending, quotes, manual, news, reddit, tweets, artwork, songs, bookmarks] = await Promise.all([
        loadAgentSessions({ limit: 30 }),
        loadTrendReport(),
        loadQuotes(bridge.app),
        loadManual(bridge.app),
        loadHNStories(8),
        loadRedditPosts(7),
        loadTweets(bridge.app),
        loadDailyArtwork(),
        loadTopSongs(8),
        loadBookmarks(bridge.app),
      ]);
      // Calendar fetch depends on manual config — do it second.
      const calendarEvents = manual.calendar.icsUrl
        ? await fetchICalEvents(manual.calendar.icsUrl, manual.calendar.targetCalendar || "calendar")
        : [];
      setLive({ sessions, trending, quotes, manual, calendarEvents, news, reddit, tweets, artwork, songs, bookmarks, loadedAt: Date.now() });
    } finally {
      setRefreshing(false);
    }
  }, [bridge]);

  // Initial load — plugin data + vault MD files + external live data.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pluginData, sp, eod, mit, trunkItems, dump] = await Promise.all([
        bridge.loadPluginData(),
        loadSideProjectTodos(bridge.app),
        loadEODTodos(bridge.app),
        loadMIT(bridge.app),
        loadTrunk(bridge.app),
        loadBrainDump(bridge.app),
      ]);
      if (cancelled) return;
      // Migrate stale tab IDs that no longer exist in the TABS row.
      const removedTabs = new Set(["Agents", "Terminal"]);
      const safeTab = (pluginData.currentTab && !removedTabs.has(pluginData.currentTab))
        ? pluginData.currentTab
        : DEFAULT_STATE.currentTab;
      setState({ ...DEFAULT_STATE, ...pluginData, currentTab: safeTab, mit });
      setSideTodos(sp);
      setEodTodos(eod);
      setTrunk(trunkItems);
      setBrainDump(dump);
      setHydrated(true);
      refreshLive();
    })();
    return () => { cancelled = true; };
  }, [bridge, refreshLive]);

  // Auto-refresh live data every 60 s while the view is mounted.
  React.useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(refreshLive, 60 * 1000);
    return () => clearInterval(id);
  }, [hydrated, refreshLive]);

  // Persist plugin data on change (after hydration).
  React.useEffect(() => {
    if (!hydrated) return;
    bridge.savePluginData(state);
  }, [state, hydrated, bridge]);

  // Watch for external edits to the markdown files (user edited in another pane).
  React.useEffect(() => {
    const handler = async (file: { path: string } | null) => {
      if (!file || !isCommandCenterPath(file.path)) return;
      if (file.path === TODOS_SIDE_PROJECT) setSideTodos(await loadSideProjectTodos(bridge.app));
      else if (file.path === TODOS_EOD)     setEodTodos(await loadEODTodos(bridge.app));
      else if (file.path === TRUNK_FILE)    setTrunk(await loadTrunk(bridge.app));
      else if (file.path === BRAINDUMP_FILE) setBrainDump(await loadBrainDump(bridge.app));
    };
    const vault = (bridge.app as any).vault;
    vault.on("modify", handler);
    return () => vault.off("modify", handler);
  }, [bridge]);

  // Timer tick.
  React.useEffect(() => {
    const { active, paused } = state.timer;
    if (!active || paused) return;
    const id = setInterval(() => {
      setState((s) => ({
        ...s,
        timer: { ...s.timer, remainingSec: Math.max(0, s.timer.remainingSec - 1) },
      }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.timer.active, state.timer.paused]);

  const setTab = (currentTab: TabId) => setState((s) => ({ ...s, currentTab }));
  const setFocusMode = (focusMode: boolean) => setState((s) => ({ ...s, focusMode }));
  const setHealthMode = (healthMode: HealthMode) => setState((s) => ({ ...s, healthMode }));

  const onTogglePause = () =>
    setState((s) => ({ ...s, timer: { ...s.timer, paused: !s.timer.paused } }));
  const onAdd5 = () =>
    setState((s) => ({ ...s, timer: { ...s.timer, remainingSec: Math.min(s.timer.totalSec, s.timer.remainingSec + 5 * 60) } }));
  const onDone = () =>
    setState((s) => ({ ...s, timer: { ...s.timer, active: false, remainingSec: 0 } }));

  const toggleSideTodo = async (id: string) => {
    const next = sideTodos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setSideTodos(next);
    await saveSideProjectTodos(bridge.app, next);
  };
  const toggleEod = async (id: string) => {
    const next = eodTodos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setEodTodos(next);
    await saveEODTodos(bridge.app, next);
  };

  const onAddBlock = async (b: PlacedBlock) => {
    // 1. Render the block immediately as pending sync.
    const pending: PlacedBlock = { ...b, syncState: "pending" };
    setState((s) => ({ ...s, placedBlocks: [...s.placedBlocks, pending] }));

    // 2. Build the absolute start/end Date for today.
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const start = new Date(day.getTime() + b.startMin * 60 * 1000);
    const end = new Date(start.getTime() + b.durMin * 60 * 1000);
    const targetCalendar = live.manual.calendar.targetCalendar;

    if (!targetCalendar) {
      setState((s) => ({
        ...s,
        placedBlocks: s.placedBlocks.map((x) => x.id === b.id ? { ...x, syncState: "failed" } : x),
      }));
      return;
    }

    // 3. Fire AppleScript create. Round-trip the returned uid.
    try {
      const uid = await createAppleCalendarEvent({
        calendar: targetCalendar,
        title: b.brick.name,
        start, end,
        notes: "Time-block created from Command Center",
      });
      setState((s) => ({
        ...s,
        placedBlocks: s.placedBlocks.map((x) => x.id === b.id ? { ...x, appleUid: uid, syncState: "synced" } : x),
      }));
    } catch (err) {
      console.error("[command-center] Calendar create failed:", err);
      setState((s) => ({
        ...s,
        placedBlocks: s.placedBlocks.map((x) => x.id === b.id ? { ...x, syncState: "failed" } : x),
      }));
    }
  };

  // Trunk handlers — front seat / back of the bus mechanics.
  const promoteFromTrunk = async (id: string) => {
    const next = trunk.find((t) => t.id === id);
    if (!next) return;
    // Sink current MIT into the trunk first.
    const oldMIT: TrunkItem = {
      id: `tr${Date.now()}`,
      title: state.mit.title,
      project: state.mit.project,
      estMin: state.mit.est,
    };
    const newMIT = {
      title: next.title,
      project: next.project || state.mit.project,
      est: next.estMin ?? state.mit.est,
      startedAt: new Date().toTimeString().slice(0, 5),
    };
    // Local optimistic update — fast UI.
    setState((s) => ({
      ...s,
      mit: newMIT,
      timer: { totalSec: newMIT.est * 60, remainingSec: newMIT.est * 60, active: true, paused: false },
    }));
    const newTrunk = trunk.filter((t) => t.id !== id).concat([oldMIT]);
    setTrunk(newTrunk);
    // Persist to vault.
    await Promise.all([
      saveMIT(bridge.app, newMIT),
      saveTrunk(bridge.app, newTrunk),
    ]);
  };

  const addTrunkItem = async (title: string) => {
    const next: TrunkItem = { id: `tr${Date.now()}`, title };
    const newTrunk = [...trunk, next];
    setTrunk(newTrunk);
    await saveTrunk(bridge.app, newTrunk);
  };

  const removeTrunkItem = async (id: string) => {
    const newTrunk = trunk.filter((t) => t.id !== id);
    setTrunk(newTrunk);
    await saveTrunk(bridge.app, newTrunk);
  };

  const submitBrainDump = async (text: string) => {
    await appendBrainDump(bridge.app, text);
    setBrainDump(await loadBrainDump(bridge.app));
  };

  // Demote the MIT — push it into the trunk. Used when the user drags the
  // seat ball into the trunk. No new MIT is auto-promoted; the timer stops.
  const demoteToTrunk = async () => {
    const oldMIT: TrunkItem = {
      id: `tr${Date.now()}`,
      title: state.mit.title,
      project: state.mit.project,
      estMin: state.mit.est,
    };
    const placeholder = {
      title: "Pick your next task",
      project: "—",
      est: 25,
      startedAt: "—:—",
    };
    setState((s) => ({
      ...s,
      mit: placeholder,
      timer: { totalSec: 25 * 60, remainingSec: 25 * 60, active: false, paused: false },
    }));
    const newTrunk = [...trunk, oldMIT];
    setTrunk(newTrunk);
    await Promise.all([saveMIT(bridge.app, placeholder), saveTrunk(bridge.app, newTrunk)]);
  };

  // Voice command dispatcher. Returns a summary the button shows as a toast.
  const dispatchVoice = async (transcript: string): Promise<{ ok: boolean; summary: string }> => {
    const intent = parseIntent(transcript);
    switch (intent.kind) {
      case "place_block": {
        await onAddBlock({
          id: "b" + Math.random().toString(36).slice(2, 9),
          brick: intent.brick,
          startMin: intent.startMin,
          durMin: intent.brick.dur,
          surface: "9to5",
        });
        const t = `${String(Math.floor(intent.startMin / 60)).padStart(2, "0")}:${String(intent.startMin % 60).padStart(2, "0")}`;
        return { ok: true, summary: `Blocked ${intent.brick.name} · ${intent.brick.dur}m at ${t}` };
      }
      case "set_mit": {
        const newMIT = {
          title: intent.title,
          project: state.mit.project,
          est: state.mit.est,
          startedAt: new Date().toTimeString().slice(0, 5),
        };
        setState((s) => ({
          ...s,
          mit: newMIT,
          timer: { totalSec: newMIT.est * 60, remainingSec: newMIT.est * 60, active: true, paused: false },
        }));
        await saveMIT(bridge.app, newMIT);
        return { ok: true, summary: `Front Seat: "${intent.title}"` };
      }
      case "add_trunk": {
        await addTrunkItem(intent.title);
        return { ok: true, summary: `Trunk: "${intent.title}"` };
      }
      case "brain_dump": {
        await submitBrainDump(intent.text);
        return { ok: true, summary: `Brain dump: "${intent.text}"` };
      }
      case "timer": {
        if (intent.action === "pause") { onTogglePause(); return { ok: true, summary: "Timer paused" }; }
        if (intent.action === "resume") { onTogglePause(); return { ok: true, summary: "Timer resumed" }; }
        if (intent.action === "add5") { onAdd5(); return { ok: true, summary: "+5 min added" }; }
        if (intent.action === "done") { onDone(); return { ok: true, summary: "Task marked done" }; }
        return { ok: false, summary: "Unknown timer action" };
      }
      case "switch_tab": {
        setTab(intent.tab);
        return { ok: true, summary: `→ ${intent.tab}` };
      }
      case "open_terminal": {
        // Fire an event the plugin's main.ts handler can intercept to open the terminal view.
        window.dispatchEvent(new CustomEvent("cc-open-terminal"));
        return { ok: true, summary: "Opening Claude Code…" };
      }
      case "unknown":
      default:
        return { ok: false, summary: `Heard "${transcript}" — didn't match an intent` };
    }
  };

  // Drag-and-drop bridge: refs for hit-testing + the swap callbacks.
  const seatRef = React.useRef<HTMLDivElement | null>(null);
  const trunkRef = React.useRef<HTMLDivElement | null>(null);
  const { drag: ballDrag, startDrag: startBallDrag, hoverTarget } = useBallDrag({
    seatRef,
    trunkRef,
    onDropOnSeat: (sourceId) => { promoteFromTrunk(sourceId); },
    onDropOnTrunk: () => { demoteToTrunk(); },
  });

  const onRemoveBlock = async (id: string) => {
    const block = state.placedBlocks.find((b) => b.id === id);
    setState((s) => ({ ...s, placedBlocks: s.placedBlocks.filter((b) => b.id !== id) }));
    if (block?.appleUid) {
      try {
        await deleteAppleCalendarEvent(live.manual.calendar.targetCalendar, block.appleUid);
      } catch (err) {
        console.error("[command-center] Calendar delete failed:", err);
      }
    }
  };

  const { timer, mit, currentTab, focusMode, placedBlocks, healthMode } = state;
  const progress = timer.active
    ? Math.round(((timer.totalSec - timer.remainingSec) / timer.totalSec) * 100)
    : 0;

  return (
    <div className="cc-stage">
      <div className="cc-frame">
        <TopBar
          tab={currentTab} setTab={setTab}
          focusMode={focusMode} setFocusMode={setFocusMode}
          onRefresh={refreshLive} refreshing={refreshing}
          loadedAt={live.loadedAt}
          onVoice={dispatchVoice}
        />

        {/* Front Seat + Trunk only show on "driving" tabs — the ones where
            picking and focusing on a single MIT actually applies. */}
        {(currentTab === "9-to-5" || currentTab === "Side Project") && (
          <>
            <MITBanner
              task={mit}
              active={timer.active}
              paused={timer.paused}
              progress={progress}
              remaining={timer.remainingSec}
              total={timer.totalSec}
              onTogglePause={onTogglePause}
              onAdd5={onAdd5}
              onDone={onDone}
              seatRef={seatRef}
              isDropTarget={hoverTarget === "seat" && ballDrag?.source === "trunk"}
              onPointerDownSeat={(e) =>
                startBallDrag(
                  { id: "seat", label: ballLabel({ title: mit.title, project: mit.project }), title: mit.title, source: "seat" },
                  e,
                )
              }
            />

            <TrunkStrip
              items={trunk}
              onPromote={promoteFromTrunk}
              onAdd={addTrunkItem}
              onRemove={removeTrunkItem}
              trunkRef={trunkRef}
              isDropTarget={hoverTarget === "trunk" && ballDrag?.source === "seat"}
              onPointerDownBall={(args, e) =>
                startBallDrag({ ...args, source: "trunk" }, e)
              }
              draggingId={ballDrag?.source === "trunk" ? ballDrag.id : undefined}
            />

            <BallGhost drag={ballDrag} />
          </>
        )}

        <div key={currentTab} style={{ flex: 1, minHeight: 0, display: "flex" }}>
          {currentTab === "Side Project" && <TabSideProject todos={sideTodos} toggleTodo={toggleSideTodo} trending={live.trending} manual={live.manual} news={live.news} reddit={live.reddit} tweets={live.tweets} />}
          {currentTab === "9-to-5"       && <TabNineToFive eod={eodTodos} toggleEod={toggleEod} placedBlocks={placedBlocks} onAddBlock={onAddBlock} onRemoveBlock={onRemoveBlock} manual={live.manual} calendarEvents={live.calendarEvents} />}
          {/* Agents tab removed. Terminal lives in its own pane now — open via
              the "Open Command Center Terminal" ribbon icon or command. */}
          {currentTab === "Health"       && <TabHealth mode={healthMode} setMode={setHealthMode} />}
          {currentTab === "Inspired"     && <TabInspired quotes={live.quotes} brainDump={brainDump} onBrainDump={submitBrainDump} artwork={live.artwork} songs={live.songs} bookmarks={live.bookmarks} />}
          {currentTab === "Social"       && <TabSocial manual={live.manual} />}
        </div>
      </div>
    </div>
  );
}
