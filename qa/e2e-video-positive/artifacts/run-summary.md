# Positive Video Session Run Summary

- GeneratedAt: 2026-02-27T08:44:13.683Z
- RunId: positive-492005
- RoomId: 920492005
- ResultStats: expected=1, unexpected=0, flaky=0, skipped=0

## Dataset Used
```json
{
  "baseUrl": "https://beta.videocx.io/poc/mstream/call.html",
  "roomIdPrefix": "920",
  "participants": [
    {
      "name": "AutoAgent-492005",
      "participantId": 920011,
      "userType": "agent"
    },
    {
      "name": "AutoCustomer-492005",
      "participantId": 920022,
      "userType": "customer"
    }
  ],
  "expectations": {
    "joinSignal": "VCX_JOINED=true",
    "minParticipants": 2
  },
  "timeouts": {
    "joinReadyMs": 90000,
    "joinSignalMs": 120000,
    "participantRenderMs": 120000
  },
  "roomId": "920492005",
  "runId": "positive-492005"
}
```

## Test Cases
- PASSED | positive-video-session.spec.js > positive video call session between agent and customer | 11367 ms

## Screenshot Files
- artifacts/screenshots/positive-agent-920040026-2026-02-27T07-40-46-687Z.png
- artifacts/screenshots/positive-agent-920492005-2026-02-27T08-21-39-227Z.png
- artifacts/screenshots/positive-agent-920967531-2026-02-27T07-06-14-196Z.png
- artifacts/screenshots/positive-customer-920040026-2026-02-27T07-40-46-687Z.png
- artifacts/screenshots/positive-customer-920492005-2026-02-27T08-21-39-227Z.png
- artifacts/screenshots/positive-customer-920967531-2026-02-27T07-06-14-196Z.png

## Report Paths
- artifacts/test-results/results.json
- artifacts/playwright-report/index.html
- artifacts/run-summary.md