import type { VisualMode } from "../context";

/** バラ曲線 (r = cos kθ) の花。vari: 1=輪郭 / 2=塗り重ね / 3=点描 */
export const petals: VisualMode = {
  id: "petals",
  label: "PETAL",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const h0 = f.hue();
    const g = p.gain;
    const k = 2 + Math.floor(p.dens * 5); /* 花びらの枚数を決める */
    const R = Math.min(W, H) * 0.38 * (1 + a.beatEnv * p.punch * 0.3);
    const steps = 240;
    const layers = p.vari === 2 ? 3 : 1;
    cx.globalCompositeOperation = p.blend;
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc);
      for (let L = 0; L < layers; L++) {
        const lr = 1 - L * 0.28;
        const lrot = L * 0.35 + t * 0.002 * (L % 2 === 0 ? 1 : -1);
        if (p.vari === 3) {
          /* 曲線上に光点を散らす */
          for (let i = 0; i < steps; i += 3) {
            const th = (i / steps) * Math.PI * 2;
            const fi = Math.floor((i / steps) * freq.length * 0.4);
            const v = (freq[fi] / 255) * g;
            const r = R * Math.abs(Math.cos(k * th)) * (0.55 + v * 0.65);
            cx.fillStyle = `hsla(${h0 + (i / steps) * 100} 90% ${52 + v * 28}% / ${0.4 + v * 0.6})`;
            cx.beginPath();
            cx.arc(Math.cos(th) * r, Math.sin(th) * r, (1 + v * 3.2) * DPR, 0, Math.PI * 2);
            cx.fill();
          }
        } else {
          cx.save();
          cx.rotate(lrot);
          cx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const th = (i / steps) * Math.PI * 2;
            const fi = Math.floor((i / steps) * freq.length * 0.4);
            const v = (freq[fi] / 255) * g;
            const r = R * lr * Math.abs(Math.cos(k * th)) * (0.55 + v * 0.65);
            const x = Math.cos(th) * r;
            const y = Math.sin(th) * r;
            if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
          }
          cx.closePath();
          if (p.vari === 2) {
            cx.fillStyle = `hsla(${h0 + L * 45} 90% 55% / ${0.22 - L * 0.05})`;
            cx.fill();
          }
          cx.strokeStyle = `hsla(${h0 + L * 45 + 30} 92% 62% / ${0.85 - L * 0.2})`;
          cx.lineWidth = (1.4 + a.level * g * 2.5 + a.beatEnv * p.punch * 2) * DPR;
          cx.stroke();
          cx.restore();
        }
      }
      /* 花芯 */
      cx.fillStyle = `hsla(${h0 + 60} 92% 70% / .85)`;
      cx.beginPath();
      cx.arc(0, 0, Math.min(W, H) * 0.02 * (1 + a.bass * g * 1.5), 0, Math.PI * 2);
      cx.fill();
      cx.restore();
    });
  },
};
