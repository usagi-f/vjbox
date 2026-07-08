import type { VisualMode } from "../context";

/** 円形スペクトラムバー */
export const radial: VisualMode = {
  id: "radial",
  label: "RADIAL",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const bars = Math.floor(48 + p.dens * 140);
    const base = Math.min(W, H) * 0.16 * (1 + a.beatEnv * p.punch * 0.35);
    const h0 = f.hue();
    cx.lineCap = "round";
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc);
      cx.globalCompositeOperation = p.blend;
      for (let i = 0; i < bars; i++) {
        const fi = Math.floor(Math.pow(i / bars, 1.6) * freq.length * 0.7);
        const v = (freq[fi] / 255) * p.gain;
        const ang = (i / bars) * Math.PI * 2;
        const len = base * 0.15 + v * v * Math.min(W, H) * 0.34;
        const c = Math.cos(ang), s = Math.sin(ang);
        cx.strokeStyle = `hsl(${h0 + (i / bars) * 90} 90% ${45 + v * 30}%)`;
        cx.lineWidth = (1.2 + v * 3) * DPR;
        cx.beginPath();
        cx.moveTo(c * base, s * base);
        cx.lineTo(c * (base + len), s * (base + len));
        cx.stroke();
      }
      /* core */
      cx.beginPath();
      cx.arc(0, 0, base * (0.55 + a.beatEnv * p.punch * 0.4), 0, Math.PI * 2);
      cx.strokeStyle = `hsl(${h0} 90% 65%)`;
      cx.lineWidth = (1.5 + a.beatEnv * 4 * p.punch) * DPR;
      cx.stroke();
      cx.restore();
    });
  },
};
