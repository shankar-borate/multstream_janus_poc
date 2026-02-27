import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const artifactsDir = join(root, "artifacts");
const reportJsonPath = join(artifactsDir, "test-results", "results.json");
const datasetPath = join(artifactsDir, "effective-dataset.json");
const screenshotDir = join(artifactsDir, "screenshots");
const summaryPath = join(artifactsDir, "run-summary.md");

function collectSpecs(suites, out = [], parentTitle = "") {
  for (const suite of suites || []) {
    const suiteTitle = [parentTitle, suite.title].filter(Boolean).join(" > ");

    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const lastResult = (t.results || [])[t.results.length - 1] || {};
        out.push({
          title: [suiteTitle, spec.title].filter(Boolean).join(" > "),
          status: t.outcome || lastResult.status || "unknown",
          durationMs: Number(lastResult.duration || 0)
        });
      }
    }

    collectSpecs(suite.suites || [], out, suiteTitle);
  }
  return out;
}

const generatedAt = new Date().toISOString();
const dataset = existsSync(datasetPath) ? JSON.parse(readFileSync(datasetPath, "utf-8")) : null;
const reportJson = existsSync(reportJsonPath) ? JSON.parse(readFileSync(reportJsonPath, "utf-8")) : null;
const specs = reportJson ? collectSpecs(reportJson.suites || []) : [];
const stats = reportJson?.stats || null;
const screenshots = existsSync(screenshotDir)
  ? readdirSync(screenshotDir).filter((f) => f.toLowerCase().endsWith(".png"))
  : [];

const statusLine = stats
  ? `expected=${stats.expected}, unexpected=${stats.unexpected}, flaky=${stats.flaky}, skipped=${stats.skipped}`
  : "No Playwright JSON results found.";

const lines = [];
lines.push("# Positive Video Session Run Summary");
lines.push("");
lines.push(`- GeneratedAt: ${generatedAt}`);
if (dataset?.runId) lines.push(`- RunId: ${dataset.runId}`);
if (dataset?.roomId) lines.push(`- RoomId: ${dataset.roomId}`);
lines.push(`- ResultStats: ${statusLine}`);
lines.push("");
lines.push("## Dataset Used");
lines.push("```json");
lines.push(JSON.stringify(dataset, null, 2));
lines.push("```");
lines.push("");
lines.push("## Test Cases");
if (specs.length === 0) {
  lines.push("- No tests were discovered in JSON output.");
} else {
  for (const spec of specs) {
    lines.push(`- ${spec.status.toUpperCase()} | ${spec.title} | ${spec.durationMs} ms`);
  }
}
lines.push("");
lines.push("## Screenshot Files");
if (screenshots.length === 0) {
  lines.push("- No screenshots found.");
} else {
  for (const file of screenshots) {
    lines.push(`- artifacts/screenshots/${file}`);
  }
}
lines.push("");
lines.push("## Report Paths");
lines.push("- artifacts/test-results/results.json");
lines.push("- artifacts/playwright-report/index.html");
lines.push(`- artifacts/run-summary.md`);

writeFileSync(summaryPath, lines.join("\n"), "utf-8");
console.log(`Summary written: ${summaryPath}`);
