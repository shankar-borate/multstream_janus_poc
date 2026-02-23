type JoinConfig = { server:string; roomId:number; display:string; };
type ParticipantSnapshot = { roomId:number; participantIds:number[]; selfId?:number; };
type VcxServer = {server:string, client_id:string};
