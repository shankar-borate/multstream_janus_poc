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
}
