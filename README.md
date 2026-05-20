# Command Center

A personal Obsidian plugin that turns your vault into a single-screen cockpit — focus timer, time-blocks that write to Google Calendar, live news / Reddit / tweets, daily art from the Met, music, bookmark revival, and Claude Code running in a docked terminal pane.

Built for and by [@taelo_kim](https://www.youtube.com/@taelo_kim). The video tour is [here](https://www.youtube.com/@taelo_kim).

> Personal tool. I built it for myself. It might not fit your brain — fork it freely.

## What's in it

**Front Seat / Trunk** — one Most-Important-Task at a time, rendered as a labeled 3D ball nested in a racing bucket seat with a seatbelt across it. Deferred tasks live in the trunk below. Click or drag a trunk ball into the seat to promote it; the old MIT drops back into the trunk.

**Time-block stones → Google Calendar** — drag a Deep Work / Reading / Run / Instrument stone onto the timeline. The block appears striped ("blocked"), and an AppleScript bridge writes the event into Apple Calendar — which CalDAV-syncs to Google Calendar within seconds. No OAuth, no API keys.

**Live feeds (Side Project tab)**
- **News** — Hacker News top-of-day, AI stories starred ★
- **Reddit** — r/LocalLLaMA · r/MachineLearning · r/singularity · r/ChatGPT · r/OpenAI, scored and merged
- **Tweets** — hand-curated from a vault markdown file (X killed the free API; curated is the honest path)

**Inspired tab**
- **Creative Spark hero** — real public-domain artwork rotated daily from the Met Museum API
- **Quote of the Day** — daily-rotated from `command-center/quotes.md`
- **Music** — iTunes top US songs (live, no auth)
- **Bookmark Revival** — rotating slice of things you bookmarked but never revisited, from `command-center/saved.md`
- **Brain Dump** — Cmd-Enter quick-capture to a timestamped markdown log

**Other tabs**
- **9-to-5** — work kanban, calendar, EOD checklist, boundary clock counting down to end-of-workday
- **Health** — Resistance / MMA workout sessions, body-part volume tracking, macros, cardio, workout journal
- **Social** — per-platform KPIs, posting cadence grid, replies queue

**Terminal pane (separate Obsidian view)** — xterm.js + node-pty embed. Launch Claude Code, Codex, or a plain shell. Lives in its own pane so it sits next to the dashboard. Real PTY, all the TUI rendering works.

## Aesthetic

Pure monochrome on `#0A0A0B`. Apple Liquid-Glass cards. The only volumetric elements are the 3D hourglass timer, the time-block stones, the racing seat, and the MIT ball. Everything else stays flat.

## Install (manual — not on Community Plugins yet)

1. Clone into your vault:
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   git clone https://github.com/taeloautomates/command-center.git
   cd command-center
   npm install
   ```
2. Open Obsidian → Settings → Community plugins → Reload → enable **Command Center**.
3. Click the **layout-dashboard** icon in the left ribbon to open the dashboard. Click the **terminal-square** icon for the Claude Code pane.

Or via [BRAT](https://github.com/TfTHacker/obsidian42-brat):
1. Install BRAT from the Community Plugin store.
2. Add this repo: `taeloautomates/command-center`.

## Configure

The plugin auto-creates these markdown files in your vault on first run:

| File | Purpose |
|---|---|
| `command-center/mit.md` | Current Most Important Task (Front Seat). Edit the title and frontmatter to change what's buckled in. |
| `command-center/trunk.md` | Deferred tasks (Trunk balls). One per `- ` line, format `- title · project · 45m`. |
| `command-center/todos/side-project.md` | Side Project todos. Native Obsidian checkboxes. |
| `command-center/todos/eod.md` | End-of-day checklist for the 9-to-5 tab. |
| `command-center/quotes.md` | Quote of the Day pool. |
| `command-center/saved.md` | Bookmarks for the Revival card. |
| `command-center/tweets.md` | Hand-curated tweets. |
| `command-center/braindump.md` | Quick-capture log. |
| `command-center/manual.md` | YAML frontmatter for everything not yet auto-pulled (YouTube KPIs, social numbers, work kanban, calendar config, terminal cwd). |

Edit any of these in Obsidian — the dashboard reflects on the next file-modify event or 60-second refresh.

### Google Calendar setup

In `command-center/manual.md`:

```yaml
calendar:
  targetCalendar: "Calendar"      # name of the Apple Calendar to write to
  icsUrl: ""                      # paste your Google Calendar secret .ics URL here for reads
```

Get the iCal URL from Google Calendar → Settings → My calendars → click a calendar → Integrate calendar → Secret address in iCal format.

The `targetCalendar` must be a writable calendar in macOS Calendar.app — Google sub-calendars synced via CalDAV work.

### Terminal cwd

```yaml
terminal:
  cwd: "~/Desktop/your-project"
```

The Claude Code / Codex / shell launchers spawn in this directory.

## Develop

```bash
npm install
npm run dev    # esbuild --watch
# edit src/, reload Obsidian (Cmd-R) to pick up changes
```

Production build: `npm run build` → emits `main.js`.

```
src/
├── app.tsx                 # root React component + state
├── view.tsx                # Obsidian ItemView for the dashboard
├── terminal-view.tsx       # standalone Obsidian view for the terminal
├── topbar.tsx              # 5-tab top bar
├── mit-banner.tsx          # Front Seat + hourglass + focus timer banner
├── car.tsx                 # racing-seat / trunk / task-ball illustrations + drag hook
├── trunk.tsx               # the trunk strip
├── hourglass.tsx           # 3D SVG hourglass
├── time-blocks.tsx         # stone palette + drag hook
├── brain-dump.tsx          # Inspired-tab brain-dump card
├── tab-*.tsx               # per-tab body components
├── ui.tsx                  # shared primitives (GlassCard, Row, Col, etc.)
├── icons.tsx               # monochrome line icons
├── persistence.ts          # vault-markdown read/write for todos / MIT / trunk / brain dump
├── types.ts                # plugin state types
└── data-sources/
    ├── apple-calendar.ts   # AppleScript bridge for time-block writes
    ├── ical.ts             # .ics parser for read-only calendar
    ├── hn.ts               # Hacker News Algolia API
    ├── reddit.ts           # multi-subreddit JSON
    ├── tweets.ts           # vault-markdown tweet parser
    ├── art.ts              # Met Museum artwork rotation
    ├── music.ts            # iTunes top-songs RSS
    ├── quotes.ts           # vault-markdown quotes
    ├── bookmarks.ts        # vault-markdown bookmarks with daily rotation
    ├── manual.ts           # YAML manual.md parser
    ├── agents.ts           # Claude Code session transcripts (unused after Agents tab removal, kept for future)
    └── fs-helpers.ts       # shared fs/path helpers
```

## Platform notes

- **macOS only** for the Calendar bridge and the in-plugin Terminal (AppleScript + node-pty native binaries are macOS-built). The rest of the dashboard runs cross-platform.
- **Apple Silicon and Intel** prebuilds for node-pty are included.
- On first run, macOS will prompt for Calendar permission when the first time-block is dropped — approve once, never asked again.

## Credit

The idea for running Claude Code natively inside an Obsidian vault came from [Cole Medin's](https://www.youtube.com/@ColeMedinAI) video on Obsidian vault structure for AI agents — go subscribe to him, he has the best take on this.

## License

MIT. See [LICENSE](LICENSE).

---

*Built in 2026-05. Issues and PRs welcome but expect a slow merge rate — this is a one-person hobby project.*
