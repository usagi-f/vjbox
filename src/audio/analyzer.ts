/** FFTスペクトル・波形の取得と、低域エネルギー移動平均によるビート検出 */
export interface AudioFrame {
  level: number;
  bass: number;
  mid: number;
  treb: number;
  beat: boolean;
  beatEnv: number;
}

export class Analyzer {
  /** ファイル投入前でも描画が破綻しないようダミーで初期化 */
  freq = new Uint8Array(1024);
  wave = new Uint8Array(2048);
  readonly frame: AudioFrame = { level: 0, bass: 0, mid: 0, treb: 0, beat: false, beatEnv: 0 };
  node: AnalyserNode | null = null;

  private hist = new Float32Array(43);
  private hi = 0;
  private lastBeat = 0;

  constructor() {
    this.wave.fill(128);
  }

  attach(ctx: AudioContext): AnalyserNode {
    this.node = ctx.createAnalyser();
    this.node.fftSize = 2048;
    this.node.smoothingTimeConstant = 0.72;
    this.freq = new Uint8Array(this.node.frequencyBinCount);
    this.wave = new Uint8Array(this.node.fftSize);
    this.wave.fill(128);
    return this.node;
  }

  analyze(): void {
    const f = this.frame;
    if (!this.node) {
      f.level *= 0.95;
      f.beatEnv *= 0.9;
      return;
    }
    this.node.getByteFrequencyData(this.freq);
    this.node.getByteTimeDomainData(this.wave);

    const n = this.freq.length;
    const bEnd = Math.floor(n * 0.04);
    const mEnd = Math.floor(n * 0.25);
    let bass = 0, mid = 0, treb = 0;
    for (let i = 0; i < bEnd; i++) bass += this.freq[i];
    for (let i = bEnd; i < mEnd; i++) mid += this.freq[i];
    for (let i = mEnd; i < n; i++) treb += this.freq[i];
    bass /= bEnd * 255;
    mid /= (mEnd - bEnd) * 255;
    treb /= (n - mEnd) * 255;

    f.bass = bass;
    f.mid = mid;
    f.treb = treb;
    f.level = f.level * 0.8 + (bass * 0.5 + mid * 0.35 + treb * 0.15) * 0.2;

    /* beat: 低域エネルギーが移動平均を大きく超えたら発火 */
    let avg = 0;
    for (let i = 0; i < this.hist.length; i++) avg += this.hist[i];
    avg /= this.hist.length;
    this.hist[this.hi] = bass;
    this.hi = (this.hi + 1) % this.hist.length;

    const now = performance.now();
    f.beat = false;
    if (bass > 0.12 && bass > avg * 1.32 && now - this.lastBeat > 230) {
      f.beat = true;
      this.lastBeat = now;
      f.beatEnv = 1;
    }
    f.beatEnv *= 0.915;
  }
}
