interface RmsCreateMeetingRequest {
  groupId: null;
  meetingType: 1;
  to: number;
  recordingMethod: 2;
  autoRecording: false;
  recordingType: 1;
  alwaysCreateNewMeeting: true;
}

interface RmsCreateMeetingResponse {
  meetingId: number;
  autoRecording?: boolean;
  meetingType?: number;
  to?: number;
  recordingMethod?: number;
  recordingType?: number;
  alwaysCreateNewMeeting?: boolean;
  alwaysCreateNewRecording?: boolean;
  autoConnect?: boolean;
}
