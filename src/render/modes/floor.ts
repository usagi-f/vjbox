import type { VisualMode } from "../context";

/** シンセウェーブの遠近グリッド + 太陽。vari: 1=グリッド / 2=山脈入り / 3=天井ミラー */
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
    /* mountains (vari 2): 太陽の手前にスペクトルの山脈 */
    if (p.vari === 2) {
      const mcols = 64;
      cx.beginPath();
      cx.moveTo(0, horizon);
      for (let i = 0; i <= mcols; i++) {
        const fr = i / mcols;
        const fi = Math.floor(Math.abs(fr - 0.5) * 2 * freq.length * 0.3);
        const v = (freq[fi] / 255) * g;
        const env = Math.sin(fr * Math.PI);
        cx.lineTo(fr * W, horizon - v * H * 0.22 * (0.25 + env * 0.9));
      }
      cx.lineTo(W, horizon);
      cx.closePath();
      cx.globalCompositeOperation = "source-over";
      cx.fillStyle = `hsla(${(h0 + 250) % 360} 45% 9% / .95)`;
      cx.fill();
      cx.globalCompositeOperation = p.blend;
      cx.strokeStyle = `hsla(${(h0 + 320) % 360} 90% 60% / .85)`;
      cx.lineWidth = 1.4 * DPR;
      cx.stroke();
    }
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
      if (p.vari === 3) {
        /* 天井側にも同じ線を映す */
        const yc = horizon - horizon * fr * fr;
        cx.moveTo(0, yc);
        cx.lineTo(W, yc);
      }
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
      if (p.vari === 3) {
        cx.moveTo(f.CX + fr * W * 0.06, horizon);
        cx.lineTo(f.CX + fr * W * 2.3, 0);
      }
      cx.stroke();
    }
  },
};
