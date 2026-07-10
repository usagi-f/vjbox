import { rnd, type Frame, type VisualMode } from "../context";

interface Ripple {
  x: number; y: number; r: number; sp: number; hue: number; w: number;
}

const ripples: Ripple[] = [];

function newRipple(f: Frame, centered: boolean): Ripple {
  return {
    x: centered ? f.CX : rnd(f.W * 0.15, f.W * 0.85),
    y: centered ? f.CY : rnd(f.H * 0.15, f.H * 0.85),
    r: 4 * f.DPR,
    sp: rnd(2.5, 6) * f.DPR,
    hue: f.hue() + rnd(-30, 30),
    w: rnd(1.5, 4),
  };
}

/** ビートで広がる波紋リング。vari: 1=中心波紋 / 2=ランダム位置 / 3=回転アーク */
export const rings: VisualMode = {
  id: "rings",
  label: "RINGS",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const centered = p.vari !== 2;
    if (a.beat) {
      const n = 1 + Math.round(p.punch * 3);
      for (let i = 0; i < n; i++) ripples.push(newRipple(f, centered));
    }
    if (ripples.length < 3 + p.dens * 10 && Math.random() < 0.06 + a.level * 0.2) {
      ripples.push(newRipple(f, centered));
    }
    const h0 = f.hue();
    const maxR = Math.hypot(W, H) * 0.55;
    cx.globalCompositeOperation = p.blend;
    f.sym(() => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += r.sp * (0.6 + a.level * p.gain * 1.6);
        if (r.r > maxR) {
          ripples.splice(i, 1);
          continue;
        }
        const fade = 1 - r.r / maxR;
        cx.strokeStyle = `hsla(${r.hue} 90% ${50 + fade * 25}% / ${fade * 0.9})`;
        cx.lineWidth = r.w * (1 + a.beatEnv * p.punch * 1.5) * DPR;
        if (p.vari === 3) {
          /* 回転する円弧セグメント */
          const segs = 4;
          const span = Math.PI / 3.2;
          const base = f.rotAcc * 2 + r.r * 0.004;
          for (let s = 0; s < segs; s++) {
            const a0 = base + (s / segs) * Math.PI * 2;
            cx.beginPath();
            cx.arc(r.x, r.y, r.r, a0, a0 + span);
            cx.stroke();
          }
        } else {
          cx.beginPath();
          cx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          cx.stroke();
        }
      }
    });
    /* 中心のパルスコア */
    if (p.vari !== 2) {
      const base = Math.min(W, H) * 0.05 * (1 + a.bass * p.gain + a.beatEnv * p.punch);
      cx.fillStyle = `hsla(${h0} 92% 68% / .8)`;
      cx.beginPath();
      cx.arc(f.CX, f.CY, base, 0, Math.PI * 2);
      cx.fill();
    }
  },
};
