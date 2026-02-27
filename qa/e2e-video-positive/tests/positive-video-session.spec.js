const fs = require("node:fs");
const path = require("node:path");
const { test, expect, chromium } = require("@playwright/test");

const rootDir = path.resolve(__dirname, "..");
const artifactsDir = path.join(rootDir, "artifacts");
const screenshotDir = path.join(artifactsDir, "screenshots");
const logsDir = path.join(artifactsDir, "logs");
const effectiveDatasetPath = path.join(artifactsDir, "effective-dataset.json");
const fakeMediaDir = path.join(artifactsDir, "fake-media");
const fakeVideoPath = path.join(fakeMediaDir, "fake-video.y4m");
const fakeAudioPath = path.join(fakeMediaDir, "fake-audio.wav");

const templateDatasetPath = path.join(rootDir, "data", "positive-call.dataset.json");
const templateDataset = JSON.parse(fs.readFileSync(templateDatasetPath, "utf-8"));
const browserIdentity = {
  locale: "en-US",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  extraHTTPHeaders: {
    "Accept-Language": "en-US,en;q=0.9"
  }
};

function chromeArgPath(filePath) {
  return path.resolve(filePath).replace(/\\/g, "/");
}

function ensureFakeVideoY4M(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) return;
  const width = 160;
  const height = 120;
  const fps = 20;
  const frames = 400;
  const yPlaneSize = width * height;
  const uvPlaneSize = (width / 2) * (height / 2);
  const frameBytes = Buffer.alloc(yPlaneSize + uvPlaneSize * 2);
  frameBytes.fill(16, 0, yPlaneSize);
  frameBytes.fill(128, yPlaneSize);

  const chunks = [Buffer.from(`YUV4MPEG2 W${width} H${height} F${fps}:1 Ip A1:1 C420jpeg\n`, "ascii")];
  for (let i = 0; i < frames; i++) {
    chunks.push(Buffer.from("FRAME\n", "ascii"));
    chunks.push(frameBytes);
  }
  fs.writeFileSync(filePath, Buffer.concat(chunks));
}

function ensureFakeAudioWav(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) return;
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const durationSeconds = 30;
  const sampleCount = sampleRate * durationSeconds;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = sampleCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  let offset = 0;
  buffer.write("RIFF", offset, "ascii"); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write("WAVE", offset, "ascii"); offset += 4;
  buffer.write("fmt ", offset, "ascii"); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(channels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, offset); offset += 4;
  buffer.writeUInt16LE(channels * bytesPerSample, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buffer.write("data", offset, "ascii"); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  const amplitude = 0.2 * 32767;
  const frequency = 440;
  for (let i = 0; i < sampleCount; i++) {
    const sample = Math.round(amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function ensureFakeMediaFiles() {
  fs.mkdirSync(fakeMediaDir, { recursive: true });
  ensureFakeVideoY4M(fakeVideoPath);
  ensureFakeAudioWav(fakeAudioPath);
  return { videoPath: fakeVideoPath, audioPath: fakeAudioPath };
}

async function launchParticipantContext(fakeMedia) {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${chromeArgPath(fakeMedia.videoPath)}`,
      `--use-file-for-fake-audio-capture=${chromeArgPath(fakeMedia.audioPath)}`,
      "--autoplay-policy=no-user-gesture-required"
    ]
  });

  const context = await browser.newContext({
    permissions: ["camera", "microphone"],
    ignoreHTTPSErrors: true,
    ...browserIdentity
  });
  return { browser, context };
}

function buildRunDataset() {
  const stamp = String(Date.now());
  const roomSuffix = stamp.slice(-6);
  const roomId = `${templateDataset.roomIdPrefix}${roomSuffix}`;

  const participants = templateDataset.participants.map((p, idx) => ({
    ...p,
    name: `${p.name}-${roomSuffix}`,
    participantId: Number(`${p.participantId}${idx + 1}`)
  }));

  return {
    ...templateDataset,
    roomId,
    runId: `positive-${roomSuffix}`,
    participants
  };
}

function attachConsoleCollector(page, out) {
  page.on("console", (msg) => out.push(msg.text()));
}

async function joinFromCallPage(page, participant, runDataset) {
  await page.goto(runDataset.baseUrl, { waitUntil: "domcontentloaded" });

  await page.locator("#roomId").fill(runDataset.roomId);
  await page.locator("#name").fill(participant.name);
  await page.locator("#participantId").fill(String(participant.participantId));
  await page.locator("#userType").selectOption(participant.userType);
  await page.getByRole("button", { name: "Join Call" }).click();

  await expect(page.locator("#callFrame")).toBeVisible();

  const frame = page.frameLocator("#callFrame");
  await expect(frame.locator("#btnMute")).toBeEnabled({ timeout: runDataset.timeouts.joinReadyMs });
  await expect(frame.locator("#btnLeave")).toBeEnabled({ timeout: runDataset.timeouts.joinReadyMs });
}

test("positive video call session between agent and customer", async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
  const fakeMedia = ensureFakeMediaFiles();

  const runDataset = buildRunDataset();
  fs.writeFileSync(effectiveDatasetPath, JSON.stringify(runDataset, null, 2), "utf-8");

  const agentLogs = [];
  const customerLogs = [];

  const agentRuntime = await launchParticipantContext(fakeMedia);
  const customerRuntime = await launchParticipantContext(fakeMedia);
  const agentContext = agentRuntime.context;
  const customerContext = customerRuntime.context;

  const agentPage = await agentContext.newPage();
  const customerPage = await customerContext.newPage();
  attachConsoleCollector(agentPage, agentLogs);
  attachConsoleCollector(customerPage, customerLogs);

  try {
    await joinFromCallPage(agentPage, runDataset.participants[0], runDataset);
    await joinFromCallPage(customerPage, runDataset.participants[1], runDataset);

    await expect
      .poll(
        () => agentLogs.some((l) => l.includes(runDataset.expectations.joinSignal)),
        { timeout: runDataset.timeouts.joinSignalMs }
      )
      .toBeTruthy();
    await expect
      .poll(
        () => customerLogs.some((l) => l.includes(runDataset.expectations.joinSignal)),
        { timeout: runDataset.timeouts.joinSignalMs }
      )
      .toBeTruthy();

    const screenStamp = new Date().toISOString().replace(/[:.]/g, "-");
    await agentPage.screenshot({
      path: path.join(screenshotDir, `positive-agent-${runDataset.roomId}-${screenStamp}.png`),
      fullPage: true
    });
    await customerPage.screenshot({
      path: path.join(screenshotDir, `positive-customer-${runDataset.roomId}-${screenStamp}.png`),
      fullPage: true
    });

    const rosterLine = `VCX_ROSTER_PARTICIPANTS=${runDataset.expectations.minParticipants}`;
    const renderedLine = `VCX_PARTICIPANTS=${runDataset.expectations.minParticipants}`;
    await expect
      .poll(
        () => agentLogs.some((l) => l.includes(rosterLine) || l.includes(renderedLine)),
        { timeout: runDataset.timeouts.participantRenderMs }
      )
      .toBeTruthy();
    await expect
      .poll(
        () => customerLogs.some((l) => l.includes(rosterLine) || l.includes(renderedLine)),
        { timeout: runDataset.timeouts.participantRenderMs }
      )
      .toBeTruthy();
  } finally {
    fs.writeFileSync(
      path.join(logsDir, `agent-console-${runDataset.roomId}.log`),
      agentLogs.join("\n"),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(logsDir, `customer-console-${runDataset.roomId}.log`),
      customerLogs.join("\n"),
      "utf-8"
    );
    await agentContext.close();
    await customerContext.close();
    await agentRuntime.browser.close();
    await customerRuntime.browser.close();
  }
});
