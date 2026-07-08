import type { Params } from "../state/params";
import type { AudioFrame } from "../audio/analyzer";

/** 各モードの draw() に毎フレーム渡される描画コンテキスト */
export interface Frame {
  cx: CanvasRenderingContext2D;
  W: number;
  H: number;
  CX: number;
  CY: number;
  DPR: number;
  /** フレームカウンタ */
  t: number;
  /** 回転の累積角(P.rot を積分したもの) */
  rotAcc: number;
  freq: Uint8Array;
  wave: Uint8Array;
  a: AudioFrame;
  p: Params;
  /** 現在の基準色相(色の流れを含む) */
  hue(): number;
  /** p.sym に応じて描画関数を回転コピーする(万華鏡ミラー) */
  sym(fn: () => void): void;
}

export interface VisualMode {
  id: string;
  label: string;
  draw(f: Frame): void;
}

export const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
