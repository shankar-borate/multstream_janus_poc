type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const APP_CONFIG = {
  logging: {
    level: "warn" as LogLevel
  },
  janus: {
    initDebug: "warn" as "all" | "warn" | "error" | "none"
  },
  http: {
    defaultTimeoutMs: 15000
  },
  vcx: {
    imsBaseUrl: "https://localhost.beta.videocx.io",
    clientId: "101",
    defaultJanusServer: "wss://localhost.beta.videocx.io/mstream_janus",
    defaultDisplayName: "Guest"
  },
  videoroom: {
    maxPublishers: 10
  },
  media: {
    bitrateBps: 250000,
    bitrateCap: true,
    maxFramerate: 15,
    minBitrateBps: 32000,
    maxBitrateBps: 1500000,
    minFramerate: 5,
    maxFramerateCap: 30
  },
  call: {
    reconnectDelayMs: 800,
    participantSyncIntervalMs: 8000,
    participantSyncCooldownMs: 2500
  },
  ui: {
    remoteFallbackRefreshMs: 2500
  },
  recording: {
    folderPath: "/opt/efs-janus-app/dev/VideoRecDownloads",
    autoStartParticipantThreshold: 2
  },
  networkQuality: {
    sampleIntervalMs: 3000,
    simulated: {
      rttBaseMs: 30,
      rttSpreadMs: 200,
      jitterBaseMs: 3,
      jitterSpreadMs: 60,
      lossMaxPct: 8,
      bitrateBaseKbps: 150,
      bitrateSpreadKbps: 1000
    },
    thresholds: {
      rttGoodMs: 120,
      jitterGoodMs: 30,
      lossGoodPct: 2,
      bitrateGoodKbps: 400
    }
  },
  connectionStatus: {
    tickIntervalMs: 1000,
    rotationMinMs: 6000,
    rotationMaxMs: 8000,
    statsIntervalConnectingMs: 3000,
    statsIntervalConnectedMs: 7000,
    highRttMs: 1200,
    highPacketLossThreshold: 0.08,
    packetLossMinPackets: 100,
    bytesGrowthThreshold: 1024,
    mediaFlowRecentMs: 9000,
    relayRecentMs: 12000,
    candidateSwitchRecentMs: 12000,
    localSlowCheckingMs: 12000,
    localSlowStatsMs: 6000,
    relayEarlyJoinWindowMs: 25000,
    relayEarlyThresholdMs: 8000,
    remoteSlowWaitMs: 10000,
    disconnectedRetryMs: 4000
  }
} as const;
