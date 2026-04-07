type NetworkGraphMetricKey =
  | "upload"
  | "download"
  | "remoteUpload"
  | "remoteDownload"
  | "localRttMs"
  | "localJitterMs"
  | "localLossPct"
  | "remoteRttMs"
  | "remoteJitterMs"
  | "remoteLossPct"
  | "uplinkSlowLink"
  | "downlinkSlowLink";

type NetworkGraphMetricUnit = "kbps" | "ms" | "%" | "flag";

type ParticipantNetworkGraphSample = {
  ts: number;
  upload: number | null;
  download: number | null;
  remoteUpload: number | null;
  remoteDownload: number | null;
  localRttMs: number | null;
  localJitterMs: number | null;
  localLossPct: number | null;
  remoteRttMs: number | null;
  remoteJitterMs: number | null;
  remoteLossPct: number | null;
  uplinkSlowLink: number;
  downlinkSlowLink: number;
  bottleneck: "You" | "Remote" | "Both" | "Unknown";
};

type ParticipantNetworkGraphSeries = {
  label: string;
  updatedAt: number;
  bottleneck: "You" | "Remote" | "Both" | "Unknown";
  samples: ParticipantNetworkGraphSample[];
};

type NetworkGraphMetricConfig = {
  key: NetworkGraphMetricKey;
  label: string;
  unit: NetworkGraphMetricUnit;
  color: string;
};

const NETWORK_GRAPH_METRICS: NetworkGraphMetricConfig[] = [
  { key: "upload", label: "Upload", unit: "kbps", color: "#2563eb" },
  { key: "download", label: "Download", unit: "kbps", color: "#16a34a" },
  { key: "remoteUpload", label: "Remote Upload", unit: "kbps", color: "#7c3aed" },
  { key: "remoteDownload", label: "Remote Download", unit: "kbps", color: "#ea580c" },
  { key: "localRttMs", label: "Local RTT", unit: "ms", color: "#0f766e" },
  { key: "localJitterMs", label: "Local Jitter", unit: "ms", color: "#0891b2" },
  { key: "localLossPct", label: "Local Packet Loss (sampled)", unit: "%", color: "#dc2626" },
  { key: "remoteRttMs", label: "Remote RTT", unit: "ms", color: "#8b5cf6" },
  { key: "remoteJitterMs", label: "Remote Jitter", unit: "ms", color: "#db2777" },
  { key: "remoteLossPct", label: "Remote Packet Loss (sampled)", unit: "%", color: "#b91c1c" },
  { key: "uplinkSlowLink", label: "Uplink SlowLink", unit: "flag", color: "#f59e0b" },
  { key: "downlinkSlowLink", label: "Downlink SlowLink", unit: "flag", color: "#ef4444" }
];

class NetworkPanelController {
  private participantNet = new ParticipantNetworkStatsManager();
  private joined = false;

  private networkSidePanel = document.getElementById("networkSidePanel") as HTMLDivElement;
  private networkSideHead = document.getElementById("networkSideHead") as HTMLDivElement;
  private networkSideToggle = document.getElementById("networkSideToggle") as HTMLSpanElement;
  private networkSideUpdated = document.getElementById("networkSideUpdated") as HTMLDivElement;
  private networkSideBody = document.getElementById("networkSideBody") as HTMLDivElement;
  private networkPanelBtn = document.getElementById("networkPanelBtn") as HTMLButtonElement;
  private networkPanelPopup = document.getElementById("networkPanelPopup") as HTMLDivElement;
  private networkPopupCard = document.getElementById("networkPopupCard") as HTMLDivElement;
  private networkPopupHead = document.getElementById("networkPopupHead") as HTMLDivElement;
  private networkPopupToggle = document.getElementById("networkPopupToggle") as HTMLButtonElement;
  private networkPanelClose = document.getElementById("networkPanelClose") as HTMLButtonElement;
  private networkPopupUpdated = document.getElementById("networkPopupUpdated") as HTMLDivElement;
  private networkPopupBody = document.getElementById("networkPopupBody") as HTMLDivElement;
  private networkViewSummarySide = document.getElementById("networkViewSummarySide") as HTMLButtonElement;
  private networkViewGraphSide = document.getElementById("networkViewGraphSide") as HTMLButtonElement;
  private networkViewConnectivitySide = document.getElementById("networkViewConnectivitySide") as HTMLButtonElement;
  private networkViewSummaryPopup = document.getElementById("networkViewSummaryPopup") as HTMLButtonElement;
  private networkViewGraphPopup = document.getElementById("networkViewGraphPopup") as HTMLButtonElement;
  private networkViewConnectivityPopup = document.getElementById("networkViewConnectivityPopup") as HTMLButtonElement;

  private networkGraphDialog = document.getElementById("networkGraphDialog") as HTMLDivElement;
  private networkGraphCard = document.getElementById("networkGraphCard") as HTMLDivElement;
  private networkGraphUpdated = document.getElementById("networkGraphUpdated") as HTMLDivElement;
  private networkGraphParticipant = document.getElementById("networkGraphParticipant") as HTMLSelectElement;
  private networkGraphSummary = document.getElementById("networkGraphSummary") as HTMLDivElement;
  private networkGraphMetricList = document.getElementById("networkGraphMetricList") as HTMLDivElement;
  private networkGraphEmpty = document.getElementById("networkGraphEmpty") as HTMLDivElement;
  private networkGraphCharts = document.getElementById("networkGraphCharts") as HTMLDivElement;
  private networkGraphClose = document.getElementById("networkGraphClose") as HTMLButtonElement;
  private networkGraphSelectAll = document.getElementById("networkGraphSelectAll") as HTMLButtonElement;
  private networkGraphClear = document.getElementById("networkGraphClear") as HTMLButtonElement;

  private connectivityDialog = document.getElementById("connectivityDialog") as HTMLDivElement;
  private connectivityCard = document.getElementById("connectivityCard") as HTMLDivElement;
  private connectivityUpdated = document.getElementById("connectivityUpdated") as HTMLDivElement;
  private connectivityClose = document.getElementById("connectivityClose") as HTMLButtonElement;
  private connectivityStatus = document.getElementById("connectivityStatus") as HTMLDivElement;
  private connectivityPrimary = document.getElementById("connectivityPrimary") as HTMLDivElement;
  private connectivitySecondary = document.getElementById("connectivitySecondary") as HTMLDivElement;
  private connectivityBrowser = document.getElementById("connectivityBrowser") as HTMLDivElement;
  private connectivityIce = document.getElementById("connectivityIce") as HTMLDivElement;
  private connectivityConnection = document.getElementById("connectivityConnection") as HTMLDivElement;
  private connectivitySignaling = document.getElementById("connectivitySignaling") as HTMLDivElement;
  private connectivityGathering = document.getElementById("connectivityGathering") as HTMLDivElement;
  private connectivityOwner = document.getElementById("connectivityOwner") as HTMLDivElement;
  private connectivitySeverity = document.getElementById("connectivitySeverity") as HTMLDivElement;
  private connectivityProductState = document.getElementById("connectivityProductState") as HTMLDivElement;

  private networkSidePanelMinimized = false;
  private networkPopupMinimized = false;
  private networkGraphVisible = false;
  private connectivityVisible = false;
  private readonly networkGraphMaxSamples = 90;
  private lastParticipantNetworkSnapshot: ParticipantNetworkSnapshot | null = null;
  private networkGraphSelectedParticipantKey: string | null = null;
  private networkGraphSelectedMetrics = new Set<NetworkGraphMetricKey>(NETWORK_GRAPH_METRICS.map((metric) => metric.key));
  private networkGraphHistory = new Map<string, ParticipantNetworkGraphSeries>();
  private latestConnectivity: {
    ice: string;
    signaling: string;
    connection: string;
    gathering: string;
    ts: number;
  } | null = null;
  private latestConnectionStatus: ConnectionStatusView | null = null;
  private connectivityUpdatedAt = 0;

  constructor(
    private bus: EventBus,
    private peersProvider: () => ParticipantNetworkPeers
  ) {
    this.setupParticipantNetworkPanel();
    this.setupParticipantNetworkGraphDialog();
    this.setupConnectivityDialog();
    this.bindBus();
    this.renderParticipantNetworkPending();
    this.renderConnectivityDialog();
    this.participantNet.start(
      (snapshot: ParticipantNetworkSnapshot) => {
        if (!this.joined) {
          this.renderParticipantNetworkPending();
          return;
        }
        this.renderParticipantNetwork(snapshot);
      },
      () => this.peersProvider()
    );
  }

  private bindBus() {
    this.bus.on<boolean>("joined", (joined) => {
      this.joined = joined;
      if (!joined) {
        this.reset();
      }
    });
    this.bus.on<JanusSlowLinkSignal>("janus-slowlink", (signal) => {
      this.participantNet.recordSlowLink(signal);
    });
    this.bus.on<{ feedId: number; payload: PeerNetworkTelemetry }>("peer-network-telemetry", (evt) => {
      this.participantNet.recordRemoteNetworkTelemetry(evt.feedId, evt.payload);
    });
    this.bus.on<any>("connectivity", (payload) => {
      this.latestConnectivity = payload;
      this.connectivityUpdatedAt = payload?.ts ?? Date.now();
      this.renderConnectivityDialog();
    });
    this.bus.on<ConnectionStatusView>("connection-status", (status) => {
      this.latestConnectionStatus = status;
      this.connectivityUpdatedAt = Date.now();
      this.renderConnectivityDialog();
    });
  }

  private reset() {
    this.lastParticipantNetworkSnapshot = null;
    this.networkGraphHistory.clear();
    this.networkGraphSelectedParticipantKey = null;
    this.latestConnectivity = null;
    this.latestConnectionStatus = null;
    this.connectivityUpdatedAt = 0;
    this.syncNetworkGraphParticipantOptions();
    this.renderParticipantNetworkPending();
    this.renderParticipantNetworkGraph();
    this.renderConnectivityDialog();
  }

  private setupParticipantNetworkPanel() {
    if (
      !this.networkSidePanel ||
      !this.networkSideHead ||
      !this.networkSideToggle ||
      !this.networkSideUpdated ||
      !this.networkSideBody ||
      !this.networkPanelBtn ||
      !this.networkPanelPopup ||
      !this.networkPopupCard ||
      !this.networkPopupHead ||
      !this.networkPopupToggle ||
      !this.networkPopupUpdated ||
      !this.networkPopupBody ||
      !this.networkPanelClose
    ) {
      return;
    }

    FloatingDialogSupport.attach(
      this.networkPanelPopup,
      this.networkPopupCard,
      this.networkPopupHead,
      {
        initialLeft: Math.max(24, window.innerWidth - 390),
        initialTop: 110,
        margin: 12
      }
    );

    const toggleSideMinimized = () => {
      this.setParticipantNetworkSideMinimized(!this.networkSidePanelMinimized);
    };
    const togglePopupMinimized = () => {
      this.setParticipantNetworkPopupMinimized(!this.networkPopupMinimized);
    };

    this.networkPanelBtn.onclick = () => {
      this.closeParticipantNetworkGraphDialog();
      this.closeConnectivityDialog();
      if (!this.isParticipantNetworkPopupMode()) {
        this.setParticipantNetworkSideMinimized(!this.networkSidePanelMinimized);
        return;
      }
      if (this.networkPanelPopup.classList.contains("show")) {
        this.closeParticipantNetworkPopup();
      } else {
        this.showNetworkSummaryView();
      }
    };

    if (this.networkViewSummarySide) {
      this.networkViewSummarySide.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.showNetworkSummaryView();
      };
    }
    if (this.networkViewGraphSide) {
      this.networkViewGraphSide.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.openParticipantNetworkGraphDialog();
      };
    }
    if (this.networkViewConnectivitySide) {
      this.networkViewConnectivitySide.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.openConnectivityDialog();
      };
    }
    if (this.networkViewSummaryPopup) {
      this.networkViewSummaryPopup.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.showNetworkSummaryView();
      };
    }
    if (this.networkViewGraphPopup) {
      this.networkViewGraphPopup.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.openParticipantNetworkGraphDialog();
      };
    }
    if (this.networkViewConnectivityPopup) {
      this.networkViewConnectivityPopup.onclick = (ev: MouseEvent) => {
        ev.stopPropagation();
        this.openConnectivityDialog();
      };
    }

    this.networkSideHead.onclick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (this.isNetworkHeaderAction(target)) return;
      toggleSideMinimized();
    };
    this.networkSideHead.onkeydown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement;
      if (this.isNetworkHeaderAction(target)) return;
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      toggleSideMinimized();
    };
    this.networkPopupToggle.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
      togglePopupMinimized();
    };
    this.networkPanelClose.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
      this.closeParticipantNetworkPopup();
    };
    window.addEventListener("resize", () => {
      if (!this.isParticipantNetworkPopupMode()) {
        this.closeParticipantNetworkPopup();
      }
      if (this.networkGraphVisible) {
        this.renderParticipantNetworkGraph();
      }
    });
    this.applyParticipantNetworkSideMinimizedState();
    this.applyParticipantNetworkPopupMinimizedState();
  }

  private isNetworkHeaderAction(target: HTMLElement | null): boolean {
    return !!(
      target?.closest("#networkViewSummarySide") ||
      target?.closest("#networkViewGraphSide") ||
      target?.closest("#networkViewConnectivitySide") ||
      target?.closest("#networkViewSummaryPopup") ||
      target?.closest("#networkViewGraphPopup") ||
      target?.closest("#networkViewConnectivityPopup")
    );
  }

  private showNetworkSummaryView() {
    if (this.isParticipantNetworkPopupMode()) {
      this.openParticipantNetworkPopup();
      this.setParticipantNetworkPopupMinimized(false);
      return;
    }
    this.closeParticipantNetworkPopup();
    this.setParticipantNetworkSideMinimized(false);
  }

  private openParticipantNetworkPopup() {
    FloatingDialogSupport.show(this.networkPanelPopup, this.networkPopupCard);
  }

  private closeParticipantNetworkPopup() {
    FloatingDialogSupport.hide(this.networkPanelPopup);
  }

  private applyParticipantNetworkSideMinimizedState() {
    if (!this.networkSidePanel || !this.networkSideToggle || !this.networkSideHead) return;
    this.networkSidePanel.classList.toggle("minimized", this.networkSidePanelMinimized);
    this.networkSideToggle.textContent = this.networkSidePanelMinimized ? "+" : "-";
    this.networkSideHead.setAttribute("aria-expanded", String(!this.networkSidePanelMinimized));
  }

  private applyParticipantNetworkPopupMinimizedState() {
    if (!this.networkPopupCard || !this.networkPopupToggle || !this.networkPopupHead) return;
    this.networkPopupCard.classList.toggle("minimized", this.networkPopupMinimized);
    this.networkPopupToggle.textContent = this.networkPopupMinimized ? "+" : "-";
    this.networkPopupHead.setAttribute("aria-expanded", String(!this.networkPopupMinimized));
    this.networkPopupToggle.setAttribute(
      "aria-label",
      this.networkPopupMinimized ? "Maximize network panel" : "Minimize network panel"
    );
  }

  private setParticipantNetworkSideMinimized(minimized: boolean) {
    this.networkSidePanelMinimized = minimized;
    this.applyParticipantNetworkSideMinimizedState();
  }

  private setParticipantNetworkPopupMinimized(minimized: boolean) {
    this.networkPopupMinimized = minimized;
    this.applyParticipantNetworkPopupMinimizedState();
  }

  private renderParticipantNetworkPending() {
    if (this.networkSideUpdated) this.networkSideUpdated.textContent = "Updated: -";
    if (this.networkPopupUpdated) this.networkPopupUpdated.textContent = "Updated: -";
    if (this.networkSideBody) this.networkSideBody.innerHTML = '<div class="network-empty">Pending stats...</div>';
    if (this.networkPopupBody) this.networkPopupBody.innerHTML = '<div class="network-empty">Pending stats...</div>';
  }

  private isParticipantNetworkPopupMode(): boolean {
    return true;
  }

  private renderParticipantNetwork(snapshot: ParticipantNetworkSnapshot) {
    this.lastParticipantNetworkSnapshot = snapshot;
    this.recordParticipantNetworkHistory(snapshot);
    if (this.networkGraphVisible) {
      this.renderParticipantNetworkGraph();
    }
    if (
      !this.networkSideUpdated ||
      !this.networkSideBody ||
      !this.networkPopupUpdated ||
      !this.networkPopupBody
    ) {
      return;
    }
    const updated = new Date(snapshot.updatedAt).toLocaleTimeString();
    const content = this.renderParticipantNetworkRows(snapshot.rows);
    this.networkSideUpdated.textContent = `Updated: ${updated}`;
    this.networkPopupUpdated.textContent = `Updated: ${updated}`;
    this.networkSideBody.innerHTML = content;
    this.networkPopupBody.innerHTML = content;
  }

  private recordParticipantNetworkHistory(snapshot: ParticipantNetworkSnapshot) {
    snapshot.rows.forEach((row) => {
      const key = this.getParticipantNetworkHistoryKey(row);
      const series = this.networkGraphHistory.get(key) ?? {
        label: row.label || "Participant",
        updatedAt: snapshot.updatedAt,
        bottleneck: row.likelyBottleneck,
        samples: []
      };
      series.label = row.label || series.label || "Participant";
      series.updatedAt = snapshot.updatedAt;
      series.bottleneck = row.likelyBottleneck;
      series.samples.push(this.createParticipantNetworkGraphSample(snapshot.updatedAt, row));
      if (series.samples.length > this.networkGraphMaxSamples) {
        series.samples.splice(0, series.samples.length - this.networkGraphMaxSamples);
      }
      this.networkGraphHistory.set(key, series);
    });

    this.syncNetworkGraphParticipantOptions();
  }

  private createParticipantNetworkGraphSample(ts: number, row: ParticipantNetworkRow): ParticipantNetworkGraphSample {
    return {
      ts,
      upload: row.upload.kbps,
      download: row.download.kbps,
      remoteUpload: row.remoteUpload.kbps,
      remoteDownload: row.remoteDownload.kbps,
      localRttMs: row.quality.localRttMs,
      localJitterMs: row.quality.localJitterMs,
      localLossPct: row.quality.localLossPct,
      remoteRttMs: row.quality.remoteRttMs,
      remoteJitterMs: row.quality.remoteJitterMs,
      remoteLossPct: row.quality.remoteLossPct,
      uplinkSlowLink: row.upload.slowLink || row.remoteDownload.slowLink ? 1 : 0,
      downlinkSlowLink: row.download.slowLink || row.remoteUpload.slowLink ? 1 : 0,
      bottleneck: row.likelyBottleneck
    };
  }

  private getParticipantNetworkHistoryKey(row: ParticipantNetworkRow): string {
    const label = (row.label || "").trim();
    if (label === "You" || label.startsWith("You (")) return "self";
    if (row.participantId !== null && Number.isFinite(row.participantId)) {
      return `participant:${row.participantId}`;
    }
    return `participant:${label || "unknown"}`;
  }

  private setupParticipantNetworkGraphDialog() {
    if (
      !this.networkGraphDialog ||
      !this.networkGraphCard ||
      !this.networkGraphUpdated ||
      !this.networkGraphParticipant ||
      !this.networkGraphSummary ||
      !this.networkGraphMetricList ||
      !this.networkGraphEmpty ||
      !this.networkGraphCharts ||
      !this.networkGraphClose ||
      !this.networkGraphSelectAll ||
      !this.networkGraphClear
    ) {
      return;
    }

    FloatingDialogSupport.attach(
      this.networkGraphDialog,
      this.networkGraphCard,
      this.networkGraphCard.querySelector(".network-graph-head") as HTMLDivElement | null,
      {
        initialLeft: 140,
        initialTop: 90,
        margin: 12
      }
    );

    this.renderNetworkGraphMetricControls();
    this.syncNetworkGraphParticipantOptions();

    this.networkGraphParticipant.onchange = () => {
      this.networkGraphSelectedParticipantKey = this.networkGraphParticipant.value || null;
      this.renderParticipantNetworkGraph();
    };

    this.networkGraphSelectAll.onclick = () => {
      this.networkGraphSelectedMetrics = new Set<NetworkGraphMetricKey>(NETWORK_GRAPH_METRICS.map((metric) => metric.key));
      this.renderNetworkGraphMetricControls();
      this.renderParticipantNetworkGraph();
    };

    this.networkGraphClear.onclick = () => {
      this.networkGraphSelectedMetrics.clear();
      this.renderNetworkGraphMetricControls();
      this.renderParticipantNetworkGraph();
    };

    this.networkGraphClose.onclick = () => this.closeParticipantNetworkGraphDialog();
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && this.networkGraphVisible) {
        this.closeParticipantNetworkGraphDialog();
      }
    });
  }

  private openParticipantNetworkGraphDialog() {
    if (!this.networkGraphDialog) return;
    this.networkGraphVisible = true;
    FloatingDialogSupport.show(this.networkGraphDialog, this.networkGraphCard);
    this.syncNetworkGraphParticipantOptions();
    this.renderParticipantNetworkGraph();
  }

  private closeParticipantNetworkGraphDialog() {
    if (!this.networkGraphDialog) return;
    this.networkGraphVisible = false;
    FloatingDialogSupport.hide(this.networkGraphDialog);
  }

  private syncNetworkGraphParticipantOptions() {
    if (!this.networkGraphParticipant) return;

    const orderedEntries = this.getOrderedParticipantNetworkGraphEntries();
    if (orderedEntries.length === 0) {
      this.networkGraphParticipant.innerHTML = '<option value="">No participant data</option>';
      this.networkGraphParticipant.disabled = true;
      this.networkGraphSelectedParticipantKey = null;
      return;
    }

    if (
      !this.networkGraphSelectedParticipantKey ||
      !orderedEntries.some(([key]) => key === this.networkGraphSelectedParticipantKey)
    ) {
      this.networkGraphSelectedParticipantKey = orderedEntries[0][0];
    }

    this.networkGraphParticipant.disabled = false;
    this.networkGraphParticipant.innerHTML = orderedEntries
      .map(([key, series]) => {
        const selected = key === this.networkGraphSelectedParticipantKey ? " selected" : "";
        return `<option value="${this.escapeHtml(key)}"${selected}>${this.escapeHtml(series.label)}</option>`;
      })
      .join("");
    this.networkGraphParticipant.value = this.networkGraphSelectedParticipantKey;
  }

  private getOrderedParticipantNetworkGraphEntries(): Array<[string, ParticipantNetworkGraphSeries]> {
    const orderedKeys: string[] = [];
    const seen = new Set<string>();
    const pushKey = (key: string) => {
      if (!this.networkGraphHistory.has(key) || seen.has(key)) return;
      seen.add(key);
      orderedKeys.push(key);
    };

    if (this.lastParticipantNetworkSnapshot?.rows) {
      this.lastParticipantNetworkSnapshot.rows.forEach((row) => {
        pushKey(this.getParticipantNetworkHistoryKey(row));
      });
    }

    Array.from(this.networkGraphHistory.entries())
      .sort((a, b) => {
        if (a[0] === "self") return -1;
        if (b[0] === "self") return 1;
        return a[1].label.localeCompare(b[1].label);
      })
      .forEach(([key]) => pushKey(key));

    return orderedKeys.map((key) => [key, this.networkGraphHistory.get(key)!] as [string, ParticipantNetworkGraphSeries]);
  }

  private renderNetworkGraphMetricControls() {
    if (!this.networkGraphMetricList) return;

    this.networkGraphMetricList.innerHTML = NETWORK_GRAPH_METRICS
      .map((metric) => {
        const checked = this.networkGraphSelectedMetrics.has(metric.key) ? " checked" : "";
        return (
          `<label class="network-graph-metric-chip">` +
          `<input type="checkbox" data-metric-key="${metric.key}"${checked}>` +
          `<span class="network-graph-metric-swatch" style="background:${metric.color}"></span>` +
          `<span>${this.escapeHtml(metric.label)}</span>` +
          `</label>`
        );
      })
      .join("");

    Array.from(this.networkGraphMetricList.querySelectorAll("input[data-metric-key]")).forEach((node) => {
      const input = node as HTMLInputElement;
      input.onchange = () => {
        const key = input.getAttribute("data-metric-key") as NetworkGraphMetricKey | null;
        if (!key) return;
        if (input.checked) {
          this.networkGraphSelectedMetrics.add(key);
        } else {
          this.networkGraphSelectedMetrics.delete(key);
        }
        this.renderParticipantNetworkGraph();
      };
    });
  }

  private renderParticipantNetworkGraph() {
    if (
      !this.networkGraphUpdated ||
      !this.networkGraphSummary ||
      !this.networkGraphEmpty ||
      !this.networkGraphCharts
    ) {
      return;
    }

    const selectedKey = this.networkGraphSelectedParticipantKey;
    const series = selectedKey ? this.networkGraphHistory.get(selectedKey) ?? null : null;

    if (!series) {
      this.networkGraphUpdated.textContent = "Updated: -";
      this.applyNetworkGraphSummary("Unknown");
      this.networkGraphEmpty.textContent = "Waiting for graph samples...";
      this.networkGraphEmpty.style.display = "block";
      this.networkGraphCharts.innerHTML = "";
      return;
    }

    this.networkGraphUpdated.textContent =
      `Updated: ${this.formatTimestamp(series.updatedAt)} | Samples: ${series.samples.length}`;
    this.applyNetworkGraphSummary(series.bottleneck);

    const selectedMetrics = NETWORK_GRAPH_METRICS.filter((metric) => this.networkGraphSelectedMetrics.has(metric.key));
    if (selectedMetrics.length === 0) {
      this.networkGraphEmpty.textContent = "Select at least one metric to render the graph.";
      this.networkGraphEmpty.style.display = "block";
      this.networkGraphCharts.innerHTML = "";
      return;
    }

    this.networkGraphEmpty.style.display = "none";
    this.networkGraphCharts.innerHTML = selectedMetrics
      .map((metric) => this.renderParticipantMetricChart(metric, series))
      .join("");
  }

  private applyNetworkGraphSummary(value: "You" | "Remote" | "Both" | "Unknown") {
    if (!this.networkGraphSummary) return;
    const cls = this.getBottleneckClass(value);
    this.networkGraphSummary.className = `network-graph-summary network-bottleneck ${cls}`;
    this.networkGraphSummary.textContent = `Latest bottleneck: ${value}`;
  }

  private renderParticipantMetricChart(metric: NetworkGraphMetricConfig, series: ParticipantNetworkGraphSeries): string {
    const samples = series.samples;
    const latestValue = this.getLatestNetworkGraphMetricValue(samples, metric.key);
    const values = samples
      .map((sample) => this.getNetworkGraphMetricValue(sample, metric.key))
      .filter((value): value is number => value !== null && Number.isFinite(value));

    const chartMeta =
      `<div class="network-graph-chart-meta">` +
      `Latest: ${this.escapeHtml(this.formatNetworkGraphMetricValue(metric, latestValue))}` +
      `</div>`;

    if (samples.length === 0 || values.length === 0) {
      return (
        `<div class="network-graph-chart-card">` +
        `<div class="network-graph-chart-head">` +
        `<div class="network-graph-chart-title">${this.escapeHtml(metric.label)}</div>` +
        chartMeta +
        `</div>` +
        `<div class="network-graph-chart-frame">` +
        `<div class="network-graph-chart-empty">Pending samples...</div>` +
        `</div>` +
        `<div class="network-graph-chart-footer"><span>Window: -</span><span>Samples: 0</span></div>` +
        `</div>`
      );
    }

    const width = 430;
    const height = 180;
    const left = 46;
    const right = 10;
    const top = 12;
    const bottom = 24;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const firstTs = samples[0].ts;
    const lastTs = samples[samples.length - 1].ts;
    const timeSpan = Math.max(1, lastTs - firstTs);
    const bounds = this.getNetworkGraphBounds(metric, values);
    const valueSpan = Math.max(0.0001, bounds.max - bounds.min);
    const xFor = (ts: number) => left + ((ts - firstTs) / timeSpan) * plotWidth;
    const yFor = (value: number) => top + (1 - ((value - bounds.min) / valueSpan)) * plotHeight;

    const tickValues = metric.unit === "flag"
      ? [1, 0]
      : [bounds.max, bounds.max - valueSpan / 3, bounds.max - (2 * valueSpan) / 3, bounds.min];
    const horizontalGrid = tickValues
      .map((tick) => {
        const y = yFor(tick);
        return (
          `<line x1="${left}" y1="${y.toFixed(2)}" x2="${(left + plotWidth).toFixed(2)}" y2="${y.toFixed(2)}" stroke="rgba(148,163,184,.26)" stroke-width="1" />` +
          `<text x="${(left - 6).toFixed(2)}" y="${(y + 3).toFixed(2)}" text-anchor="end" font-size="9" fill="#64748b">` +
          `${this.escapeHtml(this.formatNetworkGraphAxisLabel(metric.unit, tick))}` +
          `</text>`
        );
      })
      .join("");

    const verticalGrid = [0, 0.5, 1]
      .map((ratio) => {
        const x = left + plotWidth * ratio;
        return `<line x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${(top + plotHeight).toFixed(2)}" stroke="rgba(148,163,184,.18)" stroke-width="1" />`;
      })
      .join("");

    const path = this.buildNetworkGraphPath(samples, metric, xFor, yFor);
    const lastPoint = this.getLatestNetworkGraphPoint(samples, metric, xFor, yFor);
    const pointMarker = lastPoint
      ? `<circle cx="${lastPoint.x.toFixed(2)}" cy="${lastPoint.y.toFixed(2)}" r="3.5" fill="${metric.color}" stroke="#fff" stroke-width="1.5" />`
      : "";
    const activeDots = metric.unit === "flag"
      ? samples
        .map((sample) => {
          const value = this.getNetworkGraphMetricValue(sample, metric.key);
          if (value === null || !Number.isFinite(value)) return "";
          const x = xFor(sample.ts);
          const y = yFor(value);
          return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.2" fill="${metric.color}" opacity=".92" />`;
        })
        .join("")
      : "";
    const frame =
      `<svg class="network-graph-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="${this.escapeHtml(metric.label)} trend graph">` +
      horizontalGrid +
      verticalGrid +
      `<path d="${path}" fill="none" stroke="${metric.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />` +
      activeDots +
      pointMarker +
      `</svg>`;

    const rangeText = `${this.formatNetworkGraphMetricValue(metric, bounds.min)} to ${this.formatNetworkGraphMetricValue(metric, bounds.max)}`;
    const footerLeft = `Window: ${this.formatTimestamp(firstTs)} -> ${this.formatTimestamp(lastTs)}`;
    const footerRight = `Range: ${rangeText}`;

    return (
      `<div class="network-graph-chart-card">` +
      `<div class="network-graph-chart-head">` +
      `<div class="network-graph-chart-title">${this.escapeHtml(metric.label)}</div>` +
      chartMeta +
      `</div>` +
      `<div class="network-graph-chart-frame">${frame}</div>` +
      `<div class="network-graph-chart-footer"><span>${this.escapeHtml(footerLeft)}</span><span>${this.escapeHtml(footerRight)}</span></div>` +
      `</div>`
    );
  }

  private buildNetworkGraphPath(
    samples: ParticipantNetworkGraphSample[],
    metric: NetworkGraphMetricConfig,
    xFor: (ts: number) => number,
    yFor: (value: number) => number
  ): string {
    let path = "";
    let segmentOpen = false;

    samples.forEach((sample) => {
      const value = this.getNetworkGraphMetricValue(sample, metric.key);
      if (value === null || !Number.isFinite(value)) {
        segmentOpen = false;
        return;
      }
      const x = xFor(sample.ts);
      const y = yFor(value);
      path += `${segmentOpen ? " L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      segmentOpen = true;
    });

    return path || "M 0 0";
  }

  private getLatestNetworkGraphPoint(
    samples: ParticipantNetworkGraphSample[],
    metric: NetworkGraphMetricConfig,
    xFor: (ts: number) => number,
    yFor: (value: number) => number
  ): { x: number; y: number } | null {
    for (let i = samples.length - 1; i >= 0; i--) {
      const value = this.getNetworkGraphMetricValue(samples[i], metric.key);
      if (value === null || !Number.isFinite(value)) continue;
      return {
        x: xFor(samples[i].ts),
        y: yFor(value)
      };
    }
    return null;
  }

  private getLatestNetworkGraphMetricValue(
    samples: ParticipantNetworkGraphSample[],
    key: NetworkGraphMetricKey
  ): number | null {
    for (let i = samples.length - 1; i >= 0; i--) {
      const value = this.getNetworkGraphMetricValue(samples[i], key);
      if (value !== null && Number.isFinite(value)) return value;
    }
    return null;
  }

  private getNetworkGraphMetricValue(sample: ParticipantNetworkGraphSample, key: NetworkGraphMetricKey): number | null {
    switch (key) {
      case "upload": return sample.upload;
      case "download": return sample.download;
      case "remoteUpload": return sample.remoteUpload;
      case "remoteDownload": return sample.remoteDownload;
      case "localRttMs": return sample.localRttMs;
      case "localJitterMs": return sample.localJitterMs;
      case "localLossPct": return sample.localLossPct;
      case "remoteRttMs": return sample.remoteRttMs;
      case "remoteJitterMs": return sample.remoteJitterMs;
      case "remoteLossPct": return sample.remoteLossPct;
      case "uplinkSlowLink": return sample.uplinkSlowLink;
      case "downlinkSlowLink": return sample.downlinkSlowLink;
      default: return null;
    }
  }

  private getNetworkGraphBounds(metric: NetworkGraphMetricConfig, values: number[]): { min: number; max: number } {
    if (metric.unit === "flag") {
      return { min: 0, max: 1 };
    }

    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      const padding = min === 0 ? 1 : Math.max(1, Math.abs(min) * 0.15);
      min = Math.max(0, min - padding);
      max += padding;
    } else {
      const padding = (max - min) * 0.12;
      min = Math.max(0, min - padding);
      max += padding;
    }

    if (metric.unit === "%") {
      min = Math.max(0, min);
      max = Math.min(100, Math.max(min + 1, max));
    }

    return { min, max: Math.max(min + 0.0001, max) };
  }

  private formatNetworkGraphMetricValue(metric: NetworkGraphMetricConfig, value: number | null): string {
    if (value === null || !Number.isFinite(value)) return "Pending";
    if (metric.unit === "flag") return value >= 0.5 ? "Active" : "Clear";
    if (metric.unit === "kbps") return this.formatParticipantSpeed(value);
    if (metric.unit === "ms") return `${value.toFixed(1)} ms`;
    return `${value.toFixed(2)} %`;
  }

  private formatNetworkGraphAxisLabel(unit: NetworkGraphMetricUnit, value: number): string {
    if (unit === "flag") return value >= 0.5 ? "Active" : "Clear";
    if (unit === "kbps") {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}M`;
      return `${value.toFixed(0)}k`;
    }
    if (unit === "ms") return `${value.toFixed(0)}ms`;
    return `${value.toFixed(1)}%`;
  }

  private setupConnectivityDialog() {
    if (
      !this.connectivityDialog ||
      !this.connectivityCard ||
      !this.connectivityUpdated ||
      !this.connectivityClose ||
      !this.connectivityStatus ||
      !this.connectivityPrimary ||
      !this.connectivitySecondary
    ) {
      return;
    }

    FloatingDialogSupport.attach(
      this.connectivityDialog,
      this.connectivityCard,
      this.connectivityCard.querySelector(".network-graph-head") as HTMLDivElement | null,
      {
        initialLeft: 250,
        initialTop: 126,
        margin: 12
      }
    );

    this.connectivityClose.onclick = () => this.closeConnectivityDialog();

    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && this.connectivityVisible) {
        this.closeConnectivityDialog();
      }
    });
  }

  private openConnectivityDialog() {
    if (!this.connectivityDialog) return;
    this.connectivityVisible = true;
    FloatingDialogSupport.show(this.connectivityDialog, this.connectivityCard);
    this.renderConnectivityDialog();
  }

  private closeConnectivityDialog() {
    if (!this.connectivityDialog) return;
    this.connectivityVisible = false;
    FloatingDialogSupport.hide(this.connectivityDialog);
  }

  openNetworkSummaryDialog() {
    this.showNetworkSummaryView();
  }

  openNetworkGraphDialog() {
    this.openParticipantNetworkGraphDialog();
  }

  openConnectivityInfoDialog() {
    this.openConnectivityDialog();
  }

  private renderConnectivityDialog() {
    if (
      !this.connectivityUpdated ||
      !this.connectivityStatus ||
      !this.connectivityPrimary ||
      !this.connectivitySecondary
    ) {
      return;
    }

    const status = this.latestConnectionStatus;
    const connectivity = this.latestConnectivity;
    this.connectivityUpdated.textContent = this.connectivityUpdatedAt > 0
      ? `Updated: ${this.formatTimestamp(this.connectivityUpdatedAt)}`
      : "Updated: -";

    const severityClass = status?.severity === "error"
      ? "connectivity-status-error"
      : status?.severity === "warn"
        ? "connectivity-status-warn"
        : status?.severity === "info"
          ? "connectivity-status-info"
          : "connectivity-status-pending";
    this.connectivityStatus.className = `connectivity-status ${severityClass}`;
    this.connectivityStatus.textContent = status ? `${status.state} (${status.severity})` : "Pending";
    this.connectivityPrimary.textContent = status?.primaryText ?? "Waiting for connectivity data.";
    this.connectivitySecondary.textContent =
      status?.secondaryText ?? "Start a call to see ICE, signaling, and transport details.";

    this.setText(this.connectivityBrowser, navigator.onLine === false ? "Offline" : "Online");
    this.setText(this.connectivityIce, connectivity?.ice ?? "Pending");
    this.setText(this.connectivityConnection, connectivity?.connection ?? "Pending");
    this.setText(this.connectivitySignaling, connectivity?.signaling ?? "Pending");
    this.setText(this.connectivityGathering, connectivity?.gathering ?? "Pending");
    this.setText(this.connectivityOwner, status?.owner ?? "Pending");
    this.setText(this.connectivitySeverity, status?.severity ?? "Pending");
    this.setText(this.connectivityProductState, status?.state ?? "Pending");
  }

  private setText(el: HTMLElement | null | undefined, value: string) {
    if (!el) return;
    el.textContent = value;
  }

  private renderParticipantNetworkRows(rows: ParticipantNetworkRow[]): string {
    if (!rows || rows.length === 0) {
      return '<div class="network-empty">Pending stats...</div>';
    }
    return rows.map((row) => this.renderParticipantNetworkRow(row)).join("");
  }

  private renderParticipantNetworkRow(row: ParticipantNetworkRow): string {
    const label = this.escapeHtml(row.label || "Participant");
    const upload = this.renderParticipantMetric("Upload", row.upload);
    const download = this.renderParticipantMetric("Download", row.download);
    const remoteUpload = this.renderParticipantMetric("Remote Upload", row.remoteUpload);
    const remoteDownload = this.renderParticipantMetric("Remote Download", row.remoteDownload);
    const quality = this.renderParticipantQualityGrid(row);

    return (
      `<div class="network-row">` +
      `<div class="network-row-header">${label}</div>` +
      `<div class="network-row-grid">` +
      upload + download + remoteUpload + remoteDownload +
      `</div>` +
      quality +
      this.renderSlowLinkSummary(row) +
      this.renderBottleneckSummary(row.likelyBottleneck) +
      `<div class="network-row-strip">` +
      `<span class="network-strip-seg ${this.tierClass(row.upload.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.download.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.remoteUpload.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.remoteDownload.tier)}"></span>` +
      `</div>` +
      `<div class="network-strip-legend">U | D | RU | RD</div>` +
      `</div>`
    );
  }

  private renderBottleneckSummary(value: "You" | "Remote" | "Both" | "Unknown"): string {
    const cls = this.getBottleneckClass(value);
    return `<div class="network-bottleneck ${cls}">Likely bottleneck: ${value}</div>`;
  }

  private getBottleneckClass(value: "You" | "Remote" | "Both" | "Unknown"): string {
    return value === "You"
      ? "bneck-you"
      : value === "Remote"
        ? "bneck-remote"
        : value === "Both"
          ? "bneck-both"
          : "bneck-unknown";
  }

  private renderSlowLinkSummary(row: ParticipantNetworkRow): string {
    const uplink = row.upload.slowLink || row.remoteDownload.slowLink;
    const downlink = row.download.slowLink || row.remoteUpload.slowLink;
    if (!uplink && !downlink) {
      return '<div class="network-slowlink network-slowlink-none">SlowLink: None</div>';
    }
    const parts: string[] = [];
    if (uplink) parts.push("Uplink");
    if (downlink) parts.push("Downlink");
    return `<div class="network-slowlink network-slowlink-active">SlowLink: ${parts.join(" + ")}</div>`;
  }

  private renderParticipantMetric(label: string, direction: ParticipantNetworkDirectionSnapshot): string {
    const cls = this.tierClass(direction.tier);
    const kbps = this.formatParticipantSpeed(direction.kbps);
    const slowTag = direction.slowLink ? " SlowLink" : "";
    return (
      `<div class="network-metric">` +
      `<div class="network-metric-label">${label}</div>` +
      `<div class="network-metric-value ${cls}">${kbps} (${direction.tier}${slowTag})</div>` +
      `</div>`
    );
  }

  private renderParticipantQualityGrid(row: ParticipantNetworkRow): string {
    const q = row.quality;
    const localRtt = this.renderParticipantQualityMetric(
      "Local RTT",
      q.localRttMs,
      "ms",
      this.classifyRttTier(q.localRttMs)
    );
    const localJitter = this.renderParticipantQualityMetric(
      "Local Jitter",
      q.localJitterMs,
      "ms",
      this.classifyJitterTier(q.localJitterMs)
    );
    const localLoss = this.renderParticipantQualityMetric(
      "Local Packet Loss (sampled)",
      q.localLossPct,
      "%",
      this.classifyLossTier(q.localLossPct)
    );
    const remoteRtt = this.renderParticipantQualityMetric(
      "Remote RTT",
      q.remoteRttMs,
      "ms",
      this.classifyRttTier(q.remoteRttMs)
    );
    const remoteJitter = this.renderParticipantQualityMetric(
      "Remote Jitter",
      q.remoteJitterMs,
      "ms",
      this.classifyJitterTier(q.remoteJitterMs)
    );
    const remoteLoss = this.renderParticipantQualityMetric(
      "Remote Packet Loss (sampled)",
      q.remoteLossPct,
      "%",
      this.classifyLossTier(q.remoteLossPct)
    );
    return (
      `<div class="network-row-grid network-row-grid-quality">` +
      localRtt + localJitter + localLoss + remoteRtt + remoteJitter + remoteLoss +
      `</div>`
    );
  }

  private renderParticipantQualityMetric(
    label: string,
    value: number | null,
    unit: "ms" | "%",
    tier: ParticipantNetworkTier
  ): string {
    const cls = this.tierClass(tier);
    const rendered = this.formatParticipantQualityValue(value, unit);
    return (
      `<div class="network-metric">` +
      `<div class="network-metric-label">${label}</div>` +
      `<div class="network-metric-value ${cls}">${rendered}${value !== null ? ` (${tier})` : ""}</div>` +
      `</div>`
    );
  }

  private classifyJitterTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.jitterGoodMs;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private classifyRttTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.rttGoodMs;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private classifyLossTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.lossGoodPct;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private formatParticipantQualityValue(value: number | null, unit: "ms" | "%"): string {
    if (value === null || !Number.isFinite(value)) return "Pending";
    return `${value.toFixed(1)} ${unit}`;
  }

  private formatParticipantSpeed(kbps: number | null): string {
    if (kbps === null || !Number.isFinite(kbps)) return "Pending";
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(2)} Mbps`;
    return `${kbps.toFixed(0)} kbps`;
  }

  private tierClass(tier: ParticipantNetworkTier): string {
    if (tier === "Good") return "tier-good";
    if (tier === "Medium") return "tier-medium";
    if (tier === "Low") return "tier-low";
    return "tier-pending";
  }

  private formatTimestamp(value: number): string {
    if (!Number.isFinite(value)) return "-";
    return new Date(value).toLocaleTimeString();
  }

  private escapeHtml(text: string): string {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
