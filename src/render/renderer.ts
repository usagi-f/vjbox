import { on, emit } from "../state/bus";
import { P, tickGlide } from "../state/params";
import { player } from "../audio/player";
import { MODE_BY_ID } from "./modes";
import type { Frame } from "./context";
import { tick as directorTick } from "../auto/director";

const cv = document.getElementById("stage") as HTMLCanvasElement;
const cx = cv.getContext("2d")!;

let W = 0, H = 0, CX = 0, CY = 0, DPR = 1;
let t = 0, rotAcc = 0, hueAcc = 0, strobeLeft = 0;

/* ---- texture patterns (CRT走査線 / ハーフトーン) ---- */
const texPat: Record<string, CanvasPattern | null> = { scan: null, dot: null };

function buildTex(): void {
  const mk = (draw: (g: CanvasRenderingContext2D, s: number) => void): CanvasPattern | null => {
    const s = Math.max(4, Math.round(4 * DPR));
    const c2 = document.createElement("canvas");
    c2.width = s;
    c2.height = s;
    const g = c2.getContext("2d")!;
    draw(g, s);
    return cx.createPattern(c2, "repeat");
  };
  texPat.scan = mk((g, s) => {
    g.fillStyle = "rgba(0,0,0,.5)";
    g.fillRect(0, 0, s, s / 2);
  });
  texPat.dot = mk((g, s) => {
    g.fillStyle = "rgba(0,0,0,.5)";
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
  });
}

function resize(): void {
  DPR = Math.min(devicePixelRatio || 1, 1.75);
  W = cv.width = Math.floor(innerWidth * DPR);
  H = cv.height = Math.floor(innerHeight * DPR);
  CX = W / 2;
  CY = H / 2;
  buildTex();
  cx.fillStyle = "#000";
  cx.fillRect(0, 0, W, H);
}

/* ---- mode crossfade ---- */
interface Transition { from: string; to: string; k: number; }
let trans: Transition | null = null;

function fadeToMode(id: string): void {
  /* 進行中の遷移があれば現時点の優勢側で確定してから始める */
  if (trans) {
    P.mode = trans.k > 0.5 ? trans.to : trans.from;
    trans = null;
  }
  if (id === P.mode || !MODE_BY_ID.has(id)) return;
  trans = { from: P.mode, to: id, k: 0 };
}

/** 現在向かっているモード(遷移中なら遷移先) */
export function targetMode(): string {
  return trans ? trans.to : P.mode;
}

/* ---- frame context ---- */
const frame: Frame = {
  cx,
  get W() { return W; },
  get H() { return H; },
  get CX() { return CX; },
  get CY() { return CY; },
  get DPR() { return DPR; },
  get t() { return t; },
  get rotAcc() { return rotAcc; },
  get freq() { return player.analyzer.freq; },
  get wave() { return player.analyzer.wave; },
  a: player.analyzer.frame,
  p: P,
  hue: () => (P.hue + hueAcc) % 360,
  sym(fn: () => void): void {
    const k = P.sym;
    if (k <= 1) {
      fn();
      return;
    }
    for (let i = 0; i < k; i++) {
      cx.save();
      cx.translate(CX, CY);
      cx.rotate((i * Math.PI * 2) / k);
      cx.translate(-CX, -CY);
      fn();
      cx.restore();
    }
  },
};

/* ---- main loop ---- */
function loop(): void {
  requestAnimationFrame(loop);
  const a = player.analyzer.frame;
  player.analyzer.analyze();
  directorTick(a);
  tickGlide();
  t += 1;
  rotAcc += P.rot * 0.01 * (1 + a.beatEnv * P.punch);
  hueAcc += P.flow * (0.5 + a.level);

  /* feedback (canvas self-copy) — 型で性格が変わる */
  if (P.fb > 0.005) {
    const k = P.fb;
    const pj = a.beatEnv * P.punch;
    cx.globalCompositeOperation = "source-over";
    cx.save();
    cx.translate(CX, CY);
    switch (P.fbStyle) {
      case "out": {
        const s = 1 + k * 0.045 * (1 + pj * 0.8);
        cx.scale(s, s);
        cx.rotate(P.rot * 0.004);
        break;
      }
      case "in": {
        const s = 1 - k * 0.028 * (1 + pj * 0.5);
        cx.scale(s, s);
        cx.rotate(-P.rot * 0.004);
        break;
      }
      case "spin": {
        const s = 1 + k * 0.008;
        cx.scale(s, s);
        cx.rotate(k * 0.05 * (P.rot >= 0 ? 1 : -1) * (1 + pj * 0.6));
        break;
      }
      case "drift":
        cx.rotate(P.rot * 0.002);
        cx.translate(Math.sin(t * 0.02) * k * 26 * DPR, Math.cos(t * 0.013) * k * 26 * DPR);
        break;
      case "mir": {
        const s = 1 + k * 0.03;
        cx.scale(-s, s);
        break;
      }
    }
    cx.translate(-CX, -CY);
    cx.globalAlpha = 0.96;
    cx.drawImage(cv, 0, 0);
    cx.restore();
    cx.globalAlpha = 1;
  }

  /* trail: 前フレームを暗くする */
  cx.globalCompositeOperation = "source-over";
  cx.fillStyle = `rgba(0,0,5,${(1 - P.trail) * 0.9 + 0.03})`;
  cx.fillRect(0, 0, W, H);

  /* modes (クロスフェード対応) */
  if (trans) {
    trans.k += 0.011; /* 約1.5秒 */
    const s = Math.min(1, trans.k);
    const e = s * s * (3 - 2 * s); /* smoothstep */
    cx.globalAlpha = 1 - e;
    MODE_BY_ID.get(trans.from)!.draw(frame);
    cx.globalAlpha = e;
    MODE_BY_ID.get(trans.to)!.draw(frame);
    cx.globalAlpha = 1;
    if (trans.k >= 1) {
      P.mode = trans.to;
      trans = null;
    }
  } else {
    MODE_BY_ID.get(P.mode)!.draw(frame);
  }

  /* texture overlay */
  if (P.tex !== "off" && texPat[P.tex]) {
    cx.globalCompositeOperation = "source-over";
    cx.fillStyle = texPat[P.tex]!;
    cx.fillRect(0, 0, W, H);
  }

  /* strobe: ビートで2フレームだけ全画面を色反転 */
  if (P.strobe > 0.01 && a.beat && Math.random() < P.strobe) strobeLeft = 2;
  if (strobeLeft > 0) {
    strobeLeft--;
    cx.globalCompositeOperation = "difference";
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, W, H);
  }

  /* HUD更新(LED・アクセント色・再生時間) */
  if (t % 5 === 0) {
    emit("hud", {
      beatOn: a.beatEnv > 0.25,
      hue: frame.hue(),
      time: player.currentTime,
      duration: player.duration,
    });
  }
}

export function startRenderer(): void {
  addEventListener("resize", resize);
  resize();
  on("mode:request", (id) => fadeToMode(id as string));
  requestAnimationFrame(loop);
}
