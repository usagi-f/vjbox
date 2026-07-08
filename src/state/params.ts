import { emit } from "./bus";

export type BlendMode = "lighter" | "screen" | "source-over" | "difference";
export type FbStyle = "out" | "in" | "spin" | "drift" | "mir";
export type TexStyle = "off" | "scan" | "dot";

export interface Params {
  mode: string;
  gain: number;
  trail: number;
  fb: number;
  rot: number;
  dens: number;
  hue: number;
  flow: number;
  punch: number;
  strobe: number;
  sym: number;
  blend: BlendMode;
  fbStyle: FbStyle;
  tex: TexStyle;
}

export type NumKey =
  | "gain" | "trail" | "fb" | "rot" | "dens"
  | "hue" | "flow" | "punch" | "strobe";
export type DiscreteKey = "sym" | "blend" | "fbStyle" | "tex";

export const P: Params = {
  mode: "radial",
  gain: 1.2, trail: 0.7, fb: 0, rot: 0.2, dens: 0.5,
  hue: 190, flow: 0.3, punch: 0.6, strobe: 0,
  sym: 1,
  blend: "lighter", fbStyle: "out", tex: "off",
};

export const OPTIONS = {
  sym: [1, 2, 4, 6],
  blend: ["lighter", "screen", "source-over", "difference"],
  fbStyle: ["out", "in", "spin", "drift", "mir"],
  tex: ["off", "scan", "dot"],
} as const;

const glide = new Map<NumKey, number>();

/** 手動設定: 即時反映し、進行中のグライドは解除 */
export function setNum(key: NumKey, value: number): void {
  glide.delete(key);
  P[key] = value;
}

/** 自動設定: 実値は目標へ滑らかに追従。UIには目標値を通知 */
export function glideNum(key: NumKey, target: number): void {
  glide.set(key, target);
  emit("param:num", { key, value: target });
}

export function setDiscrete<K extends DiscreteKey>(key: K, value: Params[K]): void {
  P[key] = value;
  emit("param:discrete", { key, value });
}

/** 毎フレーム呼び、グライド中の値を目標へ寄せる(約1秒で収束) */
export function tickGlide(): void {
  for (const [key, target] of glide) {
    P[key] += (target - P[key]) * 0.06;
    if (Math.abs(target - P[key]) < 0.002) {
      P[key] = target;
      if (key === "hue") P.hue = ((P.hue % 360) + 360) % 360;
      glide.delete(key);
    }
  }
}
