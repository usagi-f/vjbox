import type { VisualMode } from "../context";

/** シンセウェーブの遠近グリッド + 太陽 */
let scroll = 0;

export const floor: VisualMode = {
  id: "floor",
  label: "FLOOR",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const h0 = f.hue();
    const g = p.gain;
    const horizon = H * 0.42;
    scroll += 0.008 * (1 + a.level * g * 2) + a.beatEnv * p.punch * 0.012;
    cx.globalCompositeOperation = p.blend;
    /* sun */
    const sunR = Math.min(W, H) * 0.16 * (1 + a.bass * g * 0.35);
    const sy = horizon - sunR * 0.45;
    const grad = cx.createRadialGradient(f.CX, sy, 0, f.CX, sy, sunR);
    grad.addColorStop(0, `hsla(${(h0 + 40) % 360} 95% 65% / .85)`);
    grad.addColorStop(1, `hsla(${(h0 + 40) % 360} 95% 55% / 0)`);
    cx.fillStyle = grad;
    cx.beginPath();
    cx.arc(f.CX, sy, sunR, 0, Math.PI * 2);
    cx.fill();
    /* horizon */
    cx.strokeStyle = `hsla(${h0} 90% 60% / .9)`;
    cx.lineWidth = 1.5 * DPR;
    cx.beginPath();
    cx.moveTo(0, horizon);
    cx.lineTo(W, horizon);
    cx.stroke();
    /* horizontals scrolling toward viewer */
    const rows = 10 + Math.floor(p.dens * 14);
    const frac = scroll % 1;
    for (let i = 0; i < rows; i++) {
      const fr = (i + frac) / rows;
      const y = horizon + (H - horizon) * fr * fr;
      const fi = Math.floor(fr * freq.length * 0.15);
      const v = (freq[fi] / 255) * g;
      cx.strokeStyle = `hsla(${h0} 90% ${50 + v * 25}% / ${0.2 + fr * 0.65})`;
      cx.lineWidth = (0.8 + fr * 2.2 + v) * DPR;
      cx.beginPath();
      cx.moveTo(0, y);
      cx.lineTo(W, y);
      cx.stroke();
    }
    /* verticals from vanishing point */
    const vcount = 14 + Math.floor(p.dens * 14);
    for (let i = 0; i <= vcount; i++) {
      const fr = i / vcount - 0.5;
      cx.strokeStyle = `hsla(${h0} 90% 55% / ${0.55 - Math.abs(fr)})`;
      cx.lineWidth = 1 * DPR;
      cx.beginPath();
      cx.moveTo(f.CX + fr * W * 0.06, horizon);
      cx.lineTo(f.CX + fr * W * 2.3, H);
      cx.stroke();
    }
  },
};
