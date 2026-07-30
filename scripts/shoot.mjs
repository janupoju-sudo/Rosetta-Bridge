// Screenshots every generated preview page with Playwright's isolated Chromium.
// Does not touch any other browser on the system.
import { chromium } from "playwright";
import { readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const previewDir = join(root, ".preview");
const shotsDir = join(previewDir, "shots");
mkdirSync(shotsDir, { recursive: true });

const pages = readdirSync(previewDir).filter((f) => f.endsWith(".html"));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 340, height: 720 },
  deviceScaleFactor: 2,
});

for (const file of pages) {
  const page = await context.newPage();
  await page.goto(`file://${join(previewDir, file)}`, { waitUntil: "load" });
  await page.waitForTimeout(120); // let the driver's synchronous DOM settle
  const name = file.replace(/\.html$/, "");
  await page.screenshot({ path: join(shotsDir, `${name}.png`), fullPage: true });
  await page.close();
  console.log(`shot: ${name}.png`);
}

await browser.close();
