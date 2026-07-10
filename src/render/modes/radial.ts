import type { VisualMode } from "../context";

/** 円形スペクトラムバー。vari: 1=バー / 2=パール / 3=ウェッジ */
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
        if (p.vari === 2) {
          /* バーの代わりに玉を連ねる */
          const dots = 2 + Math.floor(v * 5);
          cx.fillStyle = `hsl(${h0 + (i / bars) * 90} 90% ${45 + v * 30}%)`;
          for (let d = 0; d < dots; d++) {
            const rr = base + (len * (d + 1)) / dots;
            cx.beginPath();
            cx.arc(c * rr, s * rr, (1 + v * 2.6) * DPR, 0, Math.PI * 2);
            cx.fill();
          }
        } else if (p.vari === 3) {
          /* 扇形ウェッジで塗る */
          cx.fillStyle = `hsla(${h0 + (i / bars) * 90} 90% ${45 + v * 30}% / .5)`;
          cx.beginPath();
          cx.moveTo(c * base, s * base);
          cx.arc(0, 0, base + len, ang - Math.PI / bars, ang + Math.PI / bars);
          cx.closePath();
          cx.fill();
        } else {
          cx.strokeStyle = `hsl(${h0 + (i / bars) * 90} 90% ${45 + v * 30}%)`;
          cx.lineWidth = (1.2 + v * 3) * DPR;
          cx.beginPath();
          cx.moveTo(c * base, s * base);
          cx.lineTo(c * (base + len), s * (base + len));
          cx.stroke();
        }
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
