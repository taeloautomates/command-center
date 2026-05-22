/**
 * Slack briefing — fetch recent messages from a curated set of channels.
 *
 * Auth model: Slack User OAuth Token (xoxp-...). User creates a Slack app
 * at api.slack.com/apps, adds the read scopes, installs it to their workspace,
 * and pastes the token into manual.md. Tokens don't expire unless revoked.
 *
 * Why not OAuth flow inside the plugin: too much surface for a personal tool.
 * The user already has a workspace; a personal-use app token is the cleanest path.
 *
 * Scopes required:
 *   channels:history, channels:read   (public channels)
 *   groups:history,   groups:read     (private channels)
 *   im:history,       im:read         (DMs — optional)
 *   mpim:history,     mpim:read       (group DMs — optional)
 *   users:read                         (resolve user IDs to display names)
 *
 * Why explicit channel IDs (not "every channel I'm in"): a user with 20+
 * channels would burn an API call per channel per refresh. Forcing the
 * user to specify the 1-3 channels they actually care about keeps quota
 * use trivial.
 *
 * Cache: 5-min in-memory. Slack rate-limits at Tier 3 (~50 req/min) for
 * conversations.history — we use 1 call per configured channel per refresh.
 */

import { requestUrl } from "obsidian";

export type SlackMessage = {
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  text: string;
  ts: string;              // raw Slack timestamp (epoch float as string)
  ageMs: number;           // ms since posted (computed at fetch time)
};

export type SlackBriefing = {
  team: string;
  messages: SlackMessage[];       // newest first, deduped, across all configured channels
  channelsScanned: number;
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: SlackBriefing | null = null;
let cacheKey = "";               // invalidate cache when config changes

// Resolved name caches — slack user IDs and channel IDs don't change.
const userNameCache = new Map<string, string>();
const channelNameCache = new Map<string, string>();

async function slackGet(endpoint: string, token: string, params: Record<string, string>): Promise<any | null> {
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await requestUrl({
      url: `https://slack.com/api/${endpoint}?${qs}`,
      headers: { Authorization: `Bearer ${token}` },
      throw: false,
    });
    if (res.status >= 400) {
      console.warn("[command-center] Slack API HTTP error", endpoint, res.status);
      return null;
    }
    const json = res.json;
    if (!json?.ok) {
      console.warn("[command-center] Slack API error", endpoint, json?.error);
      return null;
    }
    return json;
  } catch (e) {
    console.warn("[command-center] Slack fetch failed:", endpoint, e);
    return null;
  }
}

async function getUserName(token: string, userId: string): Promise<string> {
  if (!userId) return "unknown";
  if (userNameCache.has(userId)) return userNameCache.get(userId)!;
  const j = await slackGet("users.info", token, { user: userId });
  const profile = j?.user?.profile;
  const name =
    profile?.display_name_normalized ||
    profile?.real_name_normalized ||
    j?.user?.name ||
    userId;
  userNameCache.set(userId, name);
  return name;
}

async function getChannelName(token: string, channelId: string): Promise<string> {
  if (channelNameCache.has(channelId)) return channelNameCache.get(channelId)!;
  const j = await slackGet("conversations.info", token, { channel: channelId });
  const name = j?.channel?.name || j?.channel?.name_normalized || channelId;
  channelNameCache.set(channelId, name);
  return name;
}

export async function loadSlackBriefing(
  token: string,
  channels: string[],
  lookbackHours = 24,
): Promise<SlackBriefing | null> {
  if (!token || channels.length === 0) return null;

  const key = `${token.slice(0, 12)}|${channels.join(",")}|${lookbackHours}`;
  if (cache && cacheKey === key && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  // Validate token + grab team name.
  const auth = await slackGet("auth.test", token, {});
  if (!auth) return null;
  const team = auth.team || "Slack";

  const oldest = ((Date.now() - lookbackHours * 3600 * 1000) / 1000).toFixed(0);
  const all: SlackMessage[] = [];

  for (const cid of channels) {
    const [history, channelName] = await Promise.all([
      slackGet("conversations.history", token, { channel: cid, oldest, limit: "30" }),
      getChannelName(token, cid),
    ]);
    if (!history) continue;

    const msgs: any[] = history.messages ?? [];
    for (const m of msgs) {
      if (m.subtype && m.subtype !== "thread_broadcast") continue;  // skip joins/leaves/etc
      if (!m.text || !m.user) continue;
      const userName = await getUserName(token, m.user);
      const tsMs = parseFloat(m.ts) * 1000;
      all.push({
        channelId: cid,
        channelName,
        userId: m.user,
        userName,
        text: cleanSlackText(m.text),
        ts: m.ts,
        ageMs: Date.now() - tsMs,
      });
    }
  }

  all.sort((a, b) => a.ageMs - b.ageMs);   // newest first
  cache = { team, messages: all, channelsScanned: channels.length, fetchedAt: Date.now() };
  cacheKey = key;
  return cache;
}

/** Slack-formatted text → readable plain text. Strips <@U123> mentions, <#C123|name> channel refs, <url|label>. */
function cleanSlackText(s: string): string {
  return s
    .replace(/<@([UW][A-Z0-9]+)>/g, (_, id) => `@${userNameCache.get(id) || id}`)
    .replace(/<#([CG][A-Z0-9]+)\|([^>]+)>/g, "#$2")
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** "3m", "2h", "1d" — compact age formatting. */
export function slackAge(ms: number): string {
  if (ms < 60_000) return "now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

export function clearSlackCache(): void {
  cache = null;
  cacheKey = "";
}
