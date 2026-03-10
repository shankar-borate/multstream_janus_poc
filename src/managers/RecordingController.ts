type RecordingControllerDeps = {
  bus: EventBus;
  getPlugin: () => any;
  getJoinedRoom: () => boolean;
  getCurrentRoomId: () => number | null;
  getParticipantId: () => number | undefined;
  getServer: () => VcxServer;
  isLeaving: () => boolean;
  leave: () => void;
  canRecord: () => boolean;
};

class RecordingController {
  private groupId: number | null = null;
  private meetingId: number | null = null;
  private to: number | null = null;
  private recording = false;
  private currentRecordingId: number | null = null;
  private createInFlight = false;
  private stopInFlight = false;
  private readonly recordingRetryDelayMs = 700;

  constructor(private readonly deps: RecordingControllerDeps) {}

  setMeetingContext(groupId: number, meetingId: number, to: number) {
    this.groupId = groupId;
    this.meetingId = meetingId;
    this.to = to;
  }

  clearMeetingContext() {
    this.groupId = null;
    this.meetingId = null;
    this.to = null;
  }

  reset() {
    this.recording = false;
    this.currentRecordingId = null;
    this.createInFlight = false;
    this.stopInFlight = false;
    this.deps.bus.emit("recording-changed", false);
  }

  isRecording(): boolean {
    return this.recording;
  }

  async start(source: "manual" | "auto", renderedParticipantCount: number) {
    if (!this.deps.canRecord()) {
      Logger.user("Recording blocked for user_type=customer");
      return;
    }

    const requiredParticipants = APP_CONFIG.recording.autoStartParticipantThreshold;
    if (renderedParticipantCount !== requiredParticipants) {
      Logger.setStatus("Recording requires both participants on live video.");
      Logger.user(
        `Recording blocked: rendered participants=${renderedParticipantCount}, required=${requiredParticipants}`
      );
      return;
    }
    if (this.recording || this.createInFlight || this.stopInFlight) return;

    const groupId = this.groupId;
    const meetingId = this.meetingId;
    const to = this.to;
    if (!Number.isFinite(groupId as number) || !Number.isFinite(meetingId as number) || !Number.isFinite(to as number)) {
      ApiErrorUtils.handle({ message: "recording context missing", details: { groupId, meetingId, to } });
      return;
    }

    this.createInFlight = true;
    try {
      const server = this.deps.getServer();
      const http = new HttpClient(server.server, server.client_id);
      const rms = new RmsClient(http);
      const recordingId = await rms.createRecording(to as number, meetingId as number);
      Logger.user(
        `[rms] recording created groupId=${groupId} to=${to} meetingId=${meetingId} recordingId=${recordingId}`
      );
      Logger.user(`${source} start recording`);
      this.enableRecording(recordingId, 1);
    } catch (e: any) {
      ApiErrorUtils.handle(e);
    } finally {
      this.createInFlight = false;
    }
  }

  async stop(source: "manual" | "auto"): Promise<void> {
    if (!this.deps.canRecord() || !this.recording || this.stopInFlight) return;
    Logger.user(`${source} stop recording`);
    this.stopInFlight = true;
    await this.disableRecording(1, this.currentRecordingId);
  }

  async stopOnLeave(): Promise<void> {
    if (!this.deps.canRecord() || !this.recording || this.stopInFlight) return;
    Logger.user("leave stop recording");
    this.stopInFlight = true;
    try {
      await this.disableRecording(1, this.currentRecordingId);
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_RECORDING_STOP_ON_LEAVE_FAILED, e);
    }
  }

  private endCallOnRecordingFailure(message: string, err?: unknown) {
    Logger.error(ErrorMessages.callRecordingLog(message), err);
    Logger.setStatus(ErrorMessages.CALL_RECORDING_FAILED_ENDING);
    this.recording = false;
    this.currentRecordingId = null;
    this.stopInFlight = false;
    this.deps.bus.emit("recording-changed", false);
    if (!this.deps.isLeaving()) this.deps.leave();
  }

  private async stopRmsRecording(recordingId: number): Promise<void> {
    const server = this.deps.getServer();
    const http = new HttpClient(server.server, server.client_id);
    const rms = new RmsClient(http);
    await rms.stopRecording(recordingId);
    Logger.user(`[rms] recording stopped recordingId=${recordingId}`);
  }

  private async finalizeRecordingStopped(recordingId: number | null): Promise<void> {
    this.recording = false;
    this.currentRecordingId = null;
    Logger.setStatus(ErrorMessages.CALL_RECORDING_STOPPED);
    this.deps.bus.emit("recording-changed", false);

    if (!Number.isFinite(recordingId as number)) {
      this.stopInFlight = false;
      return;
    }

    try {
      await this.stopRmsRecording(recordingId as number);
    } catch (e: any) {
      Logger.error(ErrorMessages.callRecordingLog(`rms stop failed recordingId=${recordingId}`), e);
      ApiErrorUtils.handle(e);
    } finally {
      this.stopInFlight = false;
    }
  }

  private enableRecording(recordingId: number, attempt: number) {
    const plugin = this.deps.getPlugin();
    if (!plugin || !this.deps.getJoinedRoom()) return;
    if (this.recording) return;

    this.currentRecordingId = recordingId;
    plugin.send({
      message: {
        request: "enable_recording",
        record: true,
        room: this.deps.getCurrentRoomId(),
        recordingId,
        participantId: this.deps.getParticipantId()
      },
      success: () => {
        this.recording = true;
        Logger.setStatus(ErrorMessages.callRecordingStarted(String(recordingId)));
        this.deps.bus.emit("recording-changed", true);
      },
      error: (e: any) => {
        Logger.error(ErrorMessages.callRecordingStartFailed(attempt), e);
        this.recording = false;
        this.deps.bus.emit("recording-changed", false);
        if (attempt < 2) {
          Logger.setStatus(ErrorMessages.CALL_RECORDING_START_RETRYING);
          window.setTimeout(
            () => this.enableRecording(recordingId, attempt + 1),
            this.recordingRetryDelayMs
          );
          return;
        }
        this.endCallOnRecordingFailure("start failed after retry", e);
      }
    });
  }

  private disableRecording(attempt: number, recordingId: number | null): Promise<void> {
    const plugin = this.deps.getPlugin();
    if (!plugin || !this.recording) {
      this.stopInFlight = false;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      plugin.send({
        message: {
          request: "enable_recording",
          record: false,
          room: this.deps.getCurrentRoomId()
        },
        success: () => {
          void this.finalizeRecordingStopped(recordingId)
            .then(resolve)
            .catch(reject);
        },
        error: (e: any) => {
          Logger.error(ErrorMessages.callRecordingStopFailed(attempt), e);
          if (attempt < 2) {
            Logger.setStatus(ErrorMessages.CALL_RECORDING_STOP_RETRYING);
            window.setTimeout(() => {
              void this.disableRecording(attempt + 1, recordingId)
                .then(resolve)
                .catch(reject);
            }, this.recordingRetryDelayMs);
            return;
          }
          this.endCallOnRecordingFailure("stop failed after retry", e);
          reject(e);
        }
      });
    });
  }
}
