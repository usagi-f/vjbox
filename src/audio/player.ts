import { emit } from "../state/bus";
import { Analyzer } from "./analyzer";

/**
 * <audio>要素 + blob URL は sandbox/CSP 環境で弾かれることがあるため、
 * decodeAudioData → AudioBufferSourceNode で直接再生する。
 * 経路: BufferSource → AnalyserNode → GainNode → destination
 */
export class Player {
  readonly analyzer = new Analyzer();
  playing = false;
  name = "";

  private ctx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  private offset = 0;
  private startedAt = 0;
  private manualStop = false;
  private volume = 0.8;

  get duration(): number {
    return this.buffer ? this.buffer.duration : 0;
  }

  get currentTime(): number {
    if (!this.buffer || !this.ctx) return 0;
    return this.playing
      ? Math.min(this.ctx.currentTime - this.startedAt, this.duration)
      : this.offset;
  }

  get loaded(): boolean {
    return this.buffer !== null;
  }

  private init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.analyserNode = this.analyzer.attach(this.ctx);
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.volume;
    this.analyserNode.connect(this.gain);
    this.gain.connect(this.ctx.destination);
  }

  async load(file: File): Promise<void> {
    await this.loadArrayBuffer(await file.arrayBuffer(), file.name);
  }

  /** URL 取得や File 以外の経路からも同じデコード再生ができるようにする */
  async loadArrayBuffer(data: ArrayBuffer, name: string): Promise<void> {
    this.init();
    if (this.ctx!.state === "suspended") await this.ctx!.resume().catch(() => {});
    this.pause();
    this.buffer = await this.ctx!.decodeAudioData(data);
    this.name = name;
    this.play(0);
    emit("player:loaded");
  }

  play(from?: number): void {
    if (!this.buffer || !this.ctx || !this.analyserNode) return;
    this.stopNode();
    if (from !== undefined) this.offset = from;
    if (this.offset >= this.duration) this.offset = 0;

    const node = this.ctx.createBufferSource();
    node.buffer = this.buffer;
    node.connect(this.analyserNode);
    node.onended = () => {
      if (this.manualStop) {
        this.manualStop = false;
        return;
      }
      /* 自然終了 */
      this.playing = false;
      this.offset = 0;
      emit("player:state");
      emit("player:ended");
    };
    node.start(0, this.offset);
    this.node = node;
    this.startedAt = this.ctx.currentTime - this.offset;
    this.playing = true;
    emit("player:state");
  }

  pause(): void {
    if (!this.playing) return;
    this.offset = this.currentTime;
    this.stopNode();
    this.playing = false;
    emit("player:state");
  }

  toggle(): void {
    if (!this.buffer) return;
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    if (this.playing) this.pause();
    else this.play();
  }

  seek(sec: number): void {
    sec = Math.max(0, Math.min(sec, this.duration));
    if (this.playing) this.play(sec);
    else this.offset = sec;
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.gain) this.gain.gain.value = v;
  }

  private stopNode(): void {
    if (!this.node) return;
    this.manualStop = true;
    try { this.node.stop(); } catch { /* already stopped */ }
    this.node.disconnect();
    this.node = null;
  }
}

export const player = new Player();
