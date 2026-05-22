#!/usr/bin/env node
/**
 * postinstall — make node-pty work inside Obsidian.
 *
 * node-pty 1.1.0 ships prebuilds for a fixed set of Electron versions.
 * Obsidian 1.12+ uses Electron 39, which isn't on that list. The result
 * is "node-pty unavailable" inside the Terminal pane.
 *
 * This script:
 *   1. Sets +x on every prebuilt spawn-helper (in case the npm extraction stripped it).
 *   2. Detects the installed Obsidian.app's bundled Electron version (macOS).
 *   3. Runs @electron/rebuild against that version so node-pty's pty.node
 *      matches Obsidian's Node ABI.
 *
 * Failure is non-fatal — the rest of the plugin works without the terminal.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function step(msg) { console.log(`[postinstall] ${msg}`); }
function warn(msg) { console.warn(`[postinstall] ⚠️  ${msg}`); }

// 1. spawn-helper +x
try {
  const prebuilds = path.join(ROOT, "node_modules/node-pty/prebuilds");
  if (fs.existsSync(prebuilds)) {
    for (const dir of fs.readdirSync(prebuilds)) {
      const helper = path.join(prebuilds, dir, "spawn-helper");
      if (fs.existsSync(helper)) {
        try { fs.chmodSync(helper, 0o755); } catch {}
      }
    }
    step("spawn-helper +x set on all prebuilds");
  }
} catch (e) {
  warn(`spawn-helper chmod failed: ${e.message}`);
}

// 2. Detect Obsidian's Electron version (macOS only).
function detectElectronVersion() {
  if (process.platform !== "darwin") return null;
  const plist = "/Applications/Obsidian.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/Info.plist";
  if (!fs.existsSync(plist)) return null;
  try {
    const out = execSync(`defaults read "${plist}" CFBundleVersion`, { encoding: "utf8" }).trim();
    if (/^\d+\.\d+\.\d+$/.test(out)) return out;
  } catch {}
  return null;
}

const electronVer = detectElectronVersion() || "39.8.3";   // fallback to known-good
step(`targeting Electron ${electronVer}`);

// 3. Rebuild node-pty against that ABI.
//    Skip if @electron/rebuild isn't installed yet (first install order matters).
try {
  require.resolve("@electron/rebuild");
} catch {
  warn("@electron/rebuild not available — skipping native rebuild. Terminal pane may not work.");
  process.exit(0);
}

try {
  step(`rebuilding node-pty against Electron ${electronVer} (this can take a minute)…`);
  execSync(
    `npx @electron/rebuild -v ${electronVer} -m . -w node-pty --arch=${process.arch}`,
    { cwd: ROOT, stdio: "inherit" },
  );
  step("node-pty rebuilt for Obsidian's Electron — Terminal pane should work after reload.");
} catch (e) {
  warn(`rebuild failed: ${e.message}`);
  warn("The Terminal pane will show a load error. Run this manually to retry:");
  warn(`  npx @electron/rebuild -v ${electronVer} -m . -w node-pty`);
}
