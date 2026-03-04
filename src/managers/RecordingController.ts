class RecordingController {
  private groupId: number | null = null;
  private meetingId: number | null = null;
  private createInFlight = false;

  constructor(
    private readonly callController: CallController,
    private readonly canRecord: boolean
  ) {}

  setMeetingContext(groupId: number, meetingId: number) {
    this.groupId = groupId;
    this.meetingId = meetingId;
  }

  clearMeetingContext() {
    this.groupId = null;
    this.meetingId = null;
    this.createInFlight = false;
  }

  async start(source: "manual" | "auto", renderedParticipantCount: number, isRecording: boolean) {
    if (!this.canRecord) {
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
    if (isRecording || this.createInFlight) return;

    const groupId = this.groupId;
    const meetingId = this.meetingId;
    if (!Number.isFinite(groupId as number) || !Number.isFinite(meetingId as number)) {
      Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, {
        groupId,
        meetingId
      });
      Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
      return;
    }

    this.createInFlight = true;
    try {
      const server = UrlConfig.getVcxServer().server;
      const clientId = UrlConfig.getVcxServer().client_id;
      const http = new HttpClient(server, clientId);
      const rms = new RmsClient(http);
      const recordingId = await rms.createRecording(groupId as number, meetingId as number);
      Logger.user(
        `[rms] recording created groupId=${groupId} meetingId=${meetingId} recordingId=${recordingId}`
      );
      Logger.user(`${source} start recording`);
      this.callController.startRecording(recordingId);
    } catch (e: any) {
      Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, e);
      Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
    } finally {
      this.createInFlight = false;
    }
  }

  stop(source: "manual" | "auto", isRecording: boolean) {
    if (!isRecording) return;
    Logger.user(`${source} stop recording`);
    this.callController.stopRecording();
  }
}
