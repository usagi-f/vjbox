import { emit } from "../state/bus";
import {
  P, OPTIONS, glideNum, setDiscrete,
  type DiscreteKey, type Params,
} from "../state/params";
import { MODES } from "../render/modes";
import { targetMode } from "../render/renderer";
import { rnd } from "../render/context";
import type { AudioFrame } from "../audio/analyzer";

/**
 * オートパイロット。
 * - 大変化: 指定間隔ごとにモード切替(クロスフェード) + パラメータのソフトランダム
 * - 小変化: 2秒ごとに1〜3個のパラメータを「見た目に分かる幅」で揺らす
 * どちらも軽くビートに同期する。
 */
const VARY_MS = 2000;

let intervalSec = 0;
let lastSwitch = performance.now();
let lastVary = performance.now();
let playingRef: (() => boolean) | null = null;

export function bindPlaying(fn: () => boolean): void {
  playingRef = fn;
}

export function setInterval(sec: number): void {
  intervalSec = sec;
  lastSwitch = performance.now();
  lastVary = performance.now();
}

export function getInterval(): number {
  return intervalSec;
}

export function tick(a: AudioFrame): void {
  if (!intervalSec || !playingRef?.()) return;
  const now = performance.now();
  const elapsed = now - lastSwitch;
  /* 大変化: 次のビートに合わせて切替(3秒待って無ければ強制) */
  if (elapsed > intervalSec * 1000 && (a.beat || elapsed > intervalSec * 1000 + 3000)) {
    lastSwitch = now;
    lastVary = now;
    switchMode();
    return;
  }
  /* 小変化 */
  if (now - lastVary > VARY_MS && (a.beat || now - lastVary > VARY_MS + 1000)) {
    lastVary = now;
    vary();
  }
}

/* 現在値から必ず minDelta 以上離れた値を選ぶ(見た目に分かる変化を保証) */
function shove(cur: number, min: number, max: number, minDelta: number): number {
  let v = cur;
  let guard = 0;
  do {
    v = rnd(min, max);
  } while (Math.abs(v - cur) < minDelta && ++guard < 40);
  return v;
}

function randDiscrete<K extends DiscreteKey>(key: K): void {
  const all = OPTIONS[key] as unknown as readonly Params[K][];
  const opts = all.filter((v) => v !== P[key]);
  setDiscrete(key, opts[Math.floor(Math.random() * opts.length)]);
}

const VARIATIONS: Array<() => void> = [
  () => glideNum("gain", +shove(P.gain, 0.6, 2.6, 0.5).toFixed(2)),
  () => glideNum("trail", +shove(P.trail, 0.35, 0.97, 0.25).toFixed(2)),
  () => glideNum("fb", +(P.fb < 0.08 ? rnd(0.25, 0.8) : Math.random() < 0.5 ? 0 : rnd(0.05, 0.2)).toFixed(2)),
  () => glideNum("rot", +shove(P.rot, -1, 1, 0.5).toFixed(2)),
  () => glideNum("dens", +shove(P.dens, 0.15, 1, 0.3).toFixed(2)),
  () => glideNum("flow", +shove(P.flow, 0, 2, 0.6).toFixed(2)),
  () => glideNum("punch", +shove(P.punch, 0.3, 1, 0.3).toFixed(2)),
  () => glideNum("hue", P.hue + rnd(60, 160) * (Math.random() < 0.5 ? -1 : 1)),
  () => glideNum("strobe", +(Math.random() < 0.35 ? rnd(0.2, 0.7) : 0).toFixed(2)),
  () => randDiscrete("sym"),
  () => randDiscrete("vari"),
  () => randDiscrete("blend"),
  () => randDiscrete("fbStyle"),
  () => randDiscrete("tex"),
];

function vary(): void {
  const pool = [...VARIATIONS];
  const n = 2 + (Math.random() < 0.4 ? 1 : 0); /* 基本2個、40%で3個 */
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    pool.splice(idx, 1)[0]();
  }
}

function switchMode(): void {
  const cur = targetMode();
  const cands = MODES.filter((m) => m.id !== cur);
  const next = cands[Math.floor(Math.random() * cands.length)];
  emit("mode:request", next.id);

  glideNum("hue", P.hue + rnd(50, 180));
  glideNum("rot", +rnd(-0.6, 0.6).toFixed(2));
  glideNum("dens", +rnd(0.3, 0.9).toFixed(2));
  glideNum("trail", +rnd(0.55, 0.93).toFixed(2));
  glideNum("fb", +(Math.random() < 0.35 ? rnd(0.15, 0.6) : 0).toFixed(2));
  if (Math.random() < 0.5) randDiscrete("blend");
  if (Math.random() < 0.5) randDiscrete("fbStyle");
  if (Math.random() < 0.25) randDiscrete("tex");
  const syms = [1, 1, 2, 4, 6];
  setDiscrete("sym", syms[Math.floor(Math.random() * syms.length)]);
  setDiscrete("vari", 1 + Math.floor(Math.random() * 3));
}

/** ⚡RANDOMIZE: モードもパラメータも一気にガチャ(カット的な演出) */
export function randomizeAll(): void {
  const next = MODES[Math.floor(Math.random() * MODES.length)];
  emit("mode:request", next.id);
  glideNum("gain", +rnd(0.8, 2.2).toFixed(2));
  glideNum("trail", +rnd(0.4, 0.95).toFixed(2));
  glideNum("fb", +(Math.random() < 0.5 ? 0 : rnd(0.1, 0.8)).toFixed(2));
  glideNum("rot", +rnd(-0.8, 0.8).toFixed(2));
  glideNum("dens", +rnd(0.2, 1).toFixed(2));
  glideNum("flow", +rnd(0, 1.5).toFixed(2));
  glideNum("punch", +rnd(0.3, 1).toFixed(2));
  glideNum("strobe", +(Math.random() < 0.3 ? rnd(0.2, 0.8) : 0).toFixed(2));
  glideNum("hue", Math.random() * 360);
  randDiscrete("blend");
  randDiscrete("fbStyle");
  if (Math.random() < 0.4) randDiscrete("tex");
  const syms = [1, 2, 4, 6];
  setDiscrete("sym", syms[Math.floor(Math.random() * syms.length)]);
  setDiscrete("vari", 1 + Math.floor(Math.random() * 3));
}
