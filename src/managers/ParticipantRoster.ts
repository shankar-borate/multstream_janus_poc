class ParticipantRoster {
  private ids = new Set<number>();
  private selfId?: number;
  setSelf(id:number){ this.selfId=id; this.ids.add(id); }
  add(id:number){ this.ids.add(id); }
  remove(id:number){ this.ids.delete(id); }
  has(id:number){ return this.ids.has(id); }
  snapshot(roomId:number):ParticipantSnapshot{
    return { roomId, participantIds:Array.from(this.ids.values()), selfId:this.selfId };
  }
  reset(){ this.ids.clear(); this.selfId=undefined; }
}
