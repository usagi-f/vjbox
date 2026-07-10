import type { VisualMode } from "../context";

/** クラシックなスペクトラムアナライザ。vari: 1=下から / 2=中央ミラー / 3=左右対面 */
export const bars: VisualMode = {
  id: "bars",
  label: "BARS",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const n = Math.floor(16 + p.dens * 48);
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.1);
    const sc = 1 + a.beatEnv * p.punch * 0.06;
    cx.scale(sc, sc);
    cx.translate(-f.CX, -f.CY);
    if (p.vari === 3) {
      /* 左右の壁から向かい合って伸びる */
      const bh = H / n;
      for (let i = 0; i < n; i++) {
        const fi = Math.floor(Math.pow(i / n, 1.6) * freq.length * 0.65);
        const v = Math.min(1, (freq[fi] / 255) * g);
        const len = v * W * 0.46;
        const y = i * bh + bh * 0.15;
        const hh = bh * 0.7;
        cx.fillStyle = `hsla(${h0 + v * 80} 90% ${45 + v * 25}% / ${0.35 + v * 0.6})`;
        cx.fillRect(0, y, len, hh);
        cx.fillRect(W - len, y, len, hh);
        if (v > 0.04) {
          cx.fillStyle = `hsl(${h0 + v * 80} 95% 75%)`;
          cx.fillRect(len, y, 3 * DPR, hh);
          cx.fillRect(W - len - 3 * DPR, y, 3 * DPR, hh);
        }
      }
    } else {
      const bw = W / n;
      for (let i = 0; i < n; i++) {
        const fi = Math.floor(Math.pow(i / n, 1.6) * freq.length * 0.65);
        const v = Math.min(1, (freq[fi] / 255) * g);
        const x = i * bw + bw * 0.12;
        const ww = bw * 0.76;
        cx.fillStyle = `hsla(${h0 + v * 80} 90% ${45 + v * 25}% / ${0.35 + v * 0.6})`;
        if (p.vari === 2) {
          /* 中央線から上下対称に伸びる */
          const len = v * H * 0.46;
          cx.fillRect(x, f.CY - len, ww, len * 2);
          if (v > 0.04) {
            cx.fillStyle = `hsl(${h0 + v * 80} 95% 75%)`;
            cx.fillRect(x, f.CY - len - 3 * DPR, ww, 3 * DPR);
            cx.fillRect(x, f.CY + len, ww, 3 * DPR);
          }
        } else {
          const len = v * H * 0.85;
          cx.fillRect(x, H - len, ww, len);
          if (v > 0.04) {
            cx.fillStyle = `hsl(${h0 + v * 80} 95% 75%)`;
            cx.fillRect(x, H - len - 4 * DPR, ww, 3 * DPR);
          }
        }
      }
    }
    cx.restore();
  },
};
