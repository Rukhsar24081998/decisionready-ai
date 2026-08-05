/**
 * End-to-end CASE_STUDY screenshot capture with Aarav Mehta mock package.
 * Viewport: 1440×900, light theme, high-DPI PNGs.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/capture-case-study-screenshots.mjs
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEST = path.join(ROOT, "docs", "images");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const DOCS =
  process.env.DOCS_DIR || "/tmp/aarav-hiring-package";

const FILES = {
  jd: path.join(DOCS, "candidateA_JD.pdf"),
  resume: path.join(DOCS, "Candidate1_AaravMehta_Resume.pdf"),
  notes: path.join(DOCS, "Candidate1_AaravMehta_HR_Interview_Summary.pdf"),
  scorecard: path.join(DOCS, "Candidate1_AaravMehta_Interview_Scorecard.pdf"),
  hm: path.join(DOCS, "Candidate1_AaravMehta_Hiring_Manager_Notes.pdf"),
};

for (const [key, filePath] of Object.entries(FILES)) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing document (${key}): ${filePath}`);
    process.exit(1);
  }
}

fs.mkdirSync(DEST, { recursive: true });

async function shot(page, name, opts = {}) {
  const file = path.join(DEST, name);
  await page.screenshot({
    path: file,
    type: "png",
    animations: "disabled",
    ...opts,
  });
  const size = fs.statSync(file).size;
  console.log(`✓ ${name} (${Math.round(size / 1024)} KB)`);
}

async function fillContext(page) {
  await page.fill("#decision-context-candidate-name", "Aarav Mehta");
  await page.fill(
    "#decision-context-applied-role",
    "AI Recruiting Product Builder"
  );
  await page.fill("#decision-context-department", "Product");
  await page.fill("#decision-context-hiring-manager", "Hiring Panel");
  await page.selectOption("#decision-context-hiring-stage", "Final Interview");
}

async function uploadAll(page) {
  const slots = [
    ["job-description", FILES.jd],
    ["resume", FILES.resume],
    ["interview-notes", FILES.notes],
    ["scorecards", FILES.scorecard],
    ["hiring-manager-notes", FILES.hm],
  ];

  for (const [slotId, filePath] of slots) {
    const input = page.locator(`input[name="upload-${slotId}"]`);
    await input.setInputFiles(filePath);
    await page.waitForTimeout(350);
  }
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
          window.scrollBy(0, -80);
          return;
        }
      }
    }
  }, text);
  await page.waitForTimeout(450);
}

async function scrollToId(page, id) {
  await page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "instant" });
      window.scrollBy(0, -80);
    }
  }, id);
  await page.waitForTimeout(450);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "light",
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.setDefaultTimeout(120_000);

let analysisId = null;

try {
  console.log(`Capturing against ${BASE}`);

  // ── Figure 1: Landing ──────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "landing-page.png", { fullPage: false });

  // ── Figure 2–3: Context + Upload ───────────────────────────────────
  await page.goto(`${BASE}/analyses/new`, { waitUntil: "networkidle" });
  await page.waitForSelector("#decision-context-candidate-name");
  await fillContext(page);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "candidate-context.png");

  await uploadAll(page);
  // Wait until all five success states are visible
  await page.waitForFunction(() => {
    const names = [
      "candidateA_JD",
      "Candidate1_AaravMehta_Resume",
      "Candidate1_AaravMehta_HR_Interview_Summary",
      "Candidate1_AaravMehta_Interview_Scorecard",
      "Candidate1_AaravMehta_Hiring_Manager_Notes",
    ];
    const body = document.body.innerText;
    return names.every((n) => body.includes(n));
  });
  await page.waitForTimeout(500);
  await scrollToText(page, "Step 1 · Upload Evidence");
  await page.evaluate(() => window.scrollBy(0, 40));
  await page.waitForTimeout(300);
  await shot(page, "upload-documents.png");

  // ── Submit analysis, capture progress (Figure 4) ───────────────────
  // Block navigation away from analyzing so we can screenshot mid-pipeline.
  await page.route("**/analyses/*/intelligence**", (route) => {
    if (route.request().resourceType() === "document") {
      return route.abort();
    }
    return route.continue();
  });

  const generateBtn = page.getByRole("button", {
    name: /Generate Decision Intelligence|Generate Intelligence|Generate/i,
  });
  await generateBtn.first().scrollIntoViewIfNeeded();
  await generateBtn.first().click();

  await page.waitForURL(/\/analyses\/[^/]+\/analyzing/, { timeout: 300_000 });
  analysisId = page.url().match(/\/analyses\/([^/]+)\/analyzing/)?.[1];
  console.log(`Analysis ID: ${analysisId}`);

  await page.waitForSelector("text=Generating Decision Intelligence", {
    timeout: 30_000,
  });
  // Let staged progress animate into a mid/late state
  await page.waitForTimeout(3200);
  await shot(page, "analysis-progress.png");
  await page.unroute("**/analyses/*/intelligence**");

  // ── Intelligence surfaces (Figures 5–9) ────────────────────────────
  await page.goto(`${BASE}/analyses/${analysisId}/intelligence`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("text=Decision Intelligence", { timeout: 60_000 });
  await page.waitForSelector("text=Aarav Mehta", { timeout: 60_000 });
  await page.waitForTimeout(1200);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await shot(page, "decision-dashboard.png");

  await scrollToText(page, "Executive Hiring Profile");
  await page.waitForTimeout(300);
  await shot(page, "candidate-profile.png");

  await scrollToText(page, "Evidence Intelligence Matrix");
  await page.waitForTimeout(300);
  await shot(page, "evidence-matrix.png");

  // Evidence Explorer — open a competency with citations
  await scrollToId(page, "evidence-mapping");
  const hasMapping = await page.evaluate(
    () => !!document.getElementById("evidence-mapping")
  );
  if (!hasMapping) {
    await scrollToText(page, "Interactive Evidence Explorer");
  }

  // Prefer Product Discovery; otherwise first expandable competency button
  const productDiscovery = page
    .locator('button[aria-expanded="false"]')
    .filter({ hasText: /Product Discovery/i });
  if (await productDiscovery.count()) {
    await productDiscovery.first().click();
  } else {
    const anyCompetency = page.locator('button[aria-expanded="false"]').first();
    if (await anyCompetency.count()) {
      await anyCompetency.click();
    }
  }
  await page.waitForTimeout(700);
  await shot(page, "evidence-explorer.png");

  // AI Hiring Analyst — ask grounded question
  await scrollToId(page, "evidence-assistant-title");
  const hasCopilot = await page.evaluate(
    () => !!document.getElementById("evidence-assistant-title")
  );
  if (!hasCopilot) {
    await scrollToText(page, "AI Hiring Analyst");
  }

  const question =
    "What evidence supports Aarav's Product Discovery skills?";
  const input = page.getByPlaceholder(/Ask about evidence/i);
  await input.fill(question);
  await page.keyboard.press("Enter");

  // Wait for grounded citations from this specific ask
  await page.waitForSelector("text=Product Discovery: 5/5", {
    timeout: 180_000,
  });
  await page.waitForTimeout(1200);
  await scrollToId(page, "evidence-assistant-title");
  if (!(await page.evaluate(() => !!document.getElementById("evidence-assistant-title")))) {
    await scrollToText(page, "AI Hiring Analyst");
  }
  await page.waitForTimeout(400);
  await shot(page, "ai-hiring-analyst.png");

  // ── Figure 10: Decision Brief ─────────────────────────────────────
  await page.goto(`${BASE}/analyses/${analysisId}/brief`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "decision-brief.png", { fullPage: true });

  // Also refresh print preview asset used in docs/screenshots.md
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);
  await shot(page, "print-report.png", { fullPage: true });
  await page.emulateMedia({ media: "screen" });

  console.log("\nAll CASE_STUDY screenshots written to", DEST);
  console.log("ANALYSIS_ID=" + analysisId);
} catch (err) {
  console.error("Screenshot capture failed:", err);
  if (analysisId) console.error("Partial ANALYSIS_ID=" + analysisId);
  process.exitCode = 1;
} finally {
  await browser.close();
}
