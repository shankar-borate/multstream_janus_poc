type NetQuality = "High"|"Medium"|"Low";

class NetworkQualityManager {
  private timer:number|null=null;

  start(cb:(local:NetQuality, remote:NetQuality, details:string)=>void){
    this.stop();
    this.timer = window.setInterval(()=>{
      // synthetic values (replace with getStats wiring)
      const rtt = Math.round(
        APP_CONFIG.networkQuality.simulated.rttBaseMs +
        Math.random() * APP_CONFIG.networkQuality.simulated.rttSpreadMs
      );
      const jitter = Math.round(
        APP_CONFIG.networkQuality.simulated.jitterBaseMs +
        Math.random() * APP_CONFIG.networkQuality.simulated.jitterSpreadMs
      );
      const loss = Math.round(Math.random() * APP_CONFIG.networkQuality.simulated.lossMaxPct);
      const bitrate = Math.round(
        APP_CONFIG.networkQuality.simulated.bitrateBaseKbps +
        Math.random() * APP_CONFIG.networkQuality.simulated.bitrateSpreadKbps
      );

      const q = this.calc(rtt,jitter,loss,bitrate);
      const details = `rtt=${rtt}ms jitter=${jitter}ms loss=${loss}% bitrate=${bitrate}kbps`;
      cb(q,q,details);
    }, APP_CONFIG.networkQuality.sampleIntervalMs);
  }

  stop(){
    if(this.timer!=null){ clearInterval(this.timer); this.timer=null; }
  }

  private calc(rtt:number,jitter:number,loss:number,bitrate:number):NetQuality{
    let score=0;
    if(rtt<APP_CONFIG.networkQuality.thresholds.rttGoodMs) score++;
    if(jitter<APP_CONFIG.networkQuality.thresholds.jitterGoodMs) score++;
    if(loss<APP_CONFIG.networkQuality.thresholds.lossGoodPct) score++;
    if(bitrate>APP_CONFIG.networkQuality.thresholds.bitrateGoodKbps) score++;
    if(score>=4) return "High";
    if(score>=2) return "Medium";
    return "Low";
  }
}
