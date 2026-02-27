# Isolated Positive Video Session E2E

This folder contains a standalone Playwright harness for **one positive video calling session** against:

- `https://beta.videocx.io/poc/mstream/call.html`

It does not modify or depend on project source files under `src/`.

## Dataset

Template dataset:

- `data/positive-call.dataset.json`

Runtime dataset used in each run:

- `artifacts/effective-dataset.json`

## What the test validates

- Agent and customer can both join the same room.
- Both sessions emit `VCX_JOINED=true`.
- Both sessions reach `VCX_PARTICIPANTS=2`.
- Screenshots are captured for both participants.
- Uses explicit fake capture files (`--use-file-for-fake-video-capture` and `--use-file-for-fake-audio-capture`), auto-generated under `artifacts/fake-media`.

## Run

```powershell
cd qa/e2e-video-positive
npm install
npx playwright test tests/positive-video-session.spec.js
node scripts/write-run-summary.mjs
```

## Artifacts

- JSON results: `artifacts/test-results/results.json`
- HTML report: `artifacts/playwright-report/index.html`
- Screenshots: `artifacts/screenshots/*.png`
- Human-readable summary: `artifacts/run-summary.md`
