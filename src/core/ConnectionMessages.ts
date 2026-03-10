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
      "Preparing camera and microphone...",
      "Preparing camera and microphone..."
    ],
    secondary: [
      "Please allow camera and microphone access if your browser asks.",
      "Please allow camera and microphone access if your browser asks.",
      "Please allow camera and microphone access if your browser asks."
    ]
  },
  NEGOTIATING: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Connecting your call...",
      "Connecting your call...",
      "Connecting your call..."
    ],
    secondary: [
      "Setting up the secure media connection.",
      "Setting up the secure media connection.",
      "Setting up the secure media connection."
    ]
  },
  WAITING_REMOTE: {
    owner: "SYSTEM",
    severity: "info",
    rotate: true,
    primary: [
      "Waiting for the other participant...",
      "Waiting for the other participant...",
      "Waiting for the other participant..."
    ],
    secondary: [
      "The call will continue automatically when they join.",
      "The call will continue automatically when they join.",
      "The call will continue automatically when they join."
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
      "Your network is slow.",
      "Your network is slow.",
      "Your network is slow."
    ],
    secondary: [
      "Video may take longer to connect. Try a stronger network or stop heavy downloads.",
      "Video may take longer to connect. Try a stronger network or stop heavy downloads.",
      "Video may take longer to connect. Try a stronger network or stop heavy downloads."
    ]
  },
  REMOTE_SLOW: {
    owner: "REMOTE",
    severity: "warn",
    rotate: true,
    primary: [
      "The participant's network is slow.",
      "The participant's network is slow.",
      "The participant's network is slow."
    ],
    secondary: [
      "Your connection is active. Waiting for their media to start.",
      "Your connection is active. Waiting for their media to start.",
      "Your connection is active. Waiting for their media to start."
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
      "The connection is unstable.",
      "The connection is unstable.",
      "The connection is unstable."
    ],
    secondary: [
      "We are trying a more stable route now.",
      "We are trying a more stable route now.",
      "We are trying a more stable route now."
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
      "Secure media connection failed. Retrying...",
      "Secure media connection failed. Retrying...",
      "Secure media connection failed. Retrying..."
    ],
    secondary: [
      "We could not establish a stable TURN/ICE media path.",
      "We could not establish a stable TURN/ICE media path.",
      "We could not establish a stable TURN/ICE media path."
    ]
  },
  RETRYING: {
    owner: "SYSTEM",
    severity: "warn",
    rotate: true,
    primary: [
      "Reconnecting the call...",
      "Reconnecting the call...",
      "Reconnecting the call..."
    ],
    secondary: [
      "Trying a new media route now.",
      "Trying a new media route now.",
      "Trying a new media route now."
    ]
  },
  FAILED: {
    owner: "SYSTEM",
    severity: "error",
    rotate: false,
    primary: ["Connection failed"],
    secondary: ["The media connection could not be established. Please reconnect."]
  }
};
