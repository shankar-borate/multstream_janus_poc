interface RmsCreateMeetingRequest {
  groupId: number;
  meetingType: 1;
  to: number;
  recordingMethod: 2;
  autoRecording: false;
  recordingType: 1;
  alwaysCreateNewMeeting: false;
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

interface RmsCreateRecordingRequest {
  to: number;
  meetingId: number;
  recordingMethod: 2;
  recordingType: 1;
  alwaysCreateNewRecording: true;
}

interface RmsCreateRecordingResponse {
  meetingId: number;
  recordingId: number;
  autoRecording?: boolean;
  to?: number;
  recordingMethod?: number;
  recordingType?: number;
  alwaysCreateNewMeeting?: boolean;
  alwaysCreateNewRecording?: boolean;
  autoConnect?: boolean;
}
