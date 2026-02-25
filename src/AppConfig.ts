type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const IMS_MEDIA_CONSTRAINTS_MOCK_PAYLOAD = {
  MEDIA_CONSTRAINTS: {
    WEB_MEDIA_CONSTRAINTS: [
      {
        audio: true,
        video: {
          width: { min: 310, ideal: 320, max: 320 },
          frameRate: { max: 20 },
          aspectRatio: 1.777777778
        }
      },
      {
        audio: true,
        video: {
          width: { min: 310, ideal: 320 },
          frameRate: { max: 20 },
          aspectRatio: 1.777777778
        }
      },
      { audio: true, video: true }
    ],
    WEB_MEDIA_CONSTRAINTS_GU: [
      {
        audio: true,
        video: {
          width: { min: 620, ideal: 640, max: 640 },
          frameRate: { max: 20 },
          aspectRatio: 1.777777778
        }
      },
      {
        audio: true,
        video: {
          width: { min: 620, ideal: 640 },
          frameRate: { max: 20 },
          aspectRatio: 1.777777778
        }
      },
      { audio: true, video: true }
    ],
    MOBILE_MEDIA_CONSTRAINTS: [
      {
        audio: true,
        video: {
          width: { max: 640 },
          frameRate: { max: 30 },
          facingMode: { exact: "user" }
        }
      }
    ]
  },
  PC_CONFIG: {
    iceServers: [
      {
        urls: [
          "turn:coturn.videocx.io:443?transport=udp",
          "turns:coturn.videocx.io:443?transport=tcp"
        ],
        username: "1772097225:ecd359ac-2237-42ff-8ddc-764d79d4ea0b_!",
        credential: "odIkTMlYtpKWHHVZtAxw3a+VxJE="
      },
      {
        urls: ["stun:coturn.videocx.io:443"]
      }
    ]
  },
  PC_CONFIG_FF: {
    iceServers: [
      {
        url: "turn:coturn.videocx.io:443?transport=udp",
        username: "1772097225:ecd359ac-2237-42ff-8ddc-764d79d4ea0b",
        credential: "odIkTMlYtpKWHHVZtAxw3a+VxJE="
      },
      {
        url: "stun:coturn.videocx.io:443"
      }
    ]
  },
  videochat: {
    videoBandwidth: 128000
  },
  chimeMediaConstraints: {
    maxBandwidthKbps: 256,
    employee: {
      desktop: { width: 640, height: 480, frameRate: 20 },
      mobile: { width: 640, height: 480, frameRate: 20 }
    },
    customer: {
      desktop: { width: 640, height: 480, frameRate: 20 },
      mobile: { width: 640, height: 480, frameRate: 20 }
    }
  }
};

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
  ims: {
    mediaConstraintsPath: "/ims/users/media-constraints",
    useMockMediaConstraints: true,
    mockMediaConstraintsResponse: {
      name: "VideoConstraint",
      value: JSON.stringify(IMS_MEDIA_CONSTRAINTS_MOCK_PAYLOAD)
    }
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
