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
  private recording = false;
  private currentRecordingId: number | null = null;
  private createInFlight = false;
  private readonly recordingRetryDelayMs = 700;

  constructor(private readonly deps: RecordingControllerDeps) {}

  setMeetingContext(groupId: number, meetingId: number) {
    this.groupId = groupId;
    this.meetingId = meetingId;
  }

  clearMeetingContext() {
    this.groupId = null;
    this.meetingId = null;
  }

  reset() {
    this.recording = false;
    this.currentRecordingId = null;
    this.createInFlight = false;
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
    if (this.recording || this.createInFlight) return;

    const groupId = this.groupId;
    const meetingId = this.meetingId;
    if (!Number.isFinite(groupId as number) || !Number.isFinite(meetingId as number)) {
      Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, { groupId, meetingId });
      Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
      return;
    }

    this.createInFlight = true;
    try {
      const server = this.deps.getServer();
      const http = new HttpClient(server.server, server.client_id);
      const rms = new RmsClient(http);
      const recordingId = await rms.createRecording(groupId as number, meetingId as number);
      Logger.user(
        `[rms] recording created groupId=${groupId} meetingId=${meetingId} recordingId=${recordingId}`
      );
      Logger.user(`${source} start recording`);
      this.enableRecording(recordingId, 1);
    } catch (e: any) {
      Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, e);
      Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
    } finally {
      this.createInFlight = false;
    }
  }

  stop(source: "manual" | "auto") {
    if (!this.recording) return;
    Logger.user(`${source} stop recording`);
    this.disableRecording(1);
  }

  stopOnLeave() {
    const plugin = this.deps.getPlugin();
    if (this.recording && plugin) {
      try {
        plugin.send({
          message: {
            request: "enable_recording",
            record: false,
            room: this.deps.getCurrentRoomId()
          }
        });
      } catch (e: any) {
        Logger.error(ErrorMessages.CALL_RECORDING_STOP_ON_LEAVE_FAILED, e);
      }
    }
    this.recording = false;
    this.currentRecordingId = null;
    this.deps.bus.emit("recording-changed", false);
  }

  private endCallOnRecordingFailure(message: string, err?: unknown) {
    Logger.error(ErrorMessages.callRecordingLog(message), err);
    Logger.setStatus(ErrorMessages.CALL_RECORDING_FAILED_ENDING);
    this.recording = false;
    this.currentRecordingId = null;
    this.deps.bus.emit("recording-changed", false);
    if (!this.deps.isLeaving()) this.deps.leave();
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

  private disableRecording(attempt: number) {
    const plugin = this.deps.getPlugin();
    if (!plugin || !this.recording) return;

    plugin.send({
      message: {
        request: "enable_recording",
        record: false,
        room: this.deps.getCurrentRoomId()
      },
      success: () => {
        this.recording = false;
        this.currentRecordingId = null;
        Logger.setStatus(ErrorMessages.CALL_RECORDING_STOPPED);
        this.deps.bus.emit("recording-changed", false);
      },
      error: (e: any) => {
        Logger.error(ErrorMessages.callRecordingStopFailed(attempt), e);
        if (attempt < 2) {
          Logger.setStatus(ErrorMessages.CALL_RECORDING_STOP_RETRYING);
          window.setTimeout(
            () => this.disableRecording(attempt + 1),
            this.recordingRetryDelayMs
          );
          return;
        }
        this.endCallOnRecordingFailure("stop failed after retry", e);
      }
    });
  }
}
