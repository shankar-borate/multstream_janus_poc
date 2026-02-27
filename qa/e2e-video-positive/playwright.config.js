const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const artifactsDir = path.join(__dirname, "artifacts");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 180000,
  expect: {
    timeout: 45000
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: path.join(artifactsDir, "playwright-report"),
        open: "never"
      }
    ],
    [
      "json",
      {
        outputFile: path.join(artifactsDir, "test-results", "results.json")
      }
    ]
  ],
  outputDir: path.join(artifactsDir, "test-results", "raw"),
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    locale: "en-US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9"
    },
    actionTimeout: 15000,
    navigationTimeout: 45000,
    trace: "retain-on-failure",
    video: "off",
    channel: "msedge",
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--autoplay-policy=no-user-gesture-required"
      ]
    }
  }
});
