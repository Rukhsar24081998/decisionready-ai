/**
 * Capture README screenshots at a consistent 1440×900 viewport.
 * Run: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEST = path.join(ROOT, "docs", "images");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const AID = process.env.ANALYSIS_ID || "da_e80a5b9a";

fs.mkdirSync(DEST, { recursive: true });

async function shot(page, name, opts = {}) {
  const file = path.join(DEST, name);
  await page.screenshot({ path: file, type: "png", ...opts });
  const size = fs.statSync(file).size;
  console.log(`✓ ${name} (${Math.round(size / 1024)} KB)`);
}

async function scrollToText(page, text) {
  await page.evaluate((t) => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT
    );
    let node;
    while ((node = walker.nextNode())) {
      if (
        node.childNodes.length &&
        [...node.childNodes].some(
          (c) => c.nodeType === Node.TEXT_NODE && c.textContent?.includes(t)
        ) &&
        node.textContent?.includes(t)
      ) {
        const el = /** @type {HTMLElement} */ (node);
        if (el.offsetParent !== null || el.getClientRects().length) {
          el.scrollIntoView({ block: "start", behavior: "instant" });
          window.scrollBy(0, -72);
          return;
        }
      }
    }
  }, text);
  await page.waitForTimeout(400);
}

async function scrollToId(page, id) {
  await page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "instant" });
      window.scrollBy(0, -72);
    }
  }, id);
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

try {
  // 1. Landing
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "landing-page.png");

  // 2–3. Create analysis (context + upload)
  await page.goto(`${BASE}/analyses/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "candidate-context.png");

  await scrollToText(page, "Step 1 · Upload Evidence");
  // Prefer showing multiple upload cards
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.waitForTimeout(300);
  await shot(page, "upload-documents.png");

  // 4. Analysis progress — block client redirect to intelligence
  await page.route("**/analyses/*/intelligence**", (route) => {
    // Allow asset/API but block document navigations by fulfilling empty
    if (route.request().resourceType() === "document") {
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(`${BASE}/analyses/${AID}/analyzing`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Generating Decision Intelligence", {
    timeout: 15000,
  });
  // Let progress UI animate a bit
  await page.waitForTimeout(2500);
  await shot(page, "analysis-progress.png");
  await page.unroute("**/analyses/*/intelligence**");

  // 5–9. Intelligence dashboard sections
  await page.goto(`${BASE}/analyses/${AID}/intelligence`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("text=Decision Intelligence", { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, "decision-dashboard.png");

  await scrollToText(page, "Executive Hiring Profile");
  await shot(page, "candidate-profile.png");

  await scrollToText(page, "Evidence Intelligence Matrix");
  await shot(page, "evidence-matrix.png");

  await scrollToId(page, "evidence-mapping");
  // Fallback if id missing
  const hasMapping = await page.evaluate(
    () => !!document.getElementById("evidence-mapping")
  );
  if (!hasMapping) {
    await scrollToText(page, "Interactive Evidence Explorer");
  }
  await shot(page, "evidence-explorer.png");

  await scrollToId(page, "evidence-assistant-title");
  const hasCopilot = await page.evaluate(
    () => !!document.getElementById("evidence-assistant-title")
  );
  if (!hasCopilot) {
    await scrollToText(page, "AI Hiring Analyst");
  }
  // Copilot may be above matrix — ensure title visible
  await page.evaluate(() => {
    const el =
      document.getElementById("evidence-assistant-title") ||
      [...document.querySelectorAll("h2,h3")].find((n) =>
        /Hiring Analyst|Evidence Assistant|Recruiter Copilot/i.test(
          n.textContent || ""
        )
      );
    el?.scrollIntoView({ block: "start", behavior: "instant" });
    window.scrollBy(0, -72);
  });
  await page.waitForTimeout(400);
  await shot(page, "ai-hiring-analyst.png");

  // 10. Decision Brief
  await page.goto(`${BASE}/analyses/${AID}/brief`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "decision-brief.png");

  // 11. Print report — emulate print media on brief
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(500);
  await shot(page, "print-report.png");
  await page.emulateMedia({ media: "screen" });

  console.log("\nAll screenshots written to", DEST);
} catch (err) {
  console.error("Screenshot capture failed:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
