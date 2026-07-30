// Rasterizes media/icon.svg to a 256x256 PNG marketplace icon using Playwright's
// isolated Chromium (does not touch any system browser).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "media", "icon.svg"), "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });
await page.setContent(
  `<!DOCTYPE html><html><body style="margin:0;padding:0">${svg}</body></html>`,
  { waitUntil: "load" },
);
const el = await page.$("svg");
await el.screenshot({ path: join(root, "media", "icon.png"), omitBackground: true });
await browser.close();
console.log("wrote media/icon.png");
