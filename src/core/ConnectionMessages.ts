type ConnectionMessageGroup = {
  owner: ConnectionOwner;
  severity: ConnectionSeverity;
  rotate: boolean;
  primary: string[];
  secondary: string[];
};

const CONNECTION_ROTATION_MIN_MS = APP_CONFIG.connectionStatus.rotationMinMs;
const CONNECTION_ROTATION_MAX_MS = APP_CONFIG.connectionStatus.rotationMaxMs;

const CONNECTION_MESSAGES: Record<ConnectionProductState, ConnectionMessageGroup> = {
  INIT: {
    owner: "SYSTEM",
    severity: "info",
    rotate: false,
    primary: ["Getting ready..."],
    secondary: ["Preparing secure call setup."]
  },
  MEDIA_PREP: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Preparing camera and microphone...",
      "Setting up your media devices...",
      "Finalizing media permissions..."
    ],
    secondary: [
      "This usually takes a few seconds.",
      "Checking browser access to media devices.",
      "Almost done."
    ]
  },
  NEGOTIATING: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Connecting your call...",
      "Negotiating secure media channels...",
      "Establishing video path..."
    ],
    secondary: [
      "Please stay on this screen.",
      "Optimizing signaling and media routing.",
      "Finalizing connection details."
    ]
  },
  WAITING_REMOTE: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Waiting for the other participant...",
      "Call is ready. Waiting for participant...",
      "Standing by for remote join..."
    ],
    secondary: [
      "You are connected and ready.",
      "Share the link if they have not joined yet.",
      "This screen will update automatically."
    ]
  },
  NETWORK_CHECK: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Checking network quality...",
      "Validating connection stability...",
      "Testing the best connection route..."
    ],
    secondary: [
      "This helps us keep video stable.",
      "Trying to improve call reliability.",
      "Connection is still being tuned."
    ]
  },
  LOCAL_SLOW: {
    owner: "LOCAL",
    severity: "warn",
    rotate: true,
    primary: [
      "Your network seems slow...",
      "Your connection is unstable right now...",
      "Your upload speed is lower than required..."
    ],
    secondary: [
      "Try a stronger network or pause heavy downloads.",
      "The other participant may see delayed video.",
      "We are still trying to stabilize your connection."
    ]
  },
  REMOTE_SLOW: {
    owner: "REMOTE",
    severity: "warn",
    rotate: true,
    primary: [
      "Other participant's network is slow...",
      "Waiting for the other participant's browser to send video...",
      "Still waiting for the participant's network..."
    ],
    secondary: [
      "Your connection looks active. Waiting on remote media.",
      "The other side may need a few more seconds.",
      "Their video should appear once their network stabilizes."
    ]
  },
  OPTIMIZING: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Switching to a more stable connection...",
      "Optimizing route for better call quality...",
      "Adjusting network path for stability..."
    ],
    secondary: [
      "You may notice a brief quality change.",
      "Using fallback routing to keep call alive.",
      "Stability should improve shortly."
    ]
  },
  CONNECTED: {
    owner: "NEUTRAL",
    severity: "info",
    rotate: false,
    primary: ["Connected"],
    secondary: ["Video and audio are live."]
  },
  DEGRADED: {
    owner: "SYSTEM",
    severity: "warn",
    rotate: true,
    primary: [
      "Connection is unstable...",
      "Call quality is temporarily degraded...",
      "Recovering from network instability..."
    ],
    secondary: [
      "Trying to restore stable media.",
      "You may see temporary freezes.",
      "Automatic recovery is in progress."
    ]
  },
  SERVER_RETRYING: {
    owner: "SYSTEM",
    severity: "warn",
    rotate: true,
    primary: [
      "Video server call failed. Retrying...",
      "Unable to reach video server. Retrying...",
      "Reconnecting to video server..."
    ],
    secondary: [
      "Please stay on this screen.",
      "Trying a fresh server session now.",
      "Session recovery is in progress."
    ]
  },
  PEER_RETRYING: {
    owner: "SYSTEM",
    severity: "warn",
    rotate: true,
    primary: [
      "Peer connection failed. Retrying...",
      "TURN/ICE connection failed. Retrying...",
      "Rebuilding media connection..."
    ],
    secondary: [
      "Trying a new media path now.",
      "Refreshing peer connectivity.",
      "Call media recovery is in progress."
    ]
  },
  RETRYING: {
    owner: "SYSTEM",
    severity: "warn",
    rotate: true,
    primary: [
      "Reconnecting call...",
      "Trying to recover connection...",
      "Attempting a new network route..."
    ],
    secondary: [
      "Please stay on this screen.",
      "This usually resolves in a few seconds.",
      "Session recovery is in progress."
    ]
  },
  FAILED: {
    owner: "SYSTEM",
    severity: "error",
    rotate: false,
    primary: ["Connection failed"],
    secondary: ["Please reconnect to continue the call."]
  }
};
