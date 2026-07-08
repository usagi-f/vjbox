import type { VisualMode } from "../context";

/** 銀河風の渦巻きアーム */
export const spiral: VisualMode = {
  id: "spiral",
  label: "SPIRAL",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const arms = 2 + Math.floor(p.dens * 6);
    const h0 = f.hue();
    const g = p.gain;
    const maxR = Math.min(W, H) * 0.5 * (1 + a.beatEnv * p.punch * 0.2);
    const steps = 90;
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc);
    for (let arm = 0; arm < arms; arm++) {
      cx.strokeStyle = `hsla(${h0 + (arm / arms) * 110} 90% 60% / .8)`;
      cx.lineWidth = (1.4 + a.level * g * 3 + a.beatEnv * p.punch * 2) * DPR;
      cx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const fr = i / steps;
        const fi = Math.floor(fr * freq.length * 0.5);
        const mod = 1 + (freq[fi] / 255 - 0.3) * 0.55 * g;
        const th = fr * Math.PI * 4.6 + (arm * Math.PI * 2) / arms;
        const r = fr * maxR * mod;
        const x = Math.cos(th) * r;
        const y = Math.sin(th) * r;
        if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.stroke();
    }
    cx.restore();
  },
};
