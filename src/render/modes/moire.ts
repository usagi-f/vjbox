import type { VisualMode } from "../context";

/** 同心円の干渉縞モアレ。vari: 1=2中心 / 2=3中心回転 / 3=放射線干渉 */
export const moire: VisualMode = {
  id: "moire",
  label: "MOIRE",
  draw(f) {
    const { cx, W, H, DPR, a, p, t } = f;
    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H);
    const centers = p.vari === 2 ? 3 : 2;
    const sep = F * (0.06 + 0.1 * Math.sin(t * 0.01)) * (1 + a.bass * g * 1.2);
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.4);
    for (let c = 0; c < centers; c++) {
      const ang = (c * Math.PI * 2) / centers + (p.vari === 2 ? t * 0.008 : 0);
      const ox = Math.cos(ang) * sep;
      const oy = Math.sin(ang) * sep;
      const hue = h0 + c * 40;
      if (p.vari === 3) {
        /* 放射線同士の干渉 */
        const lines = Math.floor(40 + p.dens * 80);
        const R = Math.hypot(W, H) * 0.6;
        cx.strokeStyle = `hsla(${hue} 90% 58% / .35)`;
        cx.lineWidth = (0.7 + a.beatEnv * p.punch) * DPR;
        cx.beginPath();
        for (let i = 0; i < lines; i++) {
          const la = (i / lines) * Math.PI * 2 + c * 0.02 + t * 0.001 * (c === 0 ? 1 : -1);
          cx.moveTo(ox, oy);
          cx.lineTo(ox + Math.cos(la) * R, oy + Math.sin(la) * R);
        }
        cx.stroke();
      } else {
        const nRings = Math.floor(14 + p.dens * 30);
        const gap = (F * 0.55) / nRings * (1 + a.level * g * 0.3);
        cx.strokeStyle = `hsla(${hue} 90% 58% / .4)`;
        cx.lineWidth = (0.8 + a.beatEnv * p.punch * 1.5) * DPR;
        cx.beginPath();
        for (let i = 1; i <= nRings; i++) {
          cx.moveTo(ox + i * gap, oy);
          cx.arc(ox, oy, i * gap, 0, Math.PI * 2);
        }
        cx.stroke();
      }
    }
    cx.restore();
  },
};
