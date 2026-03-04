class RmsClient {
  constructor(private readonly http: HttpClient) {}

  async createMeetingByGroup(groupId: number): Promise<number> {
    const body: RmsCreateMeetingRequest = {
      groupId: null,
      meetingType: 1,
      to: groupId,
      recordingMethod: 2,
      autoRecording: false,
      recordingType: 1,
      alwaysCreateNewMeeting: true
    };

    const res = await this.http.request<RmsCreateMeetingResponse>({
      method: "POST",
      path: "/rms/meetings",
      body
    });

    const meetingId = Number(res.data?.meetingId);
    if (!Number.isFinite(meetingId) || meetingId <= 0) {
      throw new Error(ErrorMessages.RMS_MEETING_ID_INVALID);
    }
    return meetingId;
  }

  async createRecording(groupId: number, meetingId: number): Promise<number> {
    const body: RmsCreateRecordingRequest = {
      to: groupId,
      meetingId,
      recordingMethod: 2,
      recordingType: 1,
      alwaysCreateNewRecording: true
    };

    const res = await this.http.request<RmsCreateRecordingResponse>({
      method: "POST",
      path: "/rms/meetings/recordings",
      body
    });

    const recordingId = Number(res.data?.recordingId);
    if (!Number.isFinite(recordingId) || recordingId <= 0) {
      throw new Error(ErrorMessages.RMS_RECORDING_ID_INVALID);
    }
    return recordingId;
  }
}
