type NetQuality = "High"|"Medium"|"Low";

class NetworkQualityManager {
  private timer:number|null=null;

  start(cb:(local:NetQuality, remote:NetQuality, details:string)=>void){
    this.stop();
    this.timer = window.setInterval(()=>{
      // synthetic values (replace with getStats wiring)
      const rtt = Math.round(30 + Math.random()*200);
      const jitter = Math.round(3 + Math.random()*60);
      const loss = Math.round(Math.random()*8);
      const bitrate = Math.round(150 + Math.random()*1000);

      const q = this.calc(rtt,jitter,loss,bitrate);
      const details = `rtt=${rtt}ms jitter=${jitter}ms loss=${loss}% bitrate=${bitrate}kbps`;
      cb(q,q,details);
    }, 3000);
  }

  stop(){
    if(this.timer!=null){ clearInterval(this.timer); this.timer=null; }
  }

  private calc(rtt:number,jitter:number,loss:number,bitrate:number):NetQuality{
    let score=0;
    if(rtt<120) score++;
    if(jitter<30) score++;
    if(loss<2) score++;
    if(bitrate>400) score++;
    if(score>=4) return "High";
    if(score>=2) return "Medium";
    return "Low";
  }
}
